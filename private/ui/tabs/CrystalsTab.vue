<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { CRYSTALS, CRYSTAL_GOALS } from "@game/game/crystals.js";
import { formatCompletionTime, formatCrystalGoal, formatDecimal } from "@game/ui/formatting.js";
import { namedWasm } from "@generated/_wasm$globals.js";

const props = defineProps({
    activeSubtab: { type: String, required: true },
    stateRevision: { type: Number, required: true },
});

const VISIBLE_CRYSTALS = 3;
const crystals = reactive(CRYSTALS.map((crystal, index) => ({
    ...crystal,
    goal: formatCrystalGoal(CRYSTAL_GOALS[index]),
    unlocked: namedWasm.isCrystalUnlocked(index),
    completed: namedWasm.hasCompletedCrystal(index),
    fastestShatter: namedWasm.getFastestCrystalShatter(index),
})));
const emit = defineEmits(["enter"]);
const firstVisibleCrystal = ref(0);
const finalFirstVisibleCrystal = crystals.length - VISIBLE_CRYSTALS;
const canGoBack = computed(() => firstVisibleCrystal.value > 0);
const canGoForward = computed(() => firstVisibleCrystal.value < finalFirstVisibleCrystal);
const trackStyle = computed(() => ({
    transform: `translateX(calc(-${firstVisibleCrystal.value * 100 / VISIBLE_CRYSTALS}% - ${firstVisibleCrystal.value * 16 / VISIBLE_CRYSTALS}px))`,
}));

watch(() => props.stateRevision, () => {
    crystals.forEach((crystal, index) => {
        crystal.unlocked = namedWasm.isCrystalUnlocked(index);
        crystal.completed = namedWasm.hasCompletedCrystal(index);
        crystal.fastestShatter = namedWasm.getFastestCrystalShatter(index);
    });
    showNextAvailableCrystal();
});

function showNextAvailableCrystal() {
    const nextIndex = crystals.findIndex((crystal) => crystal.unlocked && !crystal.completed);
    const fallbackIndex = crystals.findLastIndex((crystal) => crystal.unlocked);
    const targetIndex = nextIndex >= 0 ? nextIndex : Math.max(0, fallbackIndex);
    firstVisibleCrystal.value = Math.max(0, Math.min(finalFirstVisibleCrystal, targetIndex - 1));
}

onMounted(showNextAvailableCrystal);

function showPreviousCrystal() {
    if (!canGoBack.value) return;
    firstVisibleCrystal.value--;
}

function showNextCrystal() {
    if (!canGoForward.value) return;
    firstVisibleCrystal.value++;
}

function enterCrystal(crystal) {
    if (!crystal.unlocked) return;
    emit("enter", crystal.id - 1);
}

function resolveReward(crystal, reward) {
    const buff = formatDecimal(namedWasm.crystalRewardHandle(crystal.id - 1, 0));
    return reward
        .replace("{empowermentCMBuff}", buff)
        .replace("{manaAbsorberSMBuff}", buff);
}
</script>

