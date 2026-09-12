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
    locked: Boolean,
});
defineEmits(["cast", "empower"]);
</script>

<template>
    <article class="upgrade-row" :class="{ locked }" :style="{ '--affordability-progress': affordabilityProgress }">
        <div v-if="empowered === '0'"><h2>{{ name }}</h2></div>
        <div v-else-if="empowered === '1'"><h2>{{ name }} ⭐</h2></div>
        <div v-else><h2>{{ name }} ⭐{{ empowered }}</h2></div>
        <div class="upgrade-effect"><span>{{ amount }} owned</span><strong>{{ multiplier }}</strong></div>
        <div class="upgrade-actions">
            <button v-show="empowerVisible" class="empower-button" type="button" @click="$emit('empower')"><span>Empower</span><strong>{{ empowerCost }} owned</strong></button>
            <button class="cast-producer" type="button" :disabled="locked" @click="$emit('cast')"><span>{{ castLabel }}</span><strong>{{ cost }}</strong></button>
        </div>
        <span class="affordability-bar" aria-hidden="true" />
    </article>
</template>
