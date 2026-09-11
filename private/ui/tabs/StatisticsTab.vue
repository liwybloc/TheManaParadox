<script setup>
defineProps({ statistics: { type: Object, required: true } });
</script>

<template>
    <section class="tab-panel statistics-list">
        <p>Total time played: <strong>{{ statistics.timePlayed }}</strong></p>
        <p>Total mana produced: <strong>{{ statistics.manaProduced }}</strong></p>
    </section>
</template>
