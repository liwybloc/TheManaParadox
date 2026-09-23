<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { HANDLES } from "@game/core/player.js";
import { SCRATCH_HANDLES } from "@game/core/scratch.js";
import { ACHIEVEMENTS } from "@game/game/achievements.js";
import { CRYSTALS, CRYSTAL_GOALS } from "@game/game/crystals.js";
import { getTotalMessageTickersSeen, getUniqueMessageTickersSeen } from "@game/game/message_tickers.js";
import { CONDENSED_UPGRADES, CONDENSED_UPGRADE_PLACEHOLDERS } from "@game/game/condensed.js";
import { TABS } from "@game/config/tabs.js";
import { PROGRESSION_GOALS } from "@game/config/goals.js";
import { ADVANCED_COMBAT_SPELL_COST_HANDLES, GUILD_RANKS, POTION_SPEED_II_TIMER_HANDLES, POTION_SPEED_III_TIMER_HANDLES, POTION_SPEED_TIMER_HANDLES } from "@game/guild/guild.js";
import { GUILD_QUESTS_BY_ID } from "@game/guild/quests.js";
import { INVENTORY_ITEMS_BY_ID, Items, resolveItemDescription } from "@game/guild/items.js";
import { GUILD_SHOP_UPGRADES } from "@game/guild/shop.js";
import { AUTOCASTER_NAMES, AUTOCASTER_TASKS, AUTOCASTER_TIERS, MAX_AUTOCASTERS } from "@game/config/autocasters.js";
import { castAll, condense, enterCrystal as enterCrystalAction, escapeCrystal as escapeCrystalAction, focus as focusAction, increaseMatrix as increaseMatrixAction, sealMeridians as sealMeridiansAction, shatterCrystal as shatterCrystalAction, subscribeToCondense, subscribeToMemoryGain } from "@game/systems/actions.js";
import { exportSave, importSave, resetGame as resetGameData, saveGame } from "@game/systems/save.js";
import { getUpdateRate, setUpdateRate, skipTimeSimulation, speedUpTimeSimulation, subscribeToTimeSimulation } from "@game/systems/tick.js";
import { setStarManaProgress, setStarsAnimated as applyStarsAnimated, setStarsVisible as applyStarsVisible, starsAnimated as loadStarsAnimated, starsVisible as loadStarsVisible } from "@game/systems/background.js";
import { formatCompletionTime, formatCrystalGoal, formatDecimal, formatDecimalCompact } from "@game/ui/formatting.js";
import { namedWasm } from "@generated/_wasm$globals.js";
import GameHeader from "./components/GameHeader.vue";
import GoalProgressBar from "./components/GoalProgressBar.vue";
import TabNavigation from "./components/TabNavigation.vue";
import ManaTab from "./tabs/ManaTab.vue";
import CondensedTab from "./tabs/CondensedTab.vue";
import ManaCircleTab from "./tabs/ManaCircleTab.vue";
import CrystalsTab from "./tabs/CrystalsTab.vue";
import GuildTab from "./tabs/GuildTab.vue";
import QuestTab from "./tabs/QuestTab.vue";
import AutocastersTab from "./tabs/AutocastersTab.vue";
import OptionsTab from "./tabs/OptionsTab.vue";
import StatisticsTab from "./tabs/StatisticsTab.vue";
import AchievementsTab from "./tabs/AchievementsTab.vue";
import NotificationStack from "./components/NotificationStack.vue";
import TimeSimulation from "./components/TimeSimulation.vue";
import KeybindMenu from "./components/KeybindMenu.vue";
import MessageTicker from "./components/MessageTicker.vue";
import ManaCircleExpansion from "./components/ManaCircleExpansion.vue";
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
const condenseManaGained = ref("0");
const condensedMana = ref("0");
const condensedUnlocked = ref(false);
const guildUnlocked = ref(false);
const ascensionHallUnlocked = ref(false);
const autocastersUnlocked = ref(false);
const questActive = ref(false);
const manaCircle = ref(0);
const manaCircleExpansionVisible = ref(false);
const crystalsUnlocked = ref(false);
const memoriesUnlocked = ref(false);
const libraryUnlocked = ref(false);
const activeCrystal = ref(-1);
const crystalGoalReached = ref(false);
const crystalCanShatter = ref(false);
const equipmentUnlocked = ref(false);
const pingedTabs = ref([]);
const pingedSubtabs = ref([]);
const manaPerSecond = ref("0.00");
const oomPerSecond = ref("0.00");
const showOoMPerSecond = ref(false);
const condensedUpgrades = ref(CONDENSED_UPGRADES.map((upgrade, index) => ({
    ...upgrade,
    index,
    cost: "0",
    amount: "0",
    effect: "1",
    purchased: false,
    circleTwoPurchased: false,
    circleTwoAvailable: false,
    affordable: false,
})));
const condensedUpgradePlaceholders = ref(Object.fromEntries(
    Object.keys(CONDENSED_UPGRADE_PLACEHOLDERS).map((key) => [key, ""]),
));
const nextGoal = ref("Condense");
const nextGoalProgress = ref(0);
const tierOneDefinitions = [
    { name: "Mana Absorber", handle: HANDLES.count_manaConduit },
    { name: "Pylon", handle: HANDLES.count_conduitConjugation },
    { name: "Conduit", handle: HANDLES.count_conjugationCreation },
    { name: "Circuit", handle: HANDLES.count_creationManufactory },
    { name: "Meridian", handle: HANDLES.count_manufactureStaff },
];
const tierOneUpgrades = ref(tierOneDefinitions.map((upgrade, index) => ({
    ...upgrade,
    id: `tier-one-${index}`,
    index,
    amount: "0",
    bought: "0",
    boughtGT10000: false,
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
    hasNextTier: false,
    affordabilityProgress: 0,
})));
const castSpeedSpell = ref({
    timer: "0:00",
    magnitude: "×1.00",
    power: "2",
    showPower: false,
    cost: "1,000.00 mana",
    affordable: false,
});
const castMax = ref(false);
const potionEffects = ref([]);
const gameSpeed = ref("1.00");
const gameSpeedIncreased = ref(false);
const starsVisible = ref(loadStarsVisible());
const starsAnimated = ref(loadStarsAnimated());
const newsTickerEnabled = ref(localStorage.getItem("newsTickerEnabled") !== "false");
const messageTickerParticles = ref(localStorage.getItem("messageTickerParticles") === "true");
const sealedMeridians = ref({
    level: "1",
    effect: "1",
    magnitude: "2",
    cost: "1 Meridian",
    affordable: false,
    visible: false,
});
const matrix = ref({
    level: "0",
    base: "2",
    other: "0",
    effect: "0",
    power: "0.5",
    cost: "10 Meridian",
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
const meridianPurification = ref({
    visible: false,
    affordable: false,
    effect: "×1.01",
    multiplier: "×1.00",
    requirement: "1.00e45",
});
const guild = ref({ member: false, rank: "F", rankIndex: 0, nextRank: "E", questActive: false, refreshTimer: "10:00", experience: 0, experienceRequirement: 25, coins: "0", wolfFur: "0", potions: "0", inventoryItems: [], equipmentItems: [], shopItems: [], shopUpgrades: [] });
const autocasters = ref({ casters: [], tasks: [], hireOptions: [] });
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
        { index: 0, name: "Fireball", effect: "35 damage", costHandle: HANDLES.fireballCost, cost: "1e40", affordable: false },
        { index: 1, name: "Whirlwind", effect: "60 damage", costHandle: HANDLES.whirlwindCost, cost: "1e80", affordable: false },
        { index: 2, name: "Freeze", effect: "10 damage · freezes for 2 turns", costHandle: HANDLES.freezeCost, cost: "1e120", affordable: false },
        { index: 3, name: "Lightning", effect: "120 damage", costHandle: ADVANCED_COMBAT_SPELL_COST_HANDLES[0], cost: "1e160", affordable: false, unlocked: false, upgrade: 9 },
        { index: 4, name: "Meteor", effect: "250 damage", costHandle: ADVANCED_COMBAT_SPELL_COST_HANDLES[1], cost: "1e220", affordable: false, unlocked: false, upgrade: 10 },
        { index: 5, name: "Arcane Nova", effect: "500 damage", costHandle: ADVANCED_COMBAT_SPELL_COST_HANDLES[2], cost: "1e300", affordable: false, unlocked: false, upgrade: 11 },
    ],
});
const resetConfirmationVisible = ref(false);
const changeKeybindsVisible = ref(false);
const updateRate = ref(getUpdateRate());
const timeSimulation = ref({ active: false, totalSeconds: 0, simulatedSeconds: 0, progress: 0, speed: 1 });
let unsubscribeFromTimeSimulation;
let unsubscribeFromCondense;
let unsubscribeFromMemoryGain;
const statistics = ref({
    timePlayed: "00:00:00",
    gameTimePlayed: "00:00:00",
    manaProduced: "0.00",
    messageTickersSeen: getTotalMessageTickersSeen(),
    uniqueMessageTickersSeen: getUniqueMessageTickersSeen(),
    condenses: "0",
    condensedManaProduced: "0.00",
    timeThisCondense: "00:00:00",
    fastestCondense: "00:00:00",
    hasCondensed: false,
});

