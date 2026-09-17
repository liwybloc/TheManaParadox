<script setup>
import UpgradeRow from "../components/UpgradeRow.vue";

const props = defineProps({
    upgrades: { type: Array, required: true },
    castSpeed: { type: Object, required: true },
    castMode: { type: String, required: true },
    sealedMeridians: { type: Object, required: true },
    matrix: { type: Object, required: true },
    courage: { type: Object, required: true },
    meridianPurification: { type: Object, required: true },
    potionEffects: { type: Array, required: true },
    gameSpeed: { type: String, required: true },
    gameSpeedIncreased: { type: Boolean, required: true },
    manaPerSecond: { type: String, required: true },
    oomPerSecond: { type: String, required: true },
    showOoMPerSecond: { type: Boolean, required: true },
});
defineEmits(["buy", "empower", "buy-all", "toggle-cast-mode", "cast-speed", "seal-meridians", "increase-matrix", "activate-courage", "purify-meridians"]);

function producerActionLabel(upgrade) {
    if (upgrade.hasNextTier) return props.castMode === "Cast Max" ? "Boost max" : "Boost once";
    return props.castMode === "Cast Max" ? "Cast all" : "Cast one";
}
</script>

<template>
    <section class="tab-panel mana-panel">
        <aside v-if="potionEffects.length" class="potion-effects">
            <template v-if="potionEffects.length">
                <strong>Potion Effects:</strong>
                <span v-for="effect in potionEffects" :key="effect.id">{{ effect.text }}</span>
            </template>
        </aside>
        <div class="cast-controls">
            <button class="cast-all" type="button" @click="$emit('buy-all')">Cast All</button>
            <div class="useful-stats">
                <strong class="mana-per-second">
                    Mana Per Second: {{ manaPerSecond }}
                    <span v-if="showOoMPerSecond"> ({{ oomPerSecond }} OoM)</span>
                </strong>
                <strong class="current-game-speed">Current Game Speed: ×{{ gameSpeed }}</strong>
            </div>
            <button class="cast-mode" type="button" @click="$emit('toggle-cast-mode')">{{ castMode }}</button>
        </div>
        <button
            class="cast-speed"
            type="button"
            :disabled="!castSpeed.affordable"
            @click="$emit('cast-speed')"
        >
            <strong>Meditate<span v-if="castSpeed.showPower"> (×{{ castSpeed.power }} per meditate)</span></strong>
            <span>{{ castSpeed.timer }} · {{ castSpeed.magnitude }}</span>
            <small>Cost: {{ castSpeed.cost }}</small>
        </button>
        <div class="upgrade-list">
            <UpgradeRow
                v-for="upgrade in upgrades"
                v-show="upgrade.visible"
                :key="upgrade.id"
                v-bind="upgrade"
                :cast-label="producerActionLabel(upgrade)"
                :locked="!upgrade.affordable"
                @cast="$emit('buy', upgrade.index)"
                @empower="$emit('empower', upgrade.index)"
            />
        </div>
        <button
            v-show="meridianPurification.visible"
            class="purify-meridians"
            type="button"
            :disabled="!meridianPurification.affordable"
            @click="$emit('purify-meridians')"
        >
            <strong>Purify Meridians</strong>
            <span>{{ meridianPurification.affordable ? `${meridianPurification.effect} after Purification (${meridianPurification.relIncrease})` : `Requires ${meridianPurification.requirement} Mana Absorbers` }}</span>
            <small>{{ meridianPurification.multiplier }} All Production</small>
            <small>(Consumes all producers before Meridians)</small>
        </button>
        <div v-show="sealedMeridians.visible" class="sealed-meridians-controls">
            <div class="sealed-meridians-summary">Sealed Meridians: {{ sealedMeridians.level }} (×{{ sealedMeridians.effect }})</div>
            <button
                class="seal-meridians"
                type="button"
                :disabled="!sealedMeridians.affordable"
                @click="$emit('seal-meridians')"
            >
                <strong>Seal Meridians</strong>
                <span>×{{ sealedMeridians.magnitude }} Meditation Magnitude</span>
                <small>Reach: {{ sealedMeridians.cost }}</small>
                <small>Resets everything beforehand</small>
            </button>
        </div>
        <div v-show="matrix.visible" class="sealed-meridians-controls">
            <div class="matrix-summary">Crystal Matrices: {{ matrix.level }} (×{{ matrix.base }} + ×{{ matrix.other }} + ×{{ matrix.effect }})</div>
            <button
                class="increase-matrix"
                type="button"
                :disabled="!matrix.affordable"
                @click="$emit('increase-matrix')"
            >
                <strong>Conjure Crystal Matrix</strong>
                <span>+{{ matrix.power }} Meditation Power</span>
                <small>Reach: {{ matrix.cost }}</small>
                <small>Resets everything beforehand</small>
            </button>
        </div>
        <button
            v-show="courage.visible"
            class="courage-button"
            :class="{ 'is-active': courage.active }"
            type="button"
            :disabled="!courage.available"
            @click="$emit('activate-courage')"
        >
            <span v-if="courage.active" class="courage-aura" aria-hidden="true"></span>
            <span v-if="courage.active" class="courage-sparks" aria-hidden="true">
                <i v-for="spark in 7" :key="spark"></i>
            </span>
            <strong>Courage</strong>
            <span>I must work up the courage.. to get stronger!</span>
            <small v-if="courage.active">×{{ courage.multiplier }} Game Speed · {{ courage.timer }}</small>
            <small v-else-if="!courage.available">×{{ courage.multiplier }} Game Speed · Cooldown: {{ courage.cooldown }}</small>
            <small v-else>×{{ courage.multiplier }} Game Speed · Ready</small>
        </button>
    </section>
</template>
