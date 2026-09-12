<script setup>
defineProps({ simulation: { type: Object, required: true } });
defineEmits(["speed-up", "skip"]);

function formatSeconds(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const remainingSeconds = totalSeconds % 60;
    return [hours, minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}
</script>

<template>
    <div v-if="simulation.active" class="simulation-overlay">
        <section class="simulation-dialog" role="dialog" aria-modal="true" aria-labelledby="simulation-title">
            <h2 id="simulation-title">Simulating Time</h2>
            <p>{{ formatSeconds(simulation.simulatedSeconds) }} / {{ formatSeconds(simulation.totalSeconds) }}</p>
            <div class="simulation-progress">
                <div :style="{ width: `${simulation.progress * 100}%` }"></div>
            </div>
            <div class="simulation-actions">
                <button type="button" @click="$emit('speed-up')">Speed Up ({{ simulation.speed }}x)</button>
                <button type="button" @click="$emit('skip')">Skip</button>
            </div>
        </section>
    </div>
</template>
