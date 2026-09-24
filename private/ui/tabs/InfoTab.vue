<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const topics = [
    {
        id: "welcome",
        title: "How to Play",
        summary: "An overview of The Mana Paradox and this guide.",
        paragraphs: [
            "The Mana Paradox is an incremental game about producing mana, improving your infrastructure, and breaking through increasing numerical layers of progression.",
            "Use this guide whenever you need a reminder or help about a mechanic.",
        ],
    },
    {
        id: "mana",
        title: "Mana and Casting",
        summary: "Produce mana and spend it on more producers.",
        paragraphs: [
            "Mana Absorbers produce mana. Each following producer creates the producer before it, building a production chain.",
            "Casting buys producers with mana. Cast Max buys as many as possible, while empowering a producer provides a stronger permanent multiplier for the current Condense.",
            "Whenever you cast or boost a producer, it gains a ×2 multiplier.",
            "Whenever you buy the tier below a producer, it changes from \"Cast\" to \"Boost\", and it will block your progress on challenge achievement 9.",
        ],
    },
    {
        id: "meditation",
        title: "Meditation",
        summary: "Temporarily accelerate your production.",
        paragraphs: [
            "Meditation spends mana to give multipliers to your producers for a limited duration. Meditating again while it is active extends its duration and increases its magnitude.",
            "Crystal Matrices, Sealed Meridians, achievements, and Condensed upgrades can improve Meditation or change its starting cost.",
        ],
    },
    {
        id: "meridians",
        title: "Meridians and Matrices",
        summary: "Reset producers for stronger magical structures.",
        paragraphs: [
            "Sealing Meridians resets your producer chain in exchange for Sealed Meridians, which strengthen Meditation.",
            "Conjuring a Crystal Matrix performs a larger reset. Matrices increase Meditation power (it starts at ×2 per level, and goes up to ×2.5 per level) and unlock further progression opportunities.",
        ],
    },
    {
        id: "courage",
        title: "Courage",
        summary: "A burst of game speed.",
        paragraphs: [
            "Courage becomes available after reaching its mana requirement of 1.00e290. Activating it grants a large game-speed multiplier for a short duration, followed by a cooldown.",
            "Later upgrades can unlock Courage earlier, extend its duration, and increase its strength.",
        ],
    },
    {
        id: "condensing",
        title: "Condensing",
        summary: "Reset your run to gain Condensed Mana.",
        paragraphs: [
            "Condensing resets much of the current run and awards Condensed Mana based on your progress. Spend it on upgrades that make future runs faster and unlock new systems.",
            "Your highest mana reached is recorded independently, so permanent progression and Guild quests can use your best result even after a reset.",
        ],
    },
    {
        id: "guild",
        title: "The Guild",
        summary: "Take quests, earn coins, and equip useful items.",
        paragraphs: [
            "Joining the Guild opens quests, ranks, an inventory, equipment, and a rotating shop. Completing quests grants experience and item rewards.",
            "Guild coins pay for shop purchases and auto-casters. Equipment bonuses apply while the corresponding items are equipped.",
        ],
    },
    {
        id: "crystals",
        title: "Crystals",
        summary: "Complete challenge runs with special restrictions.",
        paragraphs: [
            "Crystals alter the rules of a run and set a mana goal. Reach the goal and shatter the Crystal to earn its permanent reward.",
            "You can escape an unfinished Crystal, but doing so abandons that attempt and its progress.",
        ],
    },
    {
        id: "quests",
        title: "Guild Quests",
        summary: "Fight monsters with mana-powered combat spells.",
        paragraphs: [
            "Starting a quest snapshots your highest mana reached into a separate quest mana pool. Combat spells deplete that pool without changing the mana in your normal run.",
            "Defeat the enemy before your Mana Shield is depleted. Higher-ranked quests are harder but provide more Guild experience and stronger rewards.",
            "Equipment is dropped from E tier enemies and above.",
        ],
    },
    {
        id: "autocasters",
        title: "Auto-casters",
        summary: "Hire casters to automate repetitive actions.",
        paragraphs: [
            "Hire an auto-caster with Guild coins, then drag it onto a task. A caster only takes it's wage after performing work.",
            "Higher tiers can perform more advanced tasks. Tier 3 auto-casters also perform their assigned actions with faster cooldowns.",
        ],
    },
    {
        id: "saving",
        title: "Saving and Offline Progress",
        summary: "Control saves, simulation, and update speed.",
        paragraphs: [
            "The game saves automatically, and saves can also be exported or imported from the Options tab.",
            "Offline Progress is enabled by default. Disabling it prevents the game from simulating time that passed while the game was closed or suspended.",
        ],
    },
];

