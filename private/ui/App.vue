<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { HANDLES } from "@game/player.js";
import { SCRATCH_HANDLES } from "@game/scratch.js";
import { ACHIEVEMENTS } from "@game/achievements.js";
import { CONDENSED_UPGRADES, CONDENSED_UPGRADE_PLACEHOLDERS } from "@game/condensed.js";
import { TABS } from "@game/tabs.js";
import { exportSave, importSave, resetForCondense, resetGame as resetGameData, saveGame } from "@game/save.js";
import { getUpdateRate, setUpdateRate, skipTimeSimulation, speedUpTimeSimulation, subscribeToTimeSimulation } from "@game/tick.js";
import { namedWasm } from "@generated/_wasm$globals.js";
import GameHeader from "./components/GameHeader.vue";
import GoalProgressBar from "./components/GoalProgressBar.vue";
import TabNavigation from "./components/TabNavigation.vue";
import ManaTab from "./tabs/ManaTab.vue";
import CondensedTab from "./tabs/CondensedTab.vue";
import OptionsTab from "./tabs/OptionsTab.vue";
import StatisticsTab from "./tabs/StatisticsTab.vue";
import AchievementsTab from "./tabs/AchievementsTab.vue";
import NotificationStack from "./components/NotificationStack.vue";
import TimeSimulation from "./components/TimeSimulation.vue";
import { showNotification } from "./notifications.js";

const activeTab = ref("mana");
const activeSubtabs = ref(Object.fromEntries(TABS.map((tab) => [tab.id, tab.subtabs?.[0]?.id ?? ""])));
const mana = ref("0");
const canCondense = ref(false);
const brokenInfinity = ref(false);
const condenseManaGained = ref("0");
const condensedMana = ref("0");
const condensedUnlocked = ref(false);
const condensedUpgrades = ref(CONDENSED_UPGRADES.map((upgrade, index) => ({
    ...upgrade,
    index,
    cost: "0",
    amount: "0",
    effect: "1",
    purchased: false,
    affordable: false,
})));
const condensedUpgradePlaceholders = ref(Object.fromEntries(
    Object.keys(CONDENSED_UPGRADE_PLACEHOLDERS).map((key) => [key, ""]),
));
const nextGoal = ref("Condense");
const nextGoalProgress = ref(0);
const tierOneDefinitions = [
    { name: "Mana Conduit", handle: HANDLES.count_manaConduit },
    { name: "Conduit Conjugation", handle: HANDLES.count_conduitConjugation },
    { name: "Conjugation Creation", handle: HANDLES.count_conjugationCreation },
    { name: "Creation Manufactory", handle: HANDLES.count_creationManufactory },
    { name: "Manufacture Staff", handle: HANDLES.count_manufactureStaff },
];
const tierOneUpgrades = ref(tierOneDefinitions.map((upgrade, index) => ({
    ...upgrade,
    id: `tier-one-${index}`,
    index,
    amount: "0",
    cost: "0 mana",
    multiplier: "×1",
    visible: index === 0,
    affordable: false,
    costHandle: namedWasm.tierOneCostHandle(index),
    empowermentCostHandle: namedWasm.tierOneEmpowermentCostHandle(index),
    empowermentHandle: namedWasm.tierOneEmpowermentHandle(index),
    empowered: "0",
    empowerCost: "0",
    empowerVisible: false,
    affordabilityProgress: 0,
})));
const castSpeedSpell = ref({
    timer: "0:00",
    magnitude: "×1.00",
    cost: "1,000.00 mana",
    affordable: false,
});
const castMax = ref(false);
const mastery = ref({
    level: "1",
    effect: "1",
    cost: "1 Manufacture Staff",
    affordable: false,
    visible: false,
});
const matrix = ref({
    level: "0",
    effect: "2.0",
    power: "0.5",
    cost: "10 Manufacture Staff",
    affordable: false,
    visible: false,
});
const courage = ref({
    visible: false,
    active: false,
    available: true,
    timer: "0:00",
    cooldown: "0:00",
});
const bolster = ref({
    visible: false,
    affordable: false,
    effect: "×1.01",
    multiplier: "×1.00",
    requirement: "1.00e45",
});
const resetConfirmationVisible = ref(false);
const updateRate = ref(getUpdateRate());
const timeSimulation = ref({ active: false, totalSeconds: 0, simulatedSeconds: 0, progress: 0, speed: 1 });
let unsubscribeFromTimeSimulation;
const statistics = ref({
    timePlayed: "00:00:00",
    manaProduced: "0.00",
    condenses: "0",
    condensedManaProduced: "0.00",
    timeThisCondense: "00:00:00",
    hasCondensed: false,
});
const achievements = ref(ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: false })));
let animationFrame;
let achievementsInitialized = false;

