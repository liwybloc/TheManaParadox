<script setup>
defineProps({
    statistics: { type: Object, required: true },
});
</script>

<template>
    <section class="tab-panel statistics-list">
        <header class="stat-header basic-header">
            <h2>Basic</h2>
            <p>Total time played: <strong>{{ statistics.timePlayed }}</strong></p>
            <p>Total mana produced: <strong>{{ statistics.manaProduced }}</strong></p>
        </header>
        <header v-if="statistics.hasCondensed" class="stat-header condense-header">
            <h2>Condense</h2>
            <p>Total condenses: <strong>{{ statistics.condenses }}</strong></p>
            <p>Total condensed mana: <strong>{{ statistics.condensedManaProduced }}</strong></p>
            <p>Fastest condense time: <strong>{{ statistics.fastestCondense }}</strong></p>
            <p>Time spent this condense: <strong>{{ statistics.timeThisCondense }}</strong></p>
        </header>
    </section>
</template>
