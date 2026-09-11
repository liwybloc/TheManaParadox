<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { HANDLES } from "@game/player.js";
import { namedWasm } from "@generated/_wasm$globals.js";
import GameHeader from "./components/GameHeader.vue";
import TabNavigation from "./components/TabNavigation.vue";
import ManaTab from "./tabs/ManaTab.vue";
import OptionsTab from "./tabs/OptionsTab.vue";

const tabs = [
    {
        id: "mana",
        label: "Mana",
        icon: "✦",
        subtabs: [{ id: "basic-spells", label: "Basic Spells" }],
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
const activeSubtabs = ref({ mana: "basic-spells", options: "general" });
const mana = ref("0");
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
    multiplierHandle: namedWasm.tierOneMultiplierHandle(index),
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
let animationFrame;

const activeSubtab = computed(() => activeSubtabs.value[activeTab.value]);

function selectTab(id) {
    activeTab.value = id;
}

function selectSubtab(id) {
    activeSubtabs.value[activeTab.value] = id;
}

function updateDisplay() {
    mana.value = formatDecimal(HANDLES.mana);
    for (const upgrade of tierOneUpgrades.value) {
        upgrade.amount = formatDecimal(upgrade.handle, 0);
        upgrade.cost = `${formatDecimal(upgrade.costHandle)} mana`;
        upgrade.multiplier = `×${formatDecimal(upgrade.multiplierHandle)}`;
        upgrade.visible = namedWasm.isTierOneVisible(upgrade.index);
        upgrade.affordable = namedWasm.canBuyTierOne(upgrade.index);
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
    animationFrame = requestAnimationFrame(updateDisplay);
}

function formatDecimal(handle, decimals = 2) {
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

function setStarsVisible(visible) {
    document.body.classList.toggle("effects-disabled", !visible);
}

function buyTierOne(index) {
    if (castMax.value) namedWasm.buyMaxTierOne(index);
    else namedWasm.buyTierOne(index);
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

onMounted(() => {
    animationFrame = requestAnimationFrame(updateDisplay);
});

onBeforeUnmount(() => cancelAnimationFrame(animationFrame));
</script>

<template>
    <div class="game-shell">
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
                @buy="buyTierOne"
                @buy-all="buyAllTierOne"
                @toggle-cast-mode="toggleCastMode"
                @cast-speed="castSpeed"
                @increase-mastery="increaseMastery"
            />
            <OptionsTab
                v-else-if="activeTab === 'options'"
                :active-subtab="activeSubtab"
                @stars-visible="setStarsVisible"
            />
        </main>
        <footer>The Mana Paradox</footer>
    </div>
</template>
