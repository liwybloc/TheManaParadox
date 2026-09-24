<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { topics } from "./infoTopics.js";

const props = defineProps({
    initialTopicId: { type: String, default: "welcome" },
});
const query = ref("");
const selectedId = ref(topics.some((topic) => topic.id === props.initialTopicId) ? props.initialTopicId : topics[0].id);
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
