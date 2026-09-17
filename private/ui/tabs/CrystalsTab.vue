<script setup>
defineProps({
    activeSubtab: { type: String, required: true },
});
</script>

<template>
    <section class="tab-panel">
        <div v-if="activeSubtab === 'crystals-main'" class="section-title">
            <h1>Crystals</h1>
        </div>
    </section>
</template>