const activeSubtab = computed(() => activeSubtabs.value[activeTab.value]);
const visibleTabs = computed(() => TABS.filter((tab) => !tab.requiresCondensed || condensedUnlocked.value));

function selectTab(id) {
    activeTab.value = id;
}

function selectSubtab(id) {
    activeSubtabs.value[activeTab.value] = id;
}

function updateDisplay() {
    mana.value = formatDecimal(HANDLES.mana);
    canCondense.value = namedWasm.canCondense();
    condensedMana.value = formatDecimal(HANDLES.condensedMana, 0);
    condensedUnlocked.value = namedWasm.hasCondensed();
    for (const upgrade of condensedUpgrades.value) {
        upgrade.cost = formatDecimal(upgrade.costHandle, 0);
        upgrade.purchased = namedWasm.hasCondensedUpgrade(upgrade.index);
        upgrade.affordable = namedWasm.canBuyCondensedUpgrade(upgrade.index);
        if (upgrade.repeatable) {
            upgrade.amount = formatDecimal(upgrade.amountHandle, 0);
            upgrade.effect = formatDecimal(upgrade.effectHandle);
        }
    }
    for (const [key, placeholder] of Object.entries(CONDENSED_UPGRADE_PLACEHOLDERS)) {
        condensedUpgradePlaceholders.value[key] = `${placeholder.prefix}${formatDecimal(placeholder.handle)}`;
    }
    nextGoalProgress.value = namedWasm.manaCondenseProgress();
    for (const upgrade of tierOneUpgrades.value) {
        upgrade.amount = formatDecimal(upgrade.handle, 0);
        upgrade.cost = `${formatDecimal(upgrade.costHandle)} mana`;
        upgrade.multiplier = `×${formatDecimal(namedWasm.tierOneDisplayMultiplierHandle(upgrade.index))}`;
        upgrade.visible = namedWasm.isTierOneVisible(upgrade.index);
        upgrade.affordable = namedWasm.canBuyTierOne(upgrade.index);
        upgrade.empowerCost = formatDecimal(upgrade.empowermentCostHandle);
        upgrade.empowered = formatDecimal(upgrade.empowermentHandle, 0);
        upgrade.empowerVisible = namedWasm.canEmpowerTierOne(upgrade.index);
        upgrade.affordabilityProgress = namedWasm.tierOneAffordabilityProgress(upgrade.index);
    }
    castSpeedSpell.value.timer = formatDuration(HANDLES.castSpeedTimer);
    castSpeedSpell.value.magnitude = `×${formatDecimal(HANDLES.castSpeedMagnitude)}`;
    castSpeedSpell.value.cost = `${formatDecimal(HANDLES.castSpeedCost)} mana`;
    castSpeedSpell.value.affordable = namedWasm.canCastSpeed();
    mastery.value.level = formatDecimal(HANDLES.masteryLevel, 0);
    mastery.value.effect = formatDecimal(HANDLES.masterySpeedEffect, 0);
    mastery.value.cost = `${formatDecimal(HANDLES.masteryCost, 0)} Manufacture Staff`;
    mastery.value.affordable = namedWasm.canIncreaseMastery();
    mastery.value.visible = namedWasm.isMasteryVisible();
    matrix.value.level = formatDecimal(HANDLES.matrixOwned, 0);
    matrix.value.effect = formatDecimal(HANDLES.matrixSpeedPower, 1);
    matrix.value.power = formatDecimal(HANDLES.matrixPower, 1);
    matrix.value.cost = `${formatDecimal(HANDLES.matrixCost, 0)} Manufacture Staff`;
    matrix.value.affordable = namedWasm.canIncreaseMatrix();
    matrix.value.visible = namedWasm.isMatrixVisible();
    courage.value.visible = namedWasm.isCourageVisible();
    courage.value.active = namedWasm.isCourageActive();
    courage.value.available = namedWasm.toNumber(HANDLES.courageCooldown) <= 0;
    courage.value.timer = formatDuration(HANDLES.courageTimer);
    courage.value.cooldown = formatDuration(HANDLES.courageCooldown);
    bolster.value.affordable = namedWasm.canBolster();
    bolster.value.visible = namedWasm.hasTierOneAchievement(7);
    bolster.value.effect = `×${formatDecimal(HANDLES.bolsterEffect)}`;
    bolster.value.relIncrease = `×${formatDecimal(SCRATCH_HANDLES.bolsterRelativeIncrease)}`;
    bolster.value.multiplier = `×${formatDecimal(HANDLES.bolsterMultiplier)}`;
    bolster.value.requirement = formatDecimal(HANDLES.bolsterRequirement);
    statistics.value.timePlayed = formatTotalTime(HANDLES.statistics_totalTimePlayed);
    statistics.value.manaProduced = formatDecimal(HANDLES.statistics_totalManaProduced);
    statistics.value.condensedManaProduced = formatDecimal(HANDLES.statistics_condensedManaProduced);
    statistics.value.condenses = formatDecimal(HANDLES.statistics_condenses, 0);
    statistics.value.timeThisCondense = formatTotalTime(HANDLES.statistics_timeThisCondense);
    statistics.value.hasCondensed = namedWasm.hasCondensed();
    achievements.value[5].reward = `Mana is increased based on time played (Currently: ×${formatDecimal(HANDLES.multiplier_timePlayedAchievement)})`;
    for (let index = 0; index < achievements.value.length; index++) {
        const achievement = achievements.value[index];
        const unlocked = namedWasm.hasTierOneAchievement(index);
        if (achievementsInitialized && unlocked && !achievement.unlocked) {
            showNotification(`Achievement: ${achievement.title}`, { color: "#c49cff" });
        }
        achievement.unlocked = unlocked;
    }
    achievementsInitialized = true;
    animationFrame = requestAnimationFrame(updateDisplay);
}

