<script setup>
import { computed } from "vue";
import { MEMORY_MILESTONES, MEMORY_MILESTONE_REWARDS } from "@game/game/memories.js";

const props = defineProps({
    activeSubtab: { type: String, required: true },
    condensedMana: { type: String, required: true },
    upgrades: { type: Array, required: true },
    placeholders: { type: Object, required: true },
    isAscended: { type: Boolean, required: true },
    memories: { type: Object, required: true },
});
defineEmits(["buy", "focus"]);

const visibleMemoryMilestones = computed(() => {
    const firstLocked = MEMORY_MILESTONES.findIndex((milestone) => milestone > props.memories.remembered);
    if (firstLocked < 0) return MEMORY_MILESTONES.map((milestone) => ({
        milestone,
        reward: MEMORY_MILESTONE_REWARDS[milestone],
        unlocked: true,
        fade: 0,
    }));
    return MEMORY_MILESTONES.slice(0, firstLocked + 3).map((milestone, index) => ({
        milestone,
        reward: MEMORY_MILESTONE_REWARDS[milestone],
        unlocked: index < firstLocked,
        fade: Math.max(0, index - firstLocked),
    }));
});

function resolvePlaceholders(text) {
    return text.replace(/\{([A-Za-z0-9_]+)\}/g, (token, key) => props.placeholders[key] ?? token);
}

function resolveMemoryReward(reward) {
    return reward?.replace("{amount}", props.memories.manaMultiplier);
}
</script>

<template>
    <section class="tab-panel">
        <div v-if="activeSubtab === 'condensed-upgrades'">
            <div class="section-title">
                <h1>Condensed</h1>
                <p>You have {{ condensedMana }} condensed mana.</p>
                <p v-if="isAscended">Ascended Upgrades replace the upgrade.</p>
            </div>
            <div class="condensed-upgrade-grid">
                <button
                    v-for="upgrade in upgrades"
                    :key="upgrade.index"
                    v-show="upgrade.visible"
                    type="button"
                    :class="{
                        purchased: upgrade.circleTwoAvailable ? upgrade.circleTwoPurchased : upgrade.purchased,
                        'circle-two-available': upgrade.circleTwoAvailable && !upgrade.circleTwoPurchased,
                        'circle-two-purchased': upgrade.circleTwoPurchased,
                    }"
                    :style="{ gridColumn: upgrade.slot % 5 + 1, gridRow: Math.floor(upgrade.slot / 5) + 1 }"
                    :disabled="!upgrade.affordable"
                    @click="$emit('buy', upgrade.index)"
                >
                    <span
                        v-if="upgrade.circleTwoAvailable && !upgrade.circleTwoPurchased"
                        class="condensed-upgrade-original"
                    >
                        <strong>{{ resolvePlaceholders(upgrade.title) }}</strong>
                        <small>Ascended upgrade available</small>
                    </span>
                    <span
                        v-if="upgrade.circleTwoAvailable && !upgrade.circleTwoPurchased"
                        class="condensed-upgrade-ascended-preview"
                    >
                        <strong>{{ resolvePlaceholders(upgrade.circleTwo.title) }}</strong>
                        <small>Cost: {{ upgrade.cost }} condensed mana</small>
                    </span>
                    <template v-else-if="upgrade.circleTwoPurchased">
                        <strong>{{ resolvePlaceholders(upgrade.circleTwo.title) }}</strong>
                        <small>Purchased</small>
                    </template>
                    <template v-else>
                        <strong>{{ resolvePlaceholders(upgrade.title) }}</strong>
                        <small>{{ upgrade.purchased ? "Purchased" : `Cost: ${upgrade.cost} condensed mana` }}</small>
                    </template>
                </button>
            </div>
        </div>
        <div v-else-if="activeSubtab === 'memories'">
            <div class="section-title">
                <h1>Memories</h1>
                <p>You have remembered {{ memories.remembered }} memor{{ memories.remembered != 1 ? 'ies' : 'y' }}.</p>
            </div>
            <button class="focus-button" type="button" @click="$emit('focus')">
                <strong>{{ memories.focusing ? "Exit Focus" : "Focus" }}</strong>
                <span>Performs a condense reset.</span>
                <span>{{ memories.focusing ? "Exits Focus." : "Game speed starts at ×0.1 and decreases exponentially based on Mana." }}</span>
                <span>Next condense has a {{ memories.nextChance }}% chance for a memory</span>
            </button>
            <div class="memory-milestones">
                <div
                    v-for="entry in visibleMemoryMilestones"
                    :key="entry.milestone"
                    class="memory-milestone"
                    :class="{ unlocked: entry.unlocked }"
                    :style="{ '--memory-fade': entry.fade }"
                >
                    <strong class="memory-requirement">{{ entry.milestone.toLocaleString() }}</strong>
                    <span v-if="entry.unlocked && entry.reward" class="memory-reward">{{ resolveMemoryReward(entry.reward) }}</span>
                    <span v-else class="memory-unknown" aria-label="Unknown memory milestone">?</span>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.focus-button {
    display: flex;
    width: min(100%, 440px);
    min-height: 112px;
    margin: 0 auto 28px;
    padding: 20px 24px;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    border: 1px solid #9571ce;
    border-radius: 0;
    color: #f1eaff;
    background: linear-gradient(180deg, #55367e, #302044);
    cursor: pointer;
}

.focus-button strong {
    font-size: 1.2rem;
}

.focus-button span {
    font-size: 0.75em;
}

.focus-button:disabled {
    opacity: 0.55;
    cursor: default;
}

.memory-milestones {
    display: flex;
    width: min(100%, 720px);
    margin: 0 auto;
    flex-direction: column;
    gap: 9px;
}

.memory-milestone {
    position: relative;
    display: grid;
    min-height: 72px;
    grid-template-columns: 110px 1fr 110px;
    align-items: center;
    border: 1px solid #696571;
    border-radius: 0;
    color: #aaa6b0;
    background: linear-gradient(90deg, #24222a, #302d35, #24222a);
    opacity: calc(0.62 - var(--memory-fade) * 0.18);
}

.memory-milestone.unlocked {
    border-color: #928b9d;
    opacity: 1;
}

.memory-requirement {
    padding-left: 18px;
    color: #d3ceda;
    font-size: 1.05rem;
    text-align: left;
}

.memory-unknown {
    grid-column: 2;
    color: #bab5c1;
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
}

.memory-reward {
    grid-column: 2;
    color: #ddd8e4;
    font-weight: 600;
    text-align: center;
}
</style>