<template>
    <section class="tab-panel">
        <div v-if="activeSubtab === 'crystals-main'" class="crystals-section">
            <header class="section-title">
                <h1>Crystals</h1>
            </header>

            <div class="crystal-carousel">
                <button
                    class="crystal-arrow"
                    type="button"
                    aria-label="Show previous crystal"
                    :disabled="!canGoBack"
                    @click="showPreviousCrystal"
                >
                    ‹
                </button>

                <div class="crystal-viewport">
                    <div class="crystal-track" :style="trackStyle">
                        <article
                            v-for="crystal in crystals"
                            :key="crystal.id"
                            class="crystal-card"
                            :class="[`crystal-variant-${crystal.variant}`, { locked: !crystal.unlocked, shattered: crystal.completed }]"
                            :aria-label="`Crystal ${crystal.id}${crystal.unlocked ? '' : ', locked'}`"
                            :tabindex="crystal.unlocked ? 0 : -1"
                            :role="crystal.unlocked ? 'button' : undefined"
                            @click="enterCrystal(crystal)"
                            @keydown.enter.prevent="enterCrystal(crystal)"
                            @keydown.space.prevent="enterCrystal(crystal)"
                        >
                            <div class="crystal-display" :style="{ '--crystal-color': crystal.color }">
                                <div class="crystal-shadow" />
                                <div class="crystal-shape">
                                    <span class="crystal-facet facet-left" />
                                    <span class="crystal-facet facet-center" />
                                    <span class="crystal-facet facet-right" />
                                    <span class="crystal-shine" />
                                    <span v-if="crystal.completed" class="crystal-shatter-mask">
                                        <span v-for="shard in 9" :key="shard" :class="`shatter-shard shard-${shard}`" />
                                    </span>
                                </div>
                                <span v-if="crystal.unlocked" class="crystal-enter-prompt">Click to Enter</span>
                            </div>
                            <div v-if="!crystal.unlocked" class="crystal-lock" aria-hidden="true">
                                <span class="lock-shackle" />
                                <span class="lock-body">◆</span>
                            </div>
                            <strong>Crystal {{ crystal.id }}</strong>
                            <span v-if="crystal.completed" class="crystal-fastest">Fastest Shatter: {{ formatCompletionTime(crystal.fastestShatter) }}</span>
                            <span v-if="!crystal.unlocked" class="crystal-status">Locked</span>
                            <div v-if="crystal.unlocked" class="crystal-tooltip" role="tooltip">
                                <strong>Goal:</strong>
                                <span>{{ crystal.goal }}</span>

                                <strong>Effects:</strong>
                                <span v-for="effect in crystal.effects" :key="effect">{{ effect }}</span>

                                <strong>Rewards:</strong>
                                <span v-for="reward in crystal.rewards" :key="reward">{{ resolveReward(crystal, reward) }}</span>
                            </div>
                        </article>
                    </div>
                </div>

                <button
                    class="crystal-arrow"
                    type="button"
                    aria-label="Show next crystal"
                    :disabled="!canGoForward"
                    @click="showNextCrystal"
                >
                    ›
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.crystals-section {
    width: min(100%, 980px);
    margin: 0 auto;
}

.crystal-carousel {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) 54px;
    align-items: center;
    gap: 16px;
    margin-top: 32px;
}

.crystal-viewport {
    min-width: 0;
    overflow: hidden;
    padding: 12px 0 22px;
}

.crystal-track {
    display: flex;
    gap: 16px;
    transition: transform 420ms cubic-bezier(0.22, 0.72, 0.25, 1);
    will-change: transform;
}

.crystal-card {
    position: relative;
    display: flex;
    flex: 0 0 calc((100% - 32px) / 3);
    box-sizing: border-box;
    min-width: 0;
    min-height: 475px;
    padding: 4px 12px 20px;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
}

.crystal-card:not(.locked) {
    cursor: pointer;
}

.crystal-card strong {
    margin-top: 12px;
    color: #eee8ff;
    font-size: 1.08rem;
}

.crystal-status {
    margin-top: 4px;
    color: #b9a8d8;
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.crystal-fastest {
    margin-top: 5px;
    color: #cfc3db;
    font-size: 0.76rem;
    text-align: center;
}

.crystal-tooltip {
    position: absolute;
    z-index: 5;
    top: 278px;
    right: 4px;
    left: 4px;
    display: flex;
    padding: 13px 14px;
    flex-direction: column;
    pointer-events: none;
    border: 1px solid rgba(196, 156, 255, 0.72);
    border-radius: 9px;
    color: #ddd4e8;
    background: rgba(18, 12, 29, 0.97);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.52);
    font-size: 0.76rem;
    line-height: 1.4;
    opacity: 0;
    transform: translateY(7px);
    transition: opacity 140ms ease, transform 140ms ease;
}

.crystal-tooltip strong {
    margin: 9px 0 3px;
    color: #f3eaff;
    font-size: 0.8rem;
}

.crystal-tooltip strong:first-child {
    margin-top: 0;
}

.crystal-card:hover .crystal-tooltip,
.crystal-card:focus-visible .crystal-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.crystal-card:focus-visible {
    outline: 1px solid #d7baff;
    outline-offset: -2px;
}

.crystal-display {
    position: relative;
    width: 150px;
    height: 210px;
    transition: filter 220ms ease, opacity 220ms ease;
}

.crystal-card.locked .crystal-display {
    filter: grayscale(1);
    opacity: 0.58;
}

