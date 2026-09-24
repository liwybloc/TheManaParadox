<script setup>
defineProps({
    name: { type: String, required: true },
    amount: { type: String, required: true },
    cost: { type: String, required: true },
    empowered: { type: String, required: true },
    multiplier: { type: String, required: true },
    castLabel: { type: String, required: true },
    empowerVisible: Boolean,
    empowerCost: { type: String, required: true },
    affordabilityProgress: { type: Number, required: true },
    bought: { type: String, required: true },
    locked: Boolean,
});
defineEmits(["cast", "empower"]);
</script>

<template>
    <article class="upgrade-row" :class="{ locked }" :style="{ '--affordability-progress': affordabilityProgress }">
        <div v-if="empowered === '0'"><h2>{{ name }}</h2></div>
        <div v-else-if="empowered === '1'"><h2>{{ name }} ⭐︎</h2></div>
        <div v-else><h2>{{ name }} ⭐︎{{ empowered }}</h2></div>
        <div class="upgrade-effect"><span>{{ amount }} owned</span><strong>{{ multiplier }}</strong></div>
        <div class="upgrade-actions">
            <button v-show="empowerVisible" class="empower-button" type="button" @click="$emit('empower')"><span>Empower</span><strong>{{ empowerCost }} owned</strong></button>
            <button class="cast-producer" type="button" :disabled="locked" @click="$emit('cast')">
                <span>{{ castLabel }}</span>
                <strong>{{ cost }}</strong>
            </button>
        </div>
        <div class="bought-tooltip" role="tooltip">
            You have cast this {{ bought }} time{{ bought != '1' ? 's' : '' }}
        </div>
        <span class="affordability-bar" aria-hidden="true"></span>
    </article>
</template>

<style scoped>
.upgrade-row:has(.cast-producer:hover),
.upgrade-row:has(.cast-producer:focus-visible) {
    z-index: 2;
    overflow: visible;
}

.bought-tooltip {
    position: absolute;
    right: 16px;
    bottom: calc(100% - 5px);
    z-index: 3;
    width: max-content;
    max-width: min(260px, calc(100vw - 32px));
    padding: 7px 9px;
    border: 1px solid #76509f;
    border-radius: 4px;
    color: #eee;
    background: #21182c;
    box-shadow: 0 4px 12px #0009;
    font-size: 11px;
    line-height: 1.3;
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition: opacity 120ms ease, transform 120ms ease;
}

.upgrade-row:has(.cast-producer:hover) .bought-tooltip,
.upgrade-row:has(.cast-producer:focus-visible) .bought-tooltip {
    opacity: 1;
    transform: translateY(0);
}
</style>
