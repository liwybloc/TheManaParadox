<script setup>
defineProps({ activeSubtab: { type: String, required: true } });
const emit = defineEmits(["stars-visible", "export-save", "import-save"]);
</script>

<template>
    <section class="tab-panel">
        <div v-if="activeSubtab === 'general'">
            <div class="section-title"><h1>General Options</h1><p>Configure saving and number display.</p></div>
            <div class="option-list">
                <button type="button" @click="emit('export-save')">Export Save</button>
                <button type="button" @click="emit('import-save')">Import Save</button>
            </div>
        </div>
        <div v-else-if="activeSubtab === 'visuals'">
            <div class="section-title"><h1>Visual Options</h1><p>Configure decorative elements.</p></div>
            <div class="option-list">
                <label><span><strong>Show star background</strong><small>Display static background stars.</small></span><input type="checkbox" checked @change="emit('stars-visible', $event.currentTarget.checked)" /></label>
            </div>
        </div>
    </section>
</template>