.crystal-enter-prompt {
    position: absolute;
    z-index: 2;
    top: 88px;
    right: 0;
    left: 0;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-align: center;
    text-shadow: 0 2px 3px #000, 0 0 7px #000, 0 0 12px rgba(0, 0, 0, 0.9);
    text-transform: uppercase;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 140ms ease, transform 140ms ease;
}

.crystal-card:hover .crystal-enter-prompt,
.crystal-card:focus-visible .crystal-enter-prompt {
    opacity: 1;
    transform: translateY(0);
}

.crystal-shape {
    position: absolute;
    inset: 0 12px 22px;
    overflow: hidden;
    clip-path: polygon(50% 0, 91% 25%, 78% 81%, 50% 100%, 20% 82%, 7% 26%);
    background: var(--crystal-color);
    filter: drop-shadow(0 0 16px color-mix(in srgb, var(--crystal-color), transparent 30%));
    transform-origin: 50% 88%;
}

.crystal-card.shattered .crystal-shape {
    filter:
        drop-shadow(0 6px 5px rgba(0, 0, 0, 0.64))
        drop-shadow(0 0 9px color-mix(in srgb, var(--crystal-color), transparent 42%));
}

.crystal-card.shattered .crystal-shine {
    opacity: 0.25;
}

.crystal-shatter-mask {
    position: absolute;
    z-index: 4;
    inset: 0;
    background:
        linear-gradient(73deg, transparent 49.1%, rgba(4, 7, 13, 0.9) 49.5% 50.5%, transparent 50.9%),
        linear-gradient(126deg, transparent 49%, rgba(4, 7, 13, 0.82) 49.4% 50.6%, transparent 51%);
}

.shatter-shard {
    position: absolute;
    inset: 0;
    border: 1px solid rgba(4, 8, 15, 0.9);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.02) 45%, rgba(3, 20, 31, 0.3));
    box-shadow:
        inset 1px 1px 1px rgba(255, 255, 255, 0.5),
        inset -1px -1px 2px rgba(0, 0, 0, 0.52);
    filter: var(--shard-filter) drop-shadow(0 0 1.4px rgba(0, 0, 0, 0.95));
}

.shard-1 {
    clip-path: polygon(0 0, 51% 0, 42% 27%, 0 38%);
    --shard-filter: brightness(1.2) hue-rotate(-8deg);
}

.shard-2 {
    clip-path: polygon(51% 0, 100% 0, 100% 31%, 68% 38%, 42% 27%);
    --shard-filter: brightness(0.82) saturate(1.25);
}

.shard-3 {
    clip-path: polygon(0 38%, 42% 27%, 49% 52%, 18% 63%, 0 57%);
    --shard-filter: brightness(0.72) hue-rotate(10deg);
}

.shard-4 {
    clip-path: polygon(42% 27%, 68% 38%, 65% 61%, 49% 52%);
    --shard-filter: brightness(1.35) saturate(0.75);
}

.shard-5 {
    clip-path: polygon(68% 38%, 100% 31%, 100% 64%, 65% 61%);
    --shard-filter: brightness(0.88) hue-rotate(-12deg);
}

.shard-6 {
    clip-path: polygon(0 57%, 18% 63%, 39% 82%, 20% 100%, 0 100%);
    --shard-filter: brightness(1.08);
}

.shard-7 {
    clip-path: polygon(18% 63%, 49% 52%, 65% 61%, 57% 84%, 39% 82%);
    --shard-filter: brightness(0.76) saturate(1.35);
}

.shard-8 {
    clip-path: polygon(65% 61%, 100% 64%, 100% 100%, 78% 100%, 57% 84%);
    --shard-filter: brightness(1.24) hue-rotate(8deg);
}

.shard-9 {
    clip-path: polygon(39% 82%, 57% 84%, 78% 100%, 20% 100%);
    --shard-filter: brightness(0.9);
}

.crystal-variant-2 .crystal-shape {
    inset: 8px 20px 18px 8px;
    clip-path: polygon(45% 0, 88% 19%, 93% 62%, 58% 100%, 17% 86%, 4% 35%);
    transform: rotate(-3deg);
}

.crystal-variant-3 .crystal-shape {
    inset: 20px 6px 14px 22px;
    clip-path: polygon(57% 0, 96% 34%, 73% 89%, 42% 100%, 8% 72%, 18% 20%);
    transform: rotate(3deg);
}

