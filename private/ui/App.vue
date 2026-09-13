<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { HANDLES } from "@game/core/player.js";
import { SCRATCH_HANDLES } from "@game/core/scratch.js";
import { ACHIEVEMENTS } from "@game/game/achievements.js";
import { CONDENSED_UPGRADES, CONDENSED_UPGRADE_PLACEHOLDERS } from "@game/game/condensed.js";
import { TABS } from "@game/config/tabs.js";
import { GUILD_RANKS, POTION_SPEED_II_TIMER_HANDLES, POTION_SPEED_III_TIMER_HANDLES, POTION_SPEED_TIMER_HANDLES } from "@game/guild/guild.js";
import { GUILD_QUESTS_BY_ID } from "@game/guild/quests.js";
import { INVENTORY_ITEMS_BY_ID, Items, resolveItemDescription } from "@game/guild/items.js";
import { GUILD_SHOP_UPGRADES } from "@game/guild/shop.js";
import { castAll, condense, increaseMastery as increaseMasteryAction, increaseMatrix as increaseMatrixAction, subscribeToCondense } from "@game/systems/actions.js";
import { exportSave, importSave, resetGame as resetGameData, saveGame } from "@game/systems/save.js";
import { getUpdateRate, setUpdateRate, skipTimeSimulation, speedUpTimeSimulation, subscribeToTimeSimulation } from "@game/systems/tick.js";
import { namedWasm } from "@generated/_wasm$globals.js";
import GameHeader from "./components/GameHeader.vue";
import GoalProgressBar from "./components/GoalProgressBar.vue";
import TabNavigation from "./components/TabNavigation.vue";
import ManaTab from "./tabs/ManaTab.vue";
import CondensedTab from "./tabs/CondensedTab.vue";
import ManaCircleTab from "./tabs/ManaCircleTab.vue";
import GuildTab from "./tabs/GuildTab.vue";
import QuestTab from "./tabs/QuestTab.vue";
import OptionsTab from "./tabs/OptionsTab.vue";
import StatisticsTab from "./tabs/StatisticsTab.vue";
import AchievementsTab from "./tabs/AchievementsTab.vue";
import NotificationStack from "./components/NotificationStack.vue";
import TimeSimulation from "./components/TimeSimulation.vue";
import KeybindMenu from "./components/KeybindMenu.vue";
import MessageTicker from "./components/MessageTicker.vue";
import { showNotification } from "./notifications.js";

function tabDefinition(tabId) {
    return TABS.find((tab) => tab.id === tabId);
}

function isValidTab(tabId) {
    return tabDefinition(tabId) !== undefined;
}

function isValidSubTab(tabId, subtabId) {
    return tabDefinition(tabId)?.subtabs?.some((subtab) => subtab.id === subtabId) ?? false;
}

const selectedTab = localStorage.getItem("selectedTab");
const selectedSubTab = localStorage.getItem("selectedSubTab");
const startTab = isValidTab(selectedTab) ? selectedTab : TABS[0].id;
const startingSubtabs = Object.fromEntries(TABS.map((tab) => [tab.id, tab.subtabs?.[0]?.id ?? ""]));
if (isValidSubTab(startTab, selectedSubTab)) startingSubtabs[startTab] = selectedSubTab;