const memories = ref({
    remembered: 0,
    nextChance: "100.00",
    focusing: false,
    manaMultiplier: "1.00",
});

function updateMessageTickerStatistics({ total, unique }) {
    statistics.value.messageTickersSeen = total;
    statistics.value.uniqueMessageTickersSeen = unique;
}

const achievements = ref(ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    wasmIndex: achievement.number - 1,
    unlocked: false,
})));
let animationFrame;
let displayErrorReported = false;
let achievementsInitialized = false;
let displayedAchievementRevision = -1;
let displayedInventoryRevision = -1;
const knownTabIds = new Set();
const knownSubtabIds = new Set();
let navigationUnlocksInitialized = false;

const activeSubtab = computed(() => activeSubtabs.value[activeTab.value]);
const visibleTabs = computed(() => TABS.filter((tab) => {
    if (tab.requiresCondensed && !condensedUnlocked.value) return false;
    if (tab.requiresGuild && !guildUnlocked.value) return false;
    if (tab.requiresQuest && !questActive.value) return false;
    if (tab.requiresAutocasters && !autocastersUnlocked.value) return false;
    if (tab.requiresCrystals && !crystalsUnlocked.value) return false;
    return true;
}).map((tab) => ({
    ...tab,
    subtabs: tab.subtabs?.filter((subtab) =>
        (!subtab.requiresAscensionHall || ascensionHallUnlocked.value)
        && (!subtab.requiresMemory || memoriesUnlocked.value)
        && (!subtab.requiresLibrary || libraryUnlocked.value)
    ),
})));