.crystal-variant-4 .crystal-shape {
    inset: 3px 25px 24px;
    clip-path: polygon(50% 0, 82% 14%, 100% 52%, 67% 100%, 28% 92%, 0 48%, 19% 17%);
    transform: rotate(-1.5deg);
}

.crystal-variant-5 .crystal-shape {
    inset: 15px 10px 12px 17px;
    clip-path: polygon(62% 0, 94% 28%, 84% 78%, 48% 100%, 10% 76%, 3% 29%, 34% 8%);
    transform: rotate(2deg);
}

.crystal-facet,
.crystal-shine {
    position: absolute;
    inset: 0;
}

.crystal-variant-2 .crystal-shine {
    clip-path: polygon(25% 27%, 43% 10%, 48% 47%, 34% 65%);
}

.crystal-variant-3 .crystal-shine {
    clip-path: polygon(43% 19%, 61% 5%, 54% 51%, 39% 60%);
}

.crystal-variant-4 .crystal-shine {
    clip-path: polygon(22% 30%, 45% 10%, 39% 53%, 29% 69%);
}

.crystal-variant-5 .crystal-shine {
    clip-path: polygon(37% 18%, 60% 7%, 49% 48%, 36% 64%);
}

.facet-left {
    clip-path: polygon(0 25%, 50% 0, 40% 65%, 50% 100%, 20% 82%);
    background: color-mix(in srgb, var(--crystal-color), #07142e 42%);
}

.facet-center {
    clip-path: polygon(50% 0, 74% 27%, 62% 69%, 50% 100%, 40% 65%);
    background: color-mix(in srgb, var(--crystal-color), white 18%);
}

.facet-right {
    clip-path: polygon(50% 0, 100% 25%, 78% 81%, 50% 100%, 62% 69%, 74% 27%);
    background: color-mix(in srgb, var(--crystal-color), #32164e 28%);
}

.crystal-shine {
    clip-path: polygon(31% 22%, 48% 10%, 43% 49%, 34% 67%);
    background: rgba(255, 255, 255, 0.48);
}

.crystal-shadow {
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: 9px;
    height: 22px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--crystal-color), transparent 65%);
    filter: blur(9px);
}

.crystal-lock {
    position: absolute;
    top: 105px;
    left: 50%;
    width: 56px;
    height: 66px;
    transform: translateX(-50%);
    filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.65));
}

.lock-shackle {
    position: absolute;
    top: 0;
    left: 12px;
    width: 32px;
    height: 34px;
    box-sizing: border-box;
    border: 7px solid #e5e2eb;
    border-bottom: 0;
    border-radius: 18px 18px 0 0;
}

.lock-body {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    height: 42px;
    place-items: center;
    border: 2px solid #faf8ff;
    border-radius: 7px;
    color: #55505e;
    background: linear-gradient(#f4f1f7, #aaa5b0);
    font-size: 14px;
}

.crystal-arrow {
    display: grid;
    width: 54px;
    height: 82px;
    padding: 0 0 8px;
    place-items: center;
    border: 1px solid rgba(185, 150, 255, 0.58);
    border-radius: 14px;
    color: #e5d6ff;
    background: linear-gradient(180deg, rgba(91, 59, 139, 0.82), rgba(42, 27, 70, 0.9));
    box-shadow: 0 0 18px rgba(141, 91, 230, 0.15);
    font: 400 3rem/1 Georgia, serif;
    cursor: pointer;
    transition: transform 150ms ease, border-color 150ms ease, opacity 150ms ease;
}

.crystal-arrow:not(:disabled):hover {
    transform: scale(1.05);
    border-color: #d7baff;
}

.crystal-arrow:disabled {
    opacity: 0.25;
    cursor: default;
}

@media (max-width: 720px) {
    .crystal-carousel {
        grid-template-columns: 40px minmax(0, 1fr) 40px;
        gap: 8px;
    }

    .crystal-arrow {
        width: 40px;
    }

    .crystal-card {
        min-height: 410px;
        padding-inline: 4px;
    }

    .crystal-display {
        width: min(105px, 100%);
        height: 170px;
    }

    .crystal-enter-prompt {
        top: 70px;
        font-size: 0.68rem;
    }

    .crystal-lock {
        top: 86px;
    }

    .crystal-tooltip {
        top: 228px;
    }

    .crystal-card strong {
        font-size: 0.86rem;
    }
}
</style>