const activeTab = ref(startTab);
const activeSubtabs = ref(startingSubtabs);
const mana = ref("0");
const canCondense = ref(false);
const brokenInfinity = ref(false);
const condenseManaGained = ref("0");
const condensedMana = ref("0");
const condensedUnlocked = ref(false);
const guildUnlocked = ref(false);
const ascensionHallUnlocked = ref(false);
const questActive = ref(false);
const manaCircle = ref(0);
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
const potionEffects = ref([]);
const gameSpeed = ref("1.00");
const gameSpeedIncreased = ref(false);
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
    multiplier: "10.00",
});
const bolster = ref({
    visible: false,
    affordable: false,
    effect: "×1.01",
    multiplier: "×1.00",
    requirement: "1.00e45",
});
const guild = ref({ member: false, rank: "F", rankIndex: 0, nextRank: "E", questActive: false, refreshTimer: "10:00", experience: 0, experienceRequirement: 25, coins: "0", wolfFur: "0", potions: "0", inventoryItems: [], shopItems: [], shopUpgrades: [] });
const questResult = ref({ visible: false, monster: "Wolfines", items: [] });
const guildQuests = ref(Array.from({ length: 6 }, (_, index) => ({ ...GUILD_QUESTS_BY_ID.get(index), index, rank: "F", locked: false, visible: index < 3 })));
const combat = ref({
    monster: "Wolfines",
    rank: "F",
    enemyHealth: "150",
    enemyMaximumHealth: "150",
    enemyPercent: 1,
    shield: "0",
    shieldPercent: 1,
    freezeTurns: "0",
    spells: [
        { index: 0, name: "Fireball", effect: "35 damage", costHandle: HANDLES.fireballCost, cost: "1e210", affordable: false },
        { index: 1, name: "Whirlwind", effect: "60 damage", costHandle: HANDLES.whirlwindCost, cost: "1e230", affordable: false },
        { index: 2, name: "Freeze", effect: "10 damage · freezes for 2 turns", costHandle: HANDLES.freezeCost, cost: "1e250", affordable: false },
    ],
});
const resetConfirmationVisible = ref(false);
const changeKeybindsVisible = ref(false);
const updateRate = ref(getUpdateRate());
const timeSimulation = ref({ active: false, totalSeconds: 0, simulatedSeconds: 0, progress: 0, speed: 1 });
let unsubscribeFromTimeSimulation;
let unsubscribeFromCondense;
const statistics = ref({
    timePlayed: "00:00:00",
    manaProduced: "0.00",
    condenses: "0",
    condensedManaProduced: "0.00",
    timeThisCondense: "00:00:00",
    fastestCondense: "00:00:00",
    hasCondensed: false,
});
const achievements = ref(ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: false })));
let animationFrame;
let displayErrorReported = false;
let achievementsInitialized = false;
let displayedAchievementRevision = -1;
let displayedInventoryRevision = -1;

const activeSubtab = computed(() => activeSubtabs.value[activeTab.value]);
const visibleTabs = computed(() => TABS.filter((tab) => {
    if (tab.requiresCondensed && !condensedUnlocked.value) return false;
    if (tab.requiresGuild && !guildUnlocked.value) return false;
    if (tab.requiresQuest && !questActive.value) return false;
    return true;
}).map((tab) => ({
    ...tab,
    subtabs: tab.subtabs?.filter((subtab) => !subtab.requiresAscensionHall || ascensionHallUnlocked.value),
})));

function displayedItemDefinition(itemId) {
    const definition = INVENTORY_ITEMS_BY_ID.get(itemId);
    if (!definition) return undefined;
    return {
        ...definition,
        description: resolveItemDescription(definition.description, {
            duration: namedWasm.potionDuration(itemId),
            effect: namedWasm.potionEffect(itemId).toFixed(2),
        }),
    };
}

function selectTab(id) {
    if (!isValidTab(id)) return;
    activeTab.value = id;
    localStorage.setItem("selectedTab", id);
    localStorage.setItem("selectedSubTab", activeSubtabs.value[id]);
}

function selectSubtab(id) {
    if (!isValidSubTab(activeTab.value, id)) return;
    activeSubtabs.value[activeTab.value] = id;
    localStorage.setItem("selectedSubTab", id);
}

function updateDisplay() {
    try {
        updateGlobalDisplay();
        updateAchievementNotifications();
        switch (activeTab.value) {
            case "mana": updateManaDisplay(); break;
            case "condensed": updateCondensedDisplay(); break;
            case "manacircle": manaCircle.value = namedWasm.toNumber(HANDLES.mana_circle_tier); break;
            case "guild": updateGuildDisplay(activeSubtab.value); break;
            case "quest": updateQuestDisplay(); break;
            case "achievements": updateAchievementsDisplay(); break;
            case "statistics": updateStatisticsDisplay(); break;
        }
        displayErrorReported = false;
    } catch (error) {
        if (!displayErrorReported) console.error("Failed to update the active game display", error);
        displayErrorReported = true;
    } finally {
        animationFrame = requestAnimationFrame(updateDisplay);
    }
}