function formatDecimal(handle, decimals = 2) {
    if (namedWasm.isAtInfinityBoundary(handle)) return "Infinite";
    const value = namedWasm.readString(handle);

    if (value.includes("e")) {
        const split = value.split("e");
        return Number(split[0]).toFixed(2) + "e" + split[1];   
    }

    const num = Number(value);

    if (Math.abs(num) >= 1e9) {
        return num.toExponential(2).replace("+", "");
    }

    return num
        .toFixed(decimals)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDuration(handle) {
    const seconds = namedWasm.toNumber(handle);
    if (!Number.isFinite(seconds)) return `${formatDecimal(handle)}s`;
    const wholeSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(wholeSeconds / 60);
    return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function formatTotalTime(handle) {
    const seconds = namedWasm.toNumber(handle);
    if (!Number.isFinite(seconds)) return `${formatDecimal(handle)} seconds`;
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds % 86400 / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const remainingSeconds = totalSeconds % 60;
    const clock = [hours, minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
    return days > 0 ? `${days}d ${clock}` : clock;
}

function setStarsVisible(visible) {
    document.body.classList.toggle("effects-disabled", !visible);
}

function updateTickRate(value) {
    updateRate.value = setUpdateRate(value);
}

async function exportGameSave() {
    const saveData = exportSave();
    try {
        await navigator.clipboard.writeText(saveData);
        window.alert("Save copied to clipboard.");
    } catch {
        window.prompt("Copy your save:", saveData);
    }
}

function importGameSave() {
    const saveData = window.prompt("Paste your save:");
    if (saveData === null || saveData.trim() === "") return;
    try {
        achievementsInitialized = false;
        importSave(saveData.trim());
        saveGame();
        window.alert("Save imported successfully.");
    } catch (error) {
        console.error("Failed to import The Mana Paradox save", error);
        window.alert(error instanceof Error ? error.message : "Invalid save data.");
    }
}

function buyTierOne(index) {
    if (castMax.value) namedWasm.buyMaxTierOne(index);
    else namedWasm.buyTierOne(index);
}

function empowerTierOne(index) {
    namedWasm.empowerTierOne(index);
}

function buyAllTierOne() {
    if (castMax.value) namedWasm.buyMaxAllTierOne();
    else namedWasm.buyAllTierOne();
}

function toggleCastMode() {
    castMax.value = !castMax.value;
}

function castSpeed() {
    namedWasm.castSpeed();
}

function increaseMastery() {
    namedWasm.increaseMastery();
}

function increaseMatrix() {
    namedWasm.increaseMatrix();
}

function activateCourage() {
    namedWasm.activateCourage();
}

function condense() {
    if (!namedWasm.calculateCondenseGain()) return;
    resetForCondense();
    namedWasm.completeCondense();
    saveGame();
    achievementsInitialized = false;
    castMax.value = false;
    activeTab.value = "condensed";
}

function buyCondensedUpgrade(index) {
    namedWasm.buyCondensedUpgrade(index);
}

function bolsterStaff() {
    namedWasm.bolster();
}

function resetGame() {
    resetConfirmationVisible.value = true;
}

function cancelResetGame() {
    resetConfirmationVisible.value = false;
}

function confirmResetGame() {
    resetGameData();
    achievementsInitialized = false;
    castMax.value = false;
    resetConfirmationVisible.value = false;
}

function recordClick() {
    namedWasm.recordClick();
}

onMounted(() => {
    document.addEventListener("click", recordClick);
    unsubscribeFromTimeSimulation = subscribeToTimeSimulation((state) => {
        timeSimulation.value = state;
    });
    animationFrame = requestAnimationFrame(updateDisplay);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", recordClick);
    unsubscribeFromTimeSimulation?.();
    cancelAnimationFrame(animationFrame);
});
</script>

<template>
    <div class="game-shell">
        <NotificationStack />
        <TimeSimulation
            :simulation="timeSimulation"
            @speed-up="speedUpTimeSimulation"
            @skip="skipTimeSimulation"
        />
        <GameHeader :mana="mana" />
        <button
            v-if="canCondense || brokenInfinity"
            class="condense-button"
            type="button"
            :disabled="!canCondense"
            @click="condense"
        >
            <strong>Condense</strong>
            <small v-if="brokenInfinity && canCondense"><br>for {{ condenseManaGained }} condensed mana</small>
        </button>
        <div v-if="condensedUnlocked" class="condensed-mana-display">
            <span>You have</span>
            <strong>{{ condensedMana }}</strong>
            <span>condensed mana</span>
        </div>
        <TabNavigation
            :tabs="visibleTabs"
            :active-tab="activeTab"
            :active-subtab="activeSubtab"
            @select-tab="selectTab"
            @select-subtab="selectSubtab"
        />
        <main class="content-frame">
            <ManaTab
                v-if="activeTab === 'mana'"
                :upgrades="tierOneUpgrades"
                :cast-speed="castSpeedSpell"
                :cast-mode="castMax ? 'Cast Max' : 'Cast One'"
                :mastery="mastery"
                :matrix="matrix"
                :courage="courage"
                :bolster="bolster"
                @buy="buyTierOne"
                @empower="empowerTierOne"
                @buy-all="buyAllTierOne"
                @toggle-cast-mode="toggleCastMode"
                @cast-speed="castSpeed"
                @increase-mastery="increaseMastery"
                @increase-matrix="increaseMatrix"
                @activate-courage="activateCourage"
                @bolster="bolsterStaff"
            />
            <StatisticsTab
                v-else-if="activeTab === 'statistics'"
                :statistics="statistics"
            />
            <CondensedTab
                v-else-if="activeTab === 'condensed'"
                :active-subtab="activeSubtab"
                :condensed-mana="condensedMana"
                :upgrades="condensedUpgrades"
                :placeholders="condensedUpgradePlaceholders"
                @buy="buyCondensedUpgrade"
            />
            <AchievementsTab
                v-else-if="activeTab === 'achievements'"
                :achievements="achievements"
            />
            <OptionsTab
                v-else-if="activeTab === 'options'"
                :active-subtab="activeSubtab"
                :update-rate="updateRate"
                @stars-visible="setStarsVisible"
                @export-save="exportGameSave"
                @import-save="importGameSave"
                @reset-game="resetGame"
                @update-rate="updateTickRate"
            />
        </main>
        <div v-if="resetConfirmationVisible" class="confirmation-overlay" role="presentation" @click.self="cancelResetGame">
            <section class="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-game-title">
                <h2 id="reset-game-title">Are you sure?</h2>
                <p>This will permanently reset your game.</p>
                <div class="confirmation-actions">
                    <button type="button" class="confirm-reset" @click="confirmResetGame">Yes</button>
                    <button type="button" @click="cancelResetGame">No</button>
                </div>
            </section>
        </div>
        <footer>The Mana Paradox v0.0.4</footer>
        <GoalProgressBar :goal="nextGoal" :progress="nextGoalProgress" />
    </div>
</template>
