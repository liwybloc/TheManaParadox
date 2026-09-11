<script setup>
defineProps({
    name: { type: String, required: true },
    amount: { type: String, required: true },
    cost: { type: String, required: true },
    multiplier: { type: String, required: true },
    castLabel: { type: String, required: true },
    locked: Boolean,
});
defineEmits(["cast"]);
</script>

<template>
    <article class="upgrade-row" :class="{ locked }">
        <div><h2>{{ name }}</h2></div>
        <div class="upgrade-effect"><span>{{ amount }} owned</span><strong>{{ multiplier }}</strong></div>
        <button type="button" :disabled="locked" @click="$emit('cast')"><span>{{ castLabel }}</span><strong>{{ cost }}</strong></button>
    </article>
</template>