const query = ref("");
const selectedId = ref(topics[0].id);
const filteredTopics = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase();
    if (!normalizedQuery) return topics;
    return topics.filter((topic) => `${topic.title} ${topic.summary} ${topic.paragraphs.join(" ")}`.toLowerCase().includes(normalizedQuery));
});
const selectedTopic = computed(() => topics.find((topic) => topic.id === selectedId.value) ?? topics[0]);

function selectTopic(topic) {
    selectedId.value = topic.id;
}

function closeOnEscape(event) {
    if (event.key === "Escape") emit("close");
}

const emit = defineEmits(["close"]);
onMounted(() => window.addEventListener("keydown", closeOnEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));
</script>

<template>
    <div class="info-overlay" role="presentation" @click.self="emit('close')">
        <section class="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title">
            <header class="info-header">
                <h1 id="info-title">How to Play</h1>
                <button type="button" aria-label="Close how to play" @click="emit('close')">×</button>
            </header>
            <div class="info-layout">
                <nav class="info-navigation" aria-label="How to play topics">
                    <input v-model="query" type="search" placeholder="Search topics…" aria-label="Search how to play topics">
                    <button
                        v-for="topic in filteredTopics"
                        :key="topic.id"
                        type="button"
                        :class="{ selected: topic.id === selectedTopic.id }"
                        @click="selectTopic(topic)"
                    >
                        {{ topic.title }}
                    </button>
                    <p v-if="filteredTopics.length === 0">No matching topics.</p>
                </nav>
                <article class="info-article">
                    <h2>{{ selectedTopic.title }}</h2>
                    <p class="info-summary">{{ selectedTopic.summary }}</p>
                    <p v-for="paragraph in selectedTopic.paragraphs" :key="paragraph">{{ paragraph }}</p>
                </article>
            </div>
        </section>
    </div>
</template>

<style scoped>
.info-overlay {
    position: fixed;
    inset: 0;
    z-index: 1150;
    padding: 10px;
    background: rgb(5 5 10 / 90%);
}

.info-dialog {
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid #694a91;
    background: #09090f;
    box-shadow: inset 0 0 40px rgb(126 72 181 / 8%);
}

.info-header {
    position: relative;
    display: grid;
    min-height: 58px;
    place-items: center;
    border-bottom: 1px solid #33283f;
}

.info-header h1 {
    margin: 0;
    color: #eee8f5;
    font-size: 24px;
    font-weight: 500;
    letter-spacing: 2px;
}

.info-header button {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 34px;
    height: 34px;
    border: 1px solid #725095;
    color: #d8c4ed;
    background: #17101f;
    cursor: pointer;
    font-size: 25px;
    line-height: 1;
}

.info-header button:hover,
.info-header button:focus-visible {
    border-color: #bd8df0;
    color: #fff;
    background: #2a1939;
}

.info-layout {
    display: grid;
    min-height: 0;
    grid-template-columns: 220px minmax(0, 1fr);
}

.info-navigation {
    display: flex;
    min-height: 0;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
    padding: 12px;
    border-right: 1px solid #33283f;
    background: #0d0c13;
}

.info-navigation input {
    width: 100%;
    margin-bottom: 8px;
    padding: 8px 9px;
    border: 1px solid #51425f;
    color: #eee;
    background: #08080d;
}

.info-navigation button {
    padding: 8px 10px;
    border: 0;
    border-left: 2px solid transparent;
    color: #aaa3b3;
    background: transparent;
    cursor: pointer;
    text-align: left;
}

.info-navigation button:hover,
.info-navigation button:focus-visible {
    color: #fff;
    background: #1d1725;
}

.info-navigation button.selected {
    border-left-color: #b881ec;
    color: #e8d3ff;
    background: #251a31;
}

.info-navigation p {
    color: #88808f;
    font-size: 12px;
}

.info-article {
    min-width: 0;
    overflow-y: auto;
    padding: clamp(24px, 5vw, 64px);
    color: #c8c2cf;
    line-height: 1.65;
}

.info-article h2 {
    margin: 0 0 8px;
    color: #eee8f5;
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 500;
    text-align: center;
}

.info-article p {
    max-width: 1000px;
    margin: 20px auto;
}

.info-article .info-summary {
    margin-top: 0;
    color: #a98bc9;
    text-align: center;
}

@media (max-width: 680px) {
    .info-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(0, 1fr);
    }

    .info-navigation {
        max-height: 180px;
        border-right: 0;
        border-bottom: 1px solid #33283f;
    }

    .info-article {
        padding: 24px 18px;
    }
}
</style>