function updateGlobalDisplay() {
    mana.value = formatDecimal(HANDLES.mana);
    canCondense.value = namedWasm.canCondense();
    condensedUnlocked.value = namedWasm.hasCondensed();
    if (condensedUnlocked.value) condensedMana.value = formatDecimal(HANDLES.condensedMana, 0);
    ascensionHallUnlocked.value = namedWasm.isAscensionHallUnlocked();
    if (!ascensionHallUnlocked.value && activeSubtabs.value.guild === "guild-ascension-hall") {
        activeSubtabs.value.guild = "guild-main";
    }
    guildUnlocked.value = namedWasm.isGuildUnlocked();
    questActive.value = namedWasm.isQuestActive();
    nextGoalProgress.value = namedWasm.manaCondenseProgress();
    if (!questActive.value && activeTab.value === "quest") selectTab("guild");
}

function updateManaDisplay() {
    const potionSpeedTimers = POTION_SPEED_TIMER_HANDLES
        .map((handle) => namedWasm.toNumber(handle))
        .filter((seconds) => seconds > 0);
    const potionSpeedIITimers = POTION_SPEED_II_TIMER_HANDLES
        .map((handle) => namedWasm.toNumber(handle))
        .filter((seconds) => seconds > 0);
    const potionSpeedIIITimers = POTION_SPEED_III_TIMER_HANDLES
        .map((handle) => namedWasm.toNumber(handle))
        .filter((seconds) => seconds > 0);
    gameSpeed.value = formatDecimal(namedWasm.getGameSpeed());
    gameSpeedIncreased.value = namedWasm.isGameSpeedIncreased();
    potionEffects.value = potionSpeedTimers.map((seconds, index) => ({
        id: `speed-${index}`,
        text: `Potion of Speed: +${namedWasm.potionEffect(Items.POTION_SPEED_I).toFixed(2)}× Game Speed (${formatShortTimer(seconds)})`,
    })).concat(potionSpeedIITimers.map((seconds, index) => ({
        id: `speed-ii-${index}`,
        text: `Potion of Speed II: +${namedWasm.potionEffect(Items.POTION_SPEED_II).toFixed(2)}× Game Speed (${formatShortTimer(seconds)})`,
    }))).concat(potionSpeedIIITimers.map((seconds, index) => ({
        id: `speed-iii-${index}`,
        text: `Potion of Speed III: +${namedWasm.potionEffect(Items.POTION_SPEED_III).toFixed(2)}× Game Speed (${formatShortTimer(seconds)})`,
    })));
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
    courage.value.multiplier = formatDecimal(HANDLES.courageMultiplier);
    bolster.value.affordable = namedWasm.canBolster();
    bolster.value.visible = namedWasm.hasTierOneAchievement(7);
    bolster.value.effect = `×${formatDecimal(HANDLES.bolsterEffect)}`;
    bolster.value.relIncrease = `×${formatDecimal(SCRATCH_HANDLES.bolsterRelativeIncrease)}`;
    bolster.value.multiplier = `×${formatDecimal(HANDLES.bolsterMultiplier)}`;
    bolster.value.requirement = formatDecimal(HANDLES.bolsterRequirement);
}

function updateGuildDisplay(subtab) {
    guild.value.member = namedWasm.isGuildMember();
    guild.value.questActive = questActive.value;
    if (subtab === "guild-main") updateGuildBoardDisplay();
    else if (subtab === "guild-inventory") updateGuildInventoryDisplay();
    else if (subtab === "guild-shop") updateGuildShopDisplay();
}

