<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { HANDLES } from "@game/player.js";
import { SCRATCH_HANDLES } from "@game/scratch.js";
import { exportSave, importSave, resetGame as resetGameData, saveGame } from "@game/save.js";
import { getUpdateRate, setUpdateRate, skipTimeSimulation, speedUpTimeSimulation, subscribeToTimeSimulation } from "@game/tick.js";
import { namedWasm } from "@generated/_wasm$globals.js";
import GameHeader from "./components/GameHeader.vue";
import GoalProgressBar from "./components/GoalProgressBar.vue";
import TabNavigation from "./components/TabNavigation.vue";
import ManaTab from "./tabs/ManaTab.vue";
import OptionsTab from "./tabs/OptionsTab.vue";
import StatisticsTab from "./tabs/StatisticsTab.vue";
import AchievementsTab from "./tabs/AchievementsTab.vue";
import NotificationStack from "./components/NotificationStack.vue";
import TimeSimulation from "./components/TimeSimulation.vue";
import { showNotification } from "./notifications.js";

const tabs = [
    {
        id: "mana",
        label: "Mana",
        icon: "✦",
        subtabs: [{ id: "basic-spells", label: "Basic Spells" }],
    },
    {
        id: "achievements",
        label: "Achievements",
        icon: "★",
    },
    {
        id: "statistics",
        label: "Statistics",
        icon: "▤",
    },
    {
        id: "options",
        label: "Options",
        icon: "⚙",
        subtabs: [
            { id: "general", label: "General" },
            { id: "visuals", label: "Visuals" },
        ],
    },
];
const activeTab = ref("mana");
const activeSubtabs = ref({ mana: "basic-spells", achievements: "", statistics: "", options: "general" });
const mana = ref("0");
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
    timePlayed: "0:00:00",
    manaProduced: "0.00",
});
const achievements = ref([
    { id: "achievement_buymanaconduit", number: 1, title: "Something feels.. familiar", description: "Purchase a Mana Conduit.", reward: "+1% mana production", unlocked: false },
    { id: "achievement_buyconduitconjugation", number: 2, title: "Meta Production", description: "Purchase a Conduit Conjugation.", reward: "+2% mana production", unlocked: false },
    { id: "achievement_buyconjugationcreation", number: 3, title: "The promised achievement", description: "Purchase a Conjugation Creation.", reward: "+3% mana production", unlocked: false },
    { id: "achievement_buycreationmanufactory", number: 4, title: "Industrial age", description: "Purchase a Creation Manufactory.", reward: "+4% mana production", unlocked: false },
    { id: "achievement_buymanufacturestaff", number: 5, title: "The true best friend", description: "Purchase a Manufacture Staff.", reward: "+5% mana production", unlocked: false },
    { id: "achievement_playtwohours", number: 6, title: "Thanks!", description: "Play for 1 hour.", reward: "Mana is increased based on time played", unlocked: false },
    { id: "achievement_upgrademastery", number: 7, title: "Grandmastery", description: "Upgrade your mastery to level 5.", unlocked: false },
    { id: "achievement_havesixstaff", number: 8, title: "Double the Sith", description: "Have at least 12 Manufacture Staff.", reward: "Unlock Staff Bolstering", unlocked: false },
    { id: "achievement_produce1e50mana", number: 9, title: "Yet not the AI", description: "Produce 1.00e50 mana.", reward: "Reset with 500 mana", unlocked: false },
    { id: "achievement_castspeedminute", number: 10, title: "This lasts like.. forever!", description: "Have over 1 minute of Cast Speed time.", reward: "Cast Speed time is increased by 5 seconds per purchase", unlocked: false },
    { id: "achievement_centennial", number: 11, title: "Centennial", description: "Reach 1.00e100 Mana.", reward: "Increase per-purchase multiplier by +0.1×", unlocked: false },
    { id: "achievement_circularhabits", number: 12, title: "Circular Habits", description: "Reach the limit of your mana circle.", unlocked: false },
    { id: "achievement_difficulty", number: 13, title: "I think this is called difficulty", description: "Reach the limit of your mana circle without any Crystal Matrices.", unlocked: false },
    { id: "achievement_realnews", number: 14, title: "REAL NEWS!", description: "View 50 different ticker messages.", unlocked: false },
    { id: "achievement_clicker", number: 15, title: "Clicker!", description: "Click over 1,000 times.", reward: "Carpel tunnel", unlocked: false },
]);
let animationFrame;
let achievementsInitialized = false;

const activeSubtab = computed(() => activeSubtabs.value[activeTab.value]);

function selectTab(id) {
    activeTab.value = id;
}

function selectSubtab(id) {
    activeSubtabs.value[activeTab.value] = id;
}

function updateDisplay() {
    mana.value = formatDecimal(HANDLES.mana);
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
    bolster.value.affordable = namedWasm.canBolster();
    bolster.value.visible = namedWasm.hasTierOneAchievement(7);
    bolster.value.effect = `×${formatDecimal(HANDLES.bolsterEffect)}`;
    bolster.value.relIncrease = `×${formatDecimal(SCRATCH_HANDLES.bolsterRelativeIncrease)}`;
    bolster.value.multiplier = `x${formatDecimal(HANDLES.bolsterMultiplier)}`;
    bolster.value.requirement = formatDecimal(HANDLES.bolsterRequirement);
    statistics.value.timePlayed = formatTotalTime(HANDLES.statistics_totalTimePlayed);
    statistics.value.manaProduced = formatDecimal(HANDLES.statistics_totalManaProduced);
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
    if (namedWasm.isAtInfinityBoundary(handle)) return "Infinity";
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
        <TabNavigation
            :tabs="tabs"
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
                :bolster="bolster"
                @buy="buyTierOne"
                @empower="empowerTierOne"
                @buy-all="buyAllTierOne"
                @toggle-cast-mode="toggleCastMode"
                @cast-speed="castSpeed"
                @increase-mastery="increaseMastery"
                @increase-matrix="increaseMatrix"
                @bolster="bolsterStaff"
            />
            <StatisticsTab
                v-else-if="activeTab === 'statistics'"
                :statistics="statistics"
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
        <footer>The Mana Paradox v0.0.3</footer>
        <GoalProgressBar :goal="nextGoal" :progress="nextGoalProgress" />
    </div>
</template>