function displayedItemDefinition(itemId) {
    const definition = INVENTORY_ITEMS_BY_ID.get(itemId);
    if (!definition) return undefined;
    return {
        ...definition,
        sellPrice: [
            namedWasm.inventoryItemSellMinimum(itemId),
            namedWasm.inventoryItemSellMaximum(itemId),
        ],
        description: resolveItemDescription(definition.description, {
            duration: namedWasm.potionDuration(itemId),
            effect: namedWasm.potionEffect(itemId).toFixed(2),
        }),
    };
}

function selectTab(id) {
    if (!isValidTab(id)) return;
    activeTab.value = id;
    pingedTabs.value = pingedTabs.value.filter((tabId) => tabId !== id);
    localStorage.setItem("selectedTab", id);
    localStorage.setItem("selectedSubTab", activeSubtabs.value[id]);
}

function selectSubtab(id) {
    if (!isValidSubTab(activeTab.value, id)) return;
    activeSubtabs.value[activeTab.value] = id;
    pingedSubtabs.value = pingedSubtabs.value.filter((subtabId) => subtabId !== id);
    localStorage.setItem("selectedSubTab", id);
}

const FAST_UI_INTERVAL = 50;
const SLOW_UI_INTERVAL = 250;
let lastFastUiUpdate = 0;
let lastSlowUiUpdate = 0;

function updateFastDisplay() {
    updateGlobalDisplay();

    switch (activeTab.value) {
        case "mana":
            updateManaDisplay();
            break;
        case "quest":
            updateQuestDisplay();
            break;
    }
}

function updateSlowDisplay() {
    updateAchievementNotifications();

    switch (activeTab.value) {
        case "condensed":
            updateCondensedDisplay();
            break;
        case "manacircle":
            manaCircle.value = namedWasm.toNumber(HANDLES.mana_circle_tier);
            break;
        case "guild":
            updateGuildDisplay(activeSubtab.value);
            break;
        case "autocasters":
            updateAutocastersDisplay();
            break;
        case "achievements":
            updateAchievementsDisplay();
            break;
        case "statistics":
            updateStatisticsDisplay();
            break;
    }
}