function updateGuildShopDisplay() {
    const guildRankIndex = namedWasm.toNumber(HANDLES.guildRank);
    guild.value.coins = formatDecimal(HANDLES.coins, 0);
    guild.value.shopItems = Array.from({ length: 3 }, (_, slot) => {
        const itemId = namedWasm.shopItemId(slot);
        return {
            slot,
            itemId,
            name: displayedItemDefinition(itemId)?.name ?? "Unknown Item",
            cost: namedWasm.shopItemCost(slot),
            affordable: namedWasm.canBuyShopItem(slot),
            refreshRemaining: namedWasm.shopItemRefreshTimer(slot),
        };
    });
    guild.value.shopUpgrades = GUILD_SHOP_UPGRADES.map((upgrade) => ({
        ...upgrade,
        locked: guildRankIndex < upgrade.rank,
        purchased: namedWasm.hasGuildShopUpgrade(upgrade.id),
        affordable: namedWasm.canBuyGuildShopUpgrade(upgrade.id),
    }));
}

function updateGuildInventoryDisplay() {
    guild.value.coins = formatDecimal(HANDLES.coins, 0);
    const inventoryRevision = namedWasm.getInventoryRevision();
    if (inventoryRevision !== displayedInventoryRevision) {
        const inventoryItems = [];
        for (let position = 0; position < 100; position++) {
            const type = namedWasm.inventoryItemAt(position);
            if (type === 0) continue;
            const definition = displayedItemDefinition(type);
            if (!definition) continue;
            inventoryItems.push({
                position,
                type,
                ...definition,
            });
        }
        guild.value.inventoryItems = inventoryItems;
        displayedInventoryRevision = inventoryRevision;
    }
}

function updateGuildBoardDisplay() {
    const guildRankIndex = namedWasm.toNumber(HANDLES.guildRank);
    guild.value.rank = GUILD_RANKS[guildRankIndex] ?? "F";
    guild.value.rankIndex = guildRankIndex;
    guild.value.nextRank = GUILD_RANKS[guildRankIndex + 1] ?? "—";
    guild.value.experience = namedWasm.getGuildExperience();
    const experienceRequirement = namedWasm.guildExperienceRequirement();
    guild.value.experienceRequirement = Number.isFinite(experienceRequirement) ? experienceRequirement : "∞";
    questResult.value.visible = namedWasm.hasQuestResult();
    if (questResult.value.visible) {
        questResult.value.monster = GUILD_QUESTS_BY_ID.get(namedWasm.lastCompletedQuestDefinitionId())?.monster ?? "monsters";
        questResult.value.items = Array.from({ length: namedWasm.lastQuestRewardCount() }, (_, index) => {
            const item = INVENTORY_ITEMS_BY_ID.get(namedWasm.lastQuestRewardItem(index));
            return {
                name: item?.name ?? "Unknown Item",
                amount: namedWasm.lastQuestRewardAmount(index),
                dropped: namedWasm.lastQuestRewardDropped(index),
            };
        }).filter((item) => item.amount > 0);
    }
    guild.value.refreshTimer = formatShortTimer(namedWasm.getQuestRefreshRemaining());
    for (const quest of guildQuests.value) {
        const definition = GUILD_QUESTS_BY_ID.get(namedWasm.questDefinitionId(quest.index));
        if (definition) Object.assign(quest, definition, {
            rewards: definition.rewards.map((reward) => ({
                ...reward,
                name: INVENTORY_ITEMS_BY_ID.get(reward.item)?.name ?? "Unknown Item",
            })),
        });
        quest.rank = GUILD_RANKS[namedWasm.questRank(quest.index)] ?? "F";
        quest.locked = namedWasm.isQuestSlotLocked(quest.index);
        quest.visible = quest.index < namedWasm.visibleQuestSlotCount();
    }
}

