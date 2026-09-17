<script setup>
import { computed } from "vue";
import { PROGRESSION_ACHIEVEMENT_ORDER } from "@game/game/achievements.js";

const props = defineProps({
    activeSubtab: { type: String, required: true },
    achievements: { type: Array, required: true },
    manaCircle: { type: Number, required: true },
});

const visibleAchievements = computed(() => {
    const challenge = props.activeSubtab === "challenge-achievements";
    const filtered = props.achievements.filter((achievement) => (achievement.category === "challenge") === challenge);
    if (challenge) return filtered;
    return filtered.sort((left, right) => (
        PROGRESSION_ACHIEVEMENT_ORDER.indexOf(left.number) - PROGRESSION_ACHIEVEMENT_ORDER.indexOf(right.number)
    ));
});

function useFallbackImage(event) {
    const image = event.currentTarget;
    if (image.dataset.fallback === "true") return;
    image.dataset.fallback = "true";
    image.src = "./img/achievement_0.png";
}

function isBeyondManaCircle(achievement) {
    return (achievement.circle ?? 1) > props.manaCircle;
}
</script>

<template>
    <section class="tab-panel achievement-list">
        <div
            v-for="(achievement, displayIndex) in visibleAchievements"
            :key="achievement.id"
            class="achievement-entry"
            :class="{ unlocked: achievement.unlocked && !isBeyondManaCircle(achievement), 'beyond-mana-circle': isBeyondManaCircle(achievement) }"
            tabindex="0"
        >
            <template v-if="!isBeyondManaCircle(achievement)">
            <img
                class="achievement-art"
                :src="`./img/achievement_${achievement.number}.png`"
                alt=""
                @error="useFallbackImage"
            />
            <span class="achievement-number">{{ displayIndex + 1 }}</span>
            <div class="achievement-details">
                <strong>{{ achievement.title }}</strong>
            </div>
            <div class="achievement-tooltip" role="tooltip">
                <strong>{{ achievement.title }} ({{ displayIndex + 1 }})</strong>
                <span>{{ achievement.description }}</span>
                <span v-if="achievement.reward" class="achievement-reward">Reward: {{ achievement.reward }}</span>
            </div>
            </template>
            <span v-else class="unknown-achievement" aria-label="Achievement from a future mana circle">?</span>
        </div>
    </section>
</template>
