<script setup>
defineProps({
    goal: {
        type: String,
        required: true,
    },
    progress: {
        type: Number,
        required: true,
    },
});
</script>

<template>
    <div
        class="goal-progress"
        :data-tooltip="`Percentage to ${goal}`"
        role="progressbar"
        :aria-label="`Percentage to ${goal}`"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress * 10000) / 100"
    >
        <div class="goal-progress-fill" :style="{ width: `${progress * 100}%` }"></div>
        <strong>{{ (progress * 100).toFixed(2) }}%</strong>
    </div>
</template>
