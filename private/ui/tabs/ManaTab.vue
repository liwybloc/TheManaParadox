<script setup>
import UpgradeRow from "../components/UpgradeRow.vue";

defineProps({
    upgrades: { type: Array, required: true },
    castSpeed: { type: Object, required: true },
    castMode: { type: String, required: true },
    mastery: { type: Object, required: true },
    matrix: { type: Object, required: true },
    bolster: { type: Object, required: true },
});
defineEmits(["buy", "empower", "buy-all", "toggle-cast-mode", "cast-speed", "increase-mastery", "increase-matrix", "bolster"]);
</script>

<template>
    <section class="tab-panel">
        <div class="cast-controls">
            <button class="cast-all" type="button" @click="$emit('buy-all')">Cast All</button>
            <button class="cast-mode" type="button" @click="$emit('toggle-cast-mode')">{{ castMode }}</button>
        </div>
        <button
            class="cast-speed"
            type="button"
            :disabled="!castSpeed.affordable"
            @click="$emit('cast-speed')"
        >
            <strong>Cast Speed</strong>
            <span>{{ castSpeed.timer }} · {{ castSpeed.magnitude }}</span>
            <small>Cost: {{ castSpeed.cost }}</small>
        </button>
        <div class="upgrade-list">
            <UpgradeRow
                v-for="upgrade in upgrades"
                v-show="upgrade.visible"
                :key="upgrade.id"
                v-bind="upgrade"
                :cast-label="castMode === 'Cast Max' ? 'Cast all' : 'Cast one'"
                :locked="!upgrade.affordable"
                @cast="$emit('buy', upgrade.index)"
                @empower="$emit('empower', upgrade.index)"
            />
        </div>
        <button
            v-show="bolster.visible"
            class="bolster-staff"
            type="button"
            :disabled="!bolster.affordable"
            @click="$emit('bolster')"
        >
            <strong>Bolster</strong>
            <span>{{ bolster.affordable ? `${bolster.effect} after Bolster (${bolster.relIncrease})` : `Requires ${bolster.requirement} Mana Conduits` }}</span>
            <small>{{ bolster.multiplier }} Total Production</small>
        </button>
        <div v-show="mastery.visible" class="mastery-controls">
            <div class="mastery-summary">Mastery Level: {{ mastery.level }} (×{{ mastery.effect }})</div>
            <button
                class="increase-mastery"
                type="button"
                :disabled="!mastery.affordable"
                @click="$emit('increase-mastery')"
            >
                <strong>Increase Mastery</strong>
                <span>×2 Speed Magnitude</span>
                <small>Cost: {{ mastery.cost }}</small>
            </button>
        </div>
        <div v-show="matrix.visible" class="mastery-controls">
            <div class="matrix-summary">Crystal Matrices: {{ matrix.level }} (×{{ matrix.effect }})</div>
            <button
                class="increase-matrix"
                type="button"
                :disabled="!matrix.affordable"
                @click="$emit('increase-matrix')"
            >
                <strong>Conjure Crystal Matrix</strong>
                <span>+{{ matrix.power }} Speed Power</span>
                <small>Cost: {{ matrix.cost }}</small>
            </button>
        </div>
    </section>
</template>
