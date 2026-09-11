<script setup>
defineProps({ mana: { type: String, required: true } });
</script>

<template>
    <header class="game-header">
        <div class="title-block"><strong>The Mana Paradox</strong></div>
        <div class="resource-display">
            <span>You have</span>
            <strong>{{ mana }}</strong>
            <span>mana</span>
        </div>
    </header>
</template>