function updateQuestDisplay() {
    if (!questActive.value) return;
    const activeQuestId = namedWasm.questDefinitionId(namedWasm.activeQuestIndex());
    const activeQuest = GUILD_QUESTS_BY_ID.get(activeQuestId);
    combat.value.monster = activeQuest?.monster ?? "Monsters";
    combat.value.rank = GUILD_RANKS[activeQuest?.rank ?? 0] ?? "F";
    combat.value.enemyHealth = formatDecimal(HANDLES.wolfineHealth, 0);
    combat.value.enemyMaximumHealth = String(namedWasm.enemyMaximumHealth(namedWasm.activeQuestIndex()));
    combat.value.enemyPercent = namedWasm.wolfineHealthPercent();
    combat.value.shield = formatDecimal(namedWasm.combatShieldHandle(), 0);
    combat.value.shieldPercent = namedWasm.combatShieldPercent();
    combat.value.freezeTurns = formatDecimal(HANDLES.combatFreezeTurns, 0);
    for (const spell of combat.value.spells) {
        spell.cost = formatDecimal(spell.costHandle);
        spell.affordable = namedWasm.canCastCombatSpell(spell.index);
    }
}

function updateCondensedDisplay() {
    namedWasm.refreshCondensedUpgradeState();
    for (const upgrade of condensedUpgrades.value) {
        upgrade.cost = formatDecimal(upgrade.costHandle, 0);
        upgrade.purchased = namedWasm.hasCondensedUpgrade(upgrade.index);
        upgrade.affordable = namedWasm.canBuyCondensedUpgrade(upgrade.index);
        upgrade.visible = upgrade.index !== condensedUpgrades.value.length - 1 || namedWasm.canSeeAscensionHallUpgrade();
    }
    for (const [key, placeholder] of Object.entries(CONDENSED_UPGRADE_PLACEHOLDERS)) {
        condensedUpgradePlaceholders.value[key] = `${placeholder.prefix}${formatDecimal(placeholder.handle)}`;
    }
}

function updateStatisticsDisplay() {
    statistics.value.timePlayed = formatTotalTime(HANDLES.statistics_totalTimePlayed);
    statistics.value.manaProduced = formatDecimal(HANDLES.statistics_totalManaProduced);
    statistics.value.condensedManaProduced = formatDecimal(HANDLES.statistics_condensedManaProduced);
    statistics.value.condenses = formatDecimal(HANDLES.statistics_condenses, 0);
    statistics.value.timeThisCondense = formatTotalTime(HANDLES.statistics_timeThisCondense);
    statistics.value.fastestCondense = formatTotalTime(HANDLES.statistics_fastestCondense);
    statistics.value.hasCondensed = namedWasm.hasCondensed();
}

function updateAchievementsDisplay() {
    achievements.value[5].reward = `Mana is increased based on time played (Currently: ×${formatDecimal(HANDLES.multiplier_timePlayedAchievement)})`;
}

function updateAchievementNotifications(force = false) {
    const revision = namedWasm.getAchievementRevision();
    if (!force && revision === displayedAchievementRevision) return;
    for (let index = 0; index < achievements.value.length; index++) {
        const achievement = achievements.value[index];
        const unlocked = namedWasm.hasTierOneAchievement(index);
        if (achievementsInitialized && unlocked && !achievement.unlocked) {
            showNotification(`Achievement: ${achievement.title}`, { color: "#c49cff" });
        }
        achievement.unlocked = unlocked;
    }
    achievementsInitialized = true;
    displayedAchievementRevision = revision;
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
    const saveData = await exportSave();
    try {
        await navigator.clipboard.writeText(saveData);
        window.alert("Save copied to clipboard.");
    } catch {
        window.prompt("Copy your save:", saveData);
    }
}