function updateDisplay(timestamp) {
    try {
        if (timestamp - lastFastUiUpdate >= FAST_UI_INTERVAL) {
            lastFastUiUpdate = timestamp;
            updateFastDisplay();
        }

        if (timestamp - lastSlowUiUpdate >= SLOW_UI_INTERVAL) {
            lastSlowUiUpdate = timestamp;
            updateSlowDisplay();
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
    mana.value = formatDecimal(HANDLES.mana, 2, "Maximum");
    canCondense.value = namedWasm.canCondense();
    condensedUnlocked.value = namedWasm.hasCondensed();
    if (condensedUnlocked.value) condensedMana.value = formatDecimal(HANDLES.condensedMana, 0);
    ascensionHallUnlocked.value = namedWasm.isAscensionHallUnlocked();
    manaCircle.value = namedWasm.toNumber(HANDLES.mana_circle_tier);
    crystalsUnlocked.value = namedWasm.hasAscendedCondensedEffect(19);
    memoriesUnlocked.value = namedWasm.hasCompletedCrystal(2);
    libraryUnlocked.value = namedWasm.hasMemoryMilestone(25);
    memories.value.focusing = namedWasm.isFocusing();
    activeCrystal.value = namedWasm.getActiveCrystal();
    crystalGoalReached.value = namedWasm.isActiveCrystalGoalReached();
    crystalCanShatter.value = namedWasm.canShatterActiveCrystal();
    if (manaCircle.value > 0 && canCondense.value) {
        namedWasm.refreshCondenseGain();
        condenseManaGained.value = formatDecimal(SCRATCH_HANDLES.condenseGain, 2);
        if (namedWasm.isFocusing()) {
            memories.value.nextChance = (namedWasm.memoryChance(SCRATCH_HANDLES.condenseGain) * 100).toFixed(2);
        }
    }
    autocastersUnlocked.value = namedWasm.hasGuildShopUpgrade(7);
    if (!ascensionHallUnlocked.value && activeSubtabs.value.guild === "guild-ascension-hall") {
        activeSubtabs.value.guild = "guild-main";
    }
    if (!memoriesUnlocked.value && activeSubtabs.value.condensed === "memories") {
        activeSubtabs.value.condensed = "condensed-upgrades";
    }
    if (!libraryUnlocked.value && activeSubtabs.value.guild === "guild-library") {
        activeSubtabs.value.guild = "guild-main";
    }
    if (activeTab.value === "guild" && activeSubtab.value === "guild-ascension-hall") {
        namedWasm.enterAscensionHall();
    }
    guildUnlocked.value = namedWasm.isGuildUnlocked();
    questActive.value = namedWasm.isQuestActive();
    if (namedWasm.consumeAutoCondenseRequest()) condense();
    if (activeCrystal.value >= 0) {
        const goalHandle = CRYSTAL_GOALS[activeCrystal.value];
        nextGoal.value = crystalGoalReached.value ? "Shatter the Crystal" : formatCrystalGoal(goalHandle);
        nextGoalProgress.value = namedWasm.manaGoalProgress(0, namedWasm.getMagnitude(goalHandle), 1);
    } else {
        const goal = PROGRESSION_GOALS.find((candidate) => !isProgressionGoalComplete(candidate))
            ?? PROGRESSION_GOALS[PROGRESSION_GOALS.length - 1];
        nextGoal.value = goal.label;
        nextGoalProgress.value = namedWasm.manaGoalProgress(
            goal.startExponent,
            goal.endExponent,
            goal.maximumBeforeCompletion,
        );
    }
    setStarManaProgress(namedWasm.manaCondenseProgress());
    if (!questActive.value && activeTab.value === "quest") selectTab("guild");
    updateNavigationUnlockPings();
}

function pingTab(id) {
    if (!pingedTabs.value.includes(id)) pingedTabs.value = [...pingedTabs.value, id];
}

function pingSubtab(tabId, subtabId) {
    pingTab(tabId);
    if (!pingedSubtabs.value.includes(subtabId)) {
        pingedSubtabs.value = [...pingedSubtabs.value, subtabId];
    }
}

function updateNavigationUnlockPings() {
    const tabs = visibleTabs.value;
    if (!navigationUnlocksInitialized) {
        for (const tab of tabs) {
            knownTabIds.add(tab.id);
            for (const subtab of tab.subtabs ?? []) knownSubtabIds.add(subtab.id);
        }
        navigationUnlocksInitialized = true;
        return;
    }
    for (const tab of tabs) {
        const tabWasKnown = knownTabIds.has(tab.id);
        if (!tabWasKnown) {
            knownTabIds.add(tab.id);
            pingTab(tab.id);
        }
        for (const subtab of tab.subtabs ?? []) {
            if (knownSubtabIds.has(subtab.id)) continue;
            knownSubtabIds.add(subtab.id);
            if (tabWasKnown) pingSubtab(tab.id, subtab.id);
        }
    }
}

function updateAutocastersDisplay() {
    guild.value.coins = formatDecimal(HANDLES.coins, 0);
    const casters = Array.from({ length: MAX_AUTOCASTERS }, (_, id) => {
        const tier = namedWasm.autocasterTier(id);
        if (tier === 0) return null;
        const wageRemaining = namedWasm.autocasterWageTimer(id);
        return {
            id,
            tier,
            name: AUTOCASTER_NAMES[namedWasm.autocasterNameIndex(id)] ?? "Mysterious Caster",
            assignment: namedWasm.autocasterAssignment(id),
            position: namedWasm.autocasterRosterPosition(id),
            wage: AUTOCASTER_TIERS[tier - 1].wage,
            sellPrice: AUTOCASTER_TIERS[tier - 1].sellPrice,
            status: wageRemaining > 0 ? `Wage due in ${formatShortTimer(wageRemaining)}` : "Waiting for activation...",
        };
    });
    autocasters.value = {
        casters,
        tasks: AUTOCASTER_TASKS.map((task) => ({
            ...task,
            caster: casters.find((caster) => caster?.assignment === task.id) ?? null,
            castsMax: task.id < 5 ? namedWasm.producerAutocasterCastsMax(task.id) : false,
            purifyMinimum: task.id === 6 ? namedWasm.autocasterPurifyMinimumRelativeMultiplier() : 1.01,
        })),
        hireOptions: AUTOCASTER_TIERS.map((tier) => ({ ...tier, affordable: namedWasm.canHireAutocaster(tier.tier) })),
    };
}

function isProgressionGoalComplete(goal) {
    switch (goal.completion) {
        case "sealed-meridians":
            return namedWasm.toNumber(HANDLES.sealedMeridians) > 1 || namedWasm.isGuildUnlocked();
        case "meridian-purification":
            return namedWasm.gt(HANDLES.purifiedMeridiansMultiplier, 1) || namedWasm.isGuildUnlocked();
        case "guild-member":
            return namedWasm.isGuildMember();
        case "courage":
            return namedWasm.isCourageUnlocked() || namedWasm.hasCondensed();
        case "first-circle-expanded":
            return manaCircle.value > 0;
        default:
            return false;
    }
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
    gameSpeed.value = formatGameSpeed(namedWasm.getGameSpeed());
    gameSpeedIncreased.value = namedWasm.isGameSpeedIncreased();
    manaPerSecond.value = formatDecimal(SCRATCH_HANDLES.manaPerSecond);
    oomPerSecond.value = formatOoMPerSecond(SCRATCH_HANDLES.oomPerSecond);
    showOoMPerSecond.value = namedWasm.getIncType() === 1;
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
        const bought = namedWasm.tierOneBoughtHandle(upgrade.index);
        upgrade.amount = formatDecimal(upgrade.handle, 0);
        upgrade.bought = formatDecimal(bought, 0);
        upgrade.boughtGT10000 = namedWasm.gt(bought, SCRATCH_HANDLES.D10000);
        upgrade.cost = `${formatDecimal(upgrade.costHandle)} mana`;
        upgrade.multiplier = `×${formatDecimal(namedWasm.tierOneDisplayMultiplierHandle(upgrade.index))}`;
        upgrade.visible = namedWasm.isTierOneVisible(upgrade.index);
        upgrade.affordable = namedWasm.canBuyTierOne(upgrade.index);
        upgrade.empowerCost = formatDecimal(upgrade.empowermentCostHandle);
        upgrade.empowered = formatDecimal(upgrade.empowermentHandle, 0);
        upgrade.empowerVisible = namedWasm.canEmpowerTierOne(upgrade.index);
        upgrade.hasNextTier = upgrade.index < tierOneUpgrades.value.length - 1
            && namedWasm.gt(namedWasm.tierOneBoughtHandle(upgrade.index + 1), 0);
        upgrade.affordabilityProgress = namedWasm.tierOneAffordabilityProgress(upgrade.index);
    }
    castSpeedSpell.value.timer = formatDuration(HANDLES.castSpeedTimer);
    castSpeedSpell.value.magnitude = `×${formatDecimal(HANDLES.castSpeedMagnitude)}`;
    castSpeedSpell.value.power = formatDecimalCompact(HANDLES.matrixSpeedPower);
    castSpeedSpell.value.showPower = !namedWasm.eq(HANDLES.matrixSpeedPower, 2);
    castSpeedSpell.value.cost = `${formatDecimal(HANDLES.castSpeedCost)} mana`;
    castSpeedSpell.value.affordable = namedWasm.canCastSpeed();
    sealedMeridians.value.level = formatDecimal(HANDLES.sealedMeridians, 0);
    sealedMeridians.value.effect = formatDecimal(HANDLES.sealedMeridiansSpeedEffect, 0);
    sealedMeridians.value.magnitude = formatDecimalCompact(namedWasm.sealedMeridianMagnitudeHandle());
    const progressionCostResource = activeCrystal.value === 3 ? "Mana Absorbers" : "Meridians";
    sealedMeridians.value.cost = `${formatDecimal(HANDLES.sealMeridiansCost, 0)} ${progressionCostResource}`;
    sealedMeridians.value.affordable = namedWasm.canSealMeridians();
    sealedMeridians.value.visible = namedWasm.areSealedMeridiansVisible();
    matrix.value.level = formatDecimal(HANDLES.matrixOwned, 0);
    matrix.value.other = formatDecimalCompact(namedWasm.matrixOtherEffectHandle());
    matrix.value.effect = formatDecimalCompact(namedWasm.crystalMatrixEffectHandle());
    matrix.value.power = formatDecimalCompact(namedWasm.matrixMagnitudeHandle());
    matrix.value.cost = `${formatDecimal(HANDLES.matrixCost, 0)} ${progressionCostResource}`;
    matrix.value.affordable = namedWasm.canIncreaseMatrix();
    matrix.value.visible = namedWasm.isMatrixVisible();
    courage.value.visible = namedWasm.isCourageVisible();
    courage.value.active = namedWasm.isCourageActive();
    courage.value.available = namedWasm.toNumber(HANDLES.courageCooldown) <= 0;
    courage.value.timer = formatDuration(HANDLES.courageTimer);
    courage.value.cooldown = formatDuration(HANDLES.courageCooldown);
    namedWasm.refreshCourageMultiplier();
    courage.value.multiplier = formatDecimal(HANDLES.courageMultiplier);
    meridianPurification.value.affordable = namedWasm.canPurifyMeridians();
    meridianPurification.value.visible = namedWasm.hasTierOneAchievement(7);
    meridianPurification.value.effect = `×${formatDecimal(HANDLES.meridianPurificationEffect)}`;
    meridianPurification.value.relIncrease = `×${formatDecimal(SCRATCH_HANDLES.purificationRelativeIncrease)}`;
    meridianPurification.value.multiplier = `×${formatDecimal(HANDLES.purifiedMeridiansMultiplier)}`;
    meridianPurification.value.requirement = formatDecimal(HANDLES.meridianPurificationRequirement);
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
    equipmentUnlocked.value = namedWasm.isEquipmentUnlocked();
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
    guild.value.equipmentItems = Array.from({ length: 4 }, (_, slot) => {
        const type = namedWasm.equippedItem(slot);
        return type === 0 ? null : { type, ...displayedItemDefinition(type) };
    });
}

function equipInventoryItem(position, slot) {
    namedWasm.equipInventoryItem(position, slot);
}

function unequipInventoryItem(slot, position) {
    namedWasm.unequipInventoryItem(slot, position);
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
    combat.value.enemyMaximumHealth = formatDecimal(namedWasm.enemyMaximumHealth(namedWasm.activeQuestIndex()), 0);
    combat.value.enemyPercent = namedWasm.wolfineHealthPercent();
    combat.value.shield = formatDecimal(namedWasm.combatShieldHandle(), 0);
    combat.value.shieldPercent = namedWasm.combatShieldPercent();
    combat.value.freezeTurns = formatDecimal(HANDLES.combatFreezeTurns, 0);
    for (const spell of combat.value.spells) {
        spell.unlocked = spell.upgrade === undefined || namedWasm.hasGuildShopUpgrade(spell.upgrade);
        spell.cost = formatDecimal(spell.costHandle);
        spell.affordable = namedWasm.canCastCombatSpell(spell.index);
    }
}

function updateCondensedDisplay() {
    namedWasm.refreshCondensedUpgradeState();
    namedWasm.refreshCondenseGain();
    memories.value.remembered = namedWasm.getTotalMemories();
    memories.value.focusing = namedWasm.isFocusing();
    memories.value.manaMultiplier = formatDecimal(namedWasm.memoryManaMultiplierHandle());
    const memoryChance = memories.value.focusing
        ? namedWasm.memoryChance(SCRATCH_HANDLES.condenseGain)
        : namedWasm.baseMemoryChance();
    memories.value.nextChance = (memoryChance * 100).toFixed(2);
    for (const upgrade of condensedUpgrades.value) {
        const finalUpgrade = upgrade.index === condensedUpgrades.value.length - 1;
        const circleTwoUnlocked = !finalUpgrade || namedWasm.canSeeCircleTwoFinalUpgrade();
        upgrade.circleTwoAvailable = manaCircle.value > 0
            && circleTwoUnlocked
            && namedWasm.hasCondensedUpgrade(upgrade.index);
        upgrade.circleTwoPurchased = namedWasm.hasCircleTwoCondensedUpgrade(upgrade.index);
        const costHandle = upgrade.circleTwoAvailable ? upgrade.circleTwo.costHandle : upgrade.costHandle;
        upgrade.cost = formatDecimal(costHandle, 0);
        upgrade.purchased = namedWasm.hasCondensedUpgrade(upgrade.index);
        upgrade.affordable = namedWasm.canBuyCondensedUpgrade(upgrade.index);
        upgrade.visible = !finalUpgrade || manaCircle.value > 0 || namedWasm.canSeeAscensionHallUpgrade();
    }
    for (const [key, placeholder] of Object.entries(CONDENSED_UPGRADE_PLACEHOLDERS)) {
        condensedUpgradePlaceholders.value[key] = `${placeholder.prefix}${formatDecimal(placeholder.handle)}`;
    }
}

function updateStatisticsDisplay() {
    statistics.value.timePlayed = formatTotalTime(HANDLES.statistics_totalTimePlayed);
    statistics.value.gameTimePlayed = formatTotalTime(HANDLES.statistics_gameTimePlayed);
    statistics.value.manaProduced = formatDecimal(HANDLES.statistics_totalManaProduced, 2, "Maximum");
    statistics.value.condensedManaProduced = formatDecimal(HANDLES.statistics_condensedManaProduced);
    statistics.value.condenses = formatDecimal(HANDLES.statistics_condenses, 0);
    statistics.value.timeThisCondense = formatTotalTime(HANDLES.statistics_timeThisCondense);
    statistics.value.fastestCondense = formatCompletionTime(
        namedWasm.toNumber(HANDLES.statistics_fastestCondense),
        3,
    );
    statistics.value.hasCondensed = namedWasm.hasCondensed();
}

function updateAchievementsDisplay() {
    const timePlayedAchievement = achievements.value.find((achievement) => achievement.id === "achievement_playtwohours");
    if (timePlayedAchievement) {
        timePlayedAchievement.reward = `Mana is increased based on time played (Currently: ×${formatDecimal(HANDLES.multiplier_timePlayedAchievement)})`;
    }
}

function updateAchievementNotifications(force = false) {
    const revision = namedWasm.getAchievementRevision();
    if (!force && revision === displayedAchievementRevision) return;
    for (const achievement of achievements.value) {
        const unlocked = namedWasm.hasTierOneAchievement(achievement.wasmIndex);
        const beyondManaCircle = (achievement.circle ?? 1) > manaCircle.value + 1;
        if (achievementsInitialized && unlocked && !achievement.unlocked && !beyondManaCircle) {
            const challenge = achievement.category === "challenge";
            showNotification(`Achievement: ${achievement.title}`, {
                color: "#c49cff",
                textColor: challenge ? "#c49cff" : "#fff",
                duration: challenge ? 8000 : 4000,
            });
        }
        achievement.unlocked = unlocked;
    }
    achievementsInitialized = true;
    displayedAchievementRevision = revision;
}

function formatOoMPerSecond(handle) {
    const value = namedWasm.toNumber(handle);
    if (Number.isFinite(value) && Math.abs(value) < 0.01) return "0.00";
    return formatDecimal(handle);
}

function formatGameSpeed(handle) {
    if (!namedWasm.gt(handle, 0) || !namedWasm.lt(handle, 0.01)) return formatDecimal(handle);
    const speed = Number(namedWasm.readString(handle));
    return Number.isFinite(speed) ? speed.toExponential(2).replace("+", "") : formatDecimal(handle);
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
    starsVisible.value = visible;
    applyStarsVisible(visible);
}

function setStarsAnimated(animated) {
    starsAnimated.value = animated;
    applyStarsAnimated(animated);
}

function setNewsTickerEnabled(enabled) {
    newsTickerEnabled.value = enabled;
    localStorage.setItem("newsTickerEnabled", String(enabled));
}

function setMessageTickerParticles(enabled) {
    messageTickerParticles.value = enabled;
    localStorage.setItem("messageTickerParticles", String(enabled));
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

function sealMeridians() {
    sealMeridiansAction();
}

function increaseMatrix() {
    increaseMatrixAction();
}

function activateCourage() {
    namedWasm.activateCourage();
}

function handleCondensed() {
    castMax.value = false;
}

function enterCrystal(index) {
    if (!enterCrystalAction(index)) return;
    castMax.value = false;
    selectTab("mana");
}

function handlePrimaryResetAction() {
    if (activeCrystal.value < 0) {
        condense();
        return;
    }
    shatterCrystalAction();
}

function escapeCrystal() {
    if (!escapeCrystalAction()) return;
    castMax.value = false;
    selectTab("mana");
}

function buyCondensedUpgrade(index) {
    if (!namedWasm.buyCondensedUpgrade(index)) return;
    namedWasm.applyCondensedSealedMeridiansMinimum();
    namedWasm.refreshSealedMeridiansDerivedState();
    namedWasm.refreshMatrixDerivedState();
    namedWasm.refreshSealedMeridiansDerivedState();
    namedWasm.refreshTierOneDerivedState();
    if (index === 11) namedWasm.resetCastSpeed();
}

function focus() {
    if (!focusAction()) return;
    castMax.value = false;
}

function expandManaCircle() {
    if (!namedWasm.expandManaCircle()) return;
    manaCircle.value = namedWasm.toNumber(HANDLES.mana_circle_tier);
    selectTab("mana");
    pingTab("mana");
    pingTab("condensed");
    manaCircleExpansionVisible.value = true;
    void saveGame();
}

function purifyMeridians() {
    namedWasm.purifyMeridians();
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

function hireAutocaster(tier) {
    const nameIndex = Math.floor(Math.random() * AUTOCASTER_NAMES.length);
    if (namedWasm.hireAutocaster(tier, nameIndex) >= 0) void saveGame();
}

function assignAutocaster(caster, task) {
    if (namedWasm.assignAutocaster(caster, task)) void saveGame();
}

function moveAutocaster(caster, position) {
    if (namedWasm.moveAutocaster(caster, position)) void saveGame();
}

function setAutocasterCastsMax(task, value) {
    namedWasm.setProducerAutocasterCastsMax(task, value);
    void saveGame();
}

function setAutocasterPurifyMinimum(value) {
    namedWasm.setAutocasterPurifyMinimumRelativeMultiplier(value);
    void saveGame();
}

function sellAutocaster(caster) {
    if (namedWasm.sellAutocaster(caster)) void saveGame();
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
    unsubscribeFromMemoryGain = subscribeToMemoryGain(() => {
        showNotification("You gained a Memory!");
    });
    unsubscribeFromTimeSimulation = subscribeToTimeSimulation((state) => {
        timeSimulation.value = state;
    });
    animationFrame = requestAnimationFrame(updateDisplay);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", recordClick);
    unsubscribeFromCondense?.();
    unsubscribeFromMemoryGain?.();
    unsubscribeFromTimeSimulation?.();
    cancelAnimationFrame(animationFrame);
});
</script>

<template>
    <div class="game-shell">
        <div
            v-if="activeCrystal >= 0"
            class="active-crystal-screen"
            :style="{ '--active-crystal-color': CRYSTALS[activeCrystal].color }"
            aria-hidden="true"
        >
            <span class="crystal-screen-facet facet-a" />
            <span class="crystal-screen-facet facet-b" />
            <span class="crystal-screen-facet facet-c" />
        </div>
        <a
            class="discord-link"
            href="https://discord.gg/KXmEYc6gxm"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join The Mana Paradox Discord"
            title="Join The Mana Paradox Discord"
        ><img :src="'./img/discord.png'" alt=""></a>
        <NotificationStack />
        <ManaCircleExpansion
            v-if="manaCircleExpansionVisible"
            @complete="manaCircleExpansionVisible = false"
        />
        <TimeSimulation
            :simulation="timeSimulation"
            @speed-up="speedUpTimeSimulation"
            @skip="skipTimeSimulation"
        />
        <GameHeader :mana="mana" />
        <button
            v-if="activeCrystal >= 0 || canCondense || manaCircle > 0"
            class="condense-button"
            type="button"
            :disabled="activeCrystal >= 0 ? !crystalCanShatter : !canCondense"
            @click="handlePrimaryResetAction"
        >
            <strong>{{ activeCrystal >= 0 ? (crystalGoalReached ? "Shatter the Crystal" : formatCrystalGoal(CRYSTAL_GOALS[activeCrystal])) : (memories.focusing ? "Remember" : "Condense") }}</strong>
            <small v-if="activeCrystal < 0 && manaCircle > 0 && canCondense">
                <br>{{ memories.focusing ? `for an ${memories.nextChance}% chance` : `for ${condenseManaGained} condensed mana` }}
            </small>
        </button>
        <button
            v-if="activeCrystal >= 0"
            class="escape-crystal-button"
            type="button"
            @click="escapeCrystal"
        >
            Escape Crystal
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
            :pinged-tabs="pingedTabs"
            :pinged-subtabs="pingedSubtabs"
            @select-tab="selectTab"
            @select-subtab="selectSubtab"
        />
        <main class="content-frame">
            <ManaTab
                v-if="activeTab === 'mana'"
                :upgrades="tierOneUpgrades"
                :cast-speed="castSpeedSpell"
                :cast-mode="castMax ? 'Cast Max' : 'Cast One'"
                :sealed-meridians="sealedMeridians"
                :matrix="matrix"
                :courage="courage"
                :meridian-purification="meridianPurification"
                :potion-effects="potionEffects"
                :game-speed="gameSpeed"
                :game-speed-increased="gameSpeedIncreased"
                :manaPerSecond="manaPerSecond"
                :oom-per-second="oomPerSecond"
                :show-oo-m-per-second="showOoMPerSecond"
                :producers-only="activeCrystal === 2"
                @buy="buyTierOne"
                @empower="empowerTierOne"
                @buy-all="buyAllTierOne"
                @toggle-cast-mode="toggleCastMode"
                @cast-speed="castSpeed"
                @seal-meridians="sealMeridians"
                @increase-matrix="increaseMatrix"
                @activate-courage="activateCourage"
                @purify-meridians="purifyMeridians"
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
                :memories="memories"
                :isAscended="manaCircle > 0"
                @buy="buyCondensedUpgrade"
                @focus="focus"
            />
            <ManaCircleTab
                v-else-if="activeTab === 'manacircle'"
                :active-subtab="activeSubtab"
                :mana-circle="manaCircle"
            />
            <CrystalsTab
                v-else-if="activeTab === 'crystals'"
                :active-subtab="activeSubtab"
                @enter="enterCrystal"
            />
            <GuildTab
                v-else-if="activeTab === 'guild'"
                :active-subtab="activeSubtab"
                :guild="guild"
                :quests="guildQuests"
                :quest-result="questResult"
                :mana-circle="manaCircle"
                :equipment-unlocked="equipmentUnlocked"
                @apply="applyToGuild"
                @accept="acceptGuildQuest"
                @dismiss-result="dismissQuestResult"
                @move-item="moveInventoryItem"
                @equip-item="equipInventoryItem"
                @unequip-item="unequipInventoryItem"
                @use-item="useInventoryItem"
                @sell-item="sellInventoryItem"
                @sell-all-materials="sellAllMaterials"
                @sell-all-items="sellAllItems"
                @drink-all-potions="drinkAllPotions"
                @buy-shop-item="buyShopItem"
                @buy-shop-upgrade="buyGuildShopUpgrade"
                @ascend="expandManaCircle"
            />
            <QuestTab
                v-else-if="activeTab === 'quest'"
                :combat="combat"
                @cast="castCombatSpell"
                @abandon="abandonGuildQuest"
            />
            <AutocastersTab
                v-else-if="activeTab === 'autocasters'"
                :autocasters="autocasters"
                :coins="guild.coins"
                @hire="hireAutocaster"
                @assign="assignAutocaster"
                @move="moveAutocaster"
                @sell="sellAutocaster"
                @casts-max="setAutocasterCastsMax"
                @purify-minimum="setAutocasterPurifyMinimum"
            />
            <AchievementsTab
                v-else-if="activeTab === 'achievements'"
                :active-subtab="activeSubtab"
                :achievements="achievements"
                :mana-circle="manaCircle + 1"
            />
            <OptionsTab
                v-else-if="activeTab === 'options'"
                :active-subtab="activeSubtab"
                :update-rate="updateRate"
                :stars-visible="starsVisible"
                :stars-animated="starsAnimated"
                :news-ticker-enabled="newsTickerEnabled"
                :message-ticker-particles="messageTickerParticles"
                @edit-keybinds="editKeybinds"
                @stars-visible="setStarsVisible"
                @stars-animated="setStarsAnimated"
                @news-ticker-enabled="setNewsTickerEnabled"
                @message-ticker-particles="setMessageTickerParticles"
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
        <MessageTicker
            v-if="newsTickerEnabled"
            :key="messageTickerParticles ? 'particles' : 'text'"
            :particles="messageTickerParticles"
            @message-displayed="updateMessageTickerStatistics"
        />
        <footer>The Mana Paradox v0.0.12</footer>
        <GoalProgressBar :goal="nextGoal" :progress="nextGoalProgress" />
    </div>
</template>
