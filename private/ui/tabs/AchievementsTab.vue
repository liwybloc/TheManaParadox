<script setup>
defineProps({ achievements: { type: Array, required: true } });

function useFallbackImage(event) {
    const image = event.currentTarget;
    if (image.dataset.fallback === "true") return;
    image.dataset.fallback = "true";
    image.src = "./img/achievement_0.png";
}
</script>

<template>
    <section class="tab-panel achievement-list">
        <div
            v-for="achievement in achievements"
            :key="achievement.id"
            class="achievement-entry"
            :class="{ unlocked: achievement.unlocked }"
            tabindex="0"
        >
            <img
                class="achievement-art"
                :src="`./img/achievement_${achievement.number}.png`"
                alt=""
                @error="useFallbackImage"
            />
            <span class="achievement-number">{{ achievement.number }}</span>
            <div class="achievement-details">
                <strong>{{ achievement.title }}</strong>
            </div>
            <div class="achievement-tooltip" role="tooltip">
                <strong>{{ achievement.title }} ({{ String(achievement.number) }})</strong>
                <span>{{ achievement.description }}</span>
                <span v-if="achievement.reward" class="achievement-reward">Reward: {{ achievement.reward }}</span>
            </div>
        </div>
    </section>
</template>