async function importGameSave() {
    const saveData = window.prompt("Paste your save:");
    if (saveData === null || saveData.trim() === "") return;
    try {
        achievementsInitialized = false;
        await importSave(saveData.trim());
        await saveGame();
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
    castAll();
}

function toggleCastMode() {
    castMax.value = !castMax.value;
}

function castSpeed() {
    namedWasm.castSpeed();
}

function increaseMastery() {
    increaseMasteryAction();
}

function increaseMatrix() {
    increaseMatrixAction();
}

function activateCourage() {
    namedWasm.activateCourage();
}

function handleCondensed() {
    achievementsInitialized = false;
    castMax.value = false;
}

function buyCondensedUpgrade(index) {
    if (!namedWasm.buyCondensedUpgrade(index)) return;
    namedWasm.applyCondensedMasteryMinimum();
    namedWasm.refreshMasteryDerivedState();
    namedWasm.refreshMatrixDerivedState();
    namedWasm.refreshMasteryDerivedState();
    namedWasm.refreshTierOneDerivedState();
    if (index === 11) namedWasm.resetCastSpeed();
}

function bolsterStaff() {
    namedWasm.bolster();
}

function applyToGuild() {
    if (namedWasm.applyToGuild()) void saveGame();
}

function acceptGuildQuest(index) {
    if (!namedWasm.acceptGuildQuest(index)) return;
    selectTab("quest");
    void saveGame();
}

function castCombatSpell(index) {
    if (namedWasm.castCombatSpell(index)) void saveGame();
}

function abandonGuildQuest() {
    namedWasm.abandonGuildQuest();
    void saveGame();
}

function dismissQuestResult() {
    namedWasm.dismissQuestResult();
}

function moveInventoryItem(item, position) {
    if (namedWasm.moveInventoryItem(item, position)) void saveGame();
}

function useInventoryItem(action, position, itemId) {
    if (action === "drink-speed-potion") namedWasm.drinkPotion(position, itemId);
}

function sellInventoryItem(position, itemId) {
    namedWasm.sellInventoryItem(position, itemId);
}

function sellAllMaterials() {
    namedWasm.sellAllInventoryItems(false);
}

function sellAllItems() {
    namedWasm.sellAllInventoryItems(true);
}

function drinkAllPotions() {
    namedWasm.drinkAllPotions();
}

function buyShopItem(slot) {
    namedWasm.buyShopItem(slot);
}

function buyGuildShopUpgrade(index) {
    if (namedWasm.buyGuildShopUpgrade(index)) void saveGame();
}

function formatShortTimer(seconds) {
    const remaining = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
}

function resetGame() {
    resetConfirmationVisible.value = true;
}

function editKeybinds() {
    changeKeybindsVisible.value = true;
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
    unsubscribeFromCondense = subscribeToCondense(handleCondensed);
    unsubscribeFromTimeSimulation = subscribeToTimeSimulation((state) => {
        timeSimulation.value = state;
    });
    animationFrame = requestAnimationFrame(updateDisplay);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", recordClick);
    unsubscribeFromCondense?.();
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
                :potion-effects="potionEffects"
                :game-speed="gameSpeed"
                :game-speed-increased="gameSpeedIncreased"
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
            <ManaCircleTab
                v-else-if="activeTab === 'manacircle'"
                :active-subtab="activeSubtab"
                :manaCircle="manaCircle"
            />
            <GuildTab
                v-else-if="activeTab === 'guild'"
                :active-subtab="activeSubtab"
                :guild="guild"
                :quests="guildQuests"
                :quest-result="questResult"
                @apply="applyToGuild"
                @accept="acceptGuildQuest"
                @dismiss-result="dismissQuestResult"
                @move-item="moveInventoryItem"
                @use-item="useInventoryItem"
                @sell-item="sellInventoryItem"
                @sell-all-materials="sellAllMaterials"
                @sell-all-items="sellAllItems"
                @drink-all-potions="drinkAllPotions"
                @buy-shop-item="buyShopItem"
                @buy-shop-upgrade="buyGuildShopUpgrade"
            />
            <QuestTab
                v-else-if="activeTab === 'quest'"
                :combat="combat"
                @cast="castCombatSpell"
                @abandon="abandonGuildQuest"
            />
            <AchievementsTab
                v-else-if="activeTab === 'achievements'"
                :active-subtab="activeSubtab"
                :achievements="achievements"
            />
            <OptionsTab
                v-else-if="activeTab === 'options'"
                :active-subtab="activeSubtab"
                :update-rate="updateRate"
                @edit-keybinds="editKeybinds"
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
        <KeybindMenu v-if="changeKeybindsVisible" @close="changeKeybindsVisible = false" />
        <MessageTicker />
        <footer>The Mana Paradox v0.0.7</footer>
        <GoalProgressBar :goal="nextGoal" :progress="nextGoalProgress" />
    </div>
</template>
