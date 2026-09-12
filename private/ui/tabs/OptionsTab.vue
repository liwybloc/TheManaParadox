<script setup>
defineProps({
    activeSubtab: { type: String, required: true },
    updateRate: { type: Number, required: true },
});
const emit = defineEmits(["stars-visible", "export-save", "import-save", "reset-game", "update-rate"]);
</script>

<template>
    <section class="tab-panel">
        <div v-if="activeSubtab === 'general'">
            <div class="section-title"><h1>General Options</h1><p>Configure saving and number display.</p></div>
            <div class="option-list">
                <label>
                    <span><strong>Update Rate</strong><small>{{ updateRate }} ms per tick</small></span>
                    <input
                        type="range"
                        min="10"
                        max="200"
                        step="1"
                        :value="updateRate"
                        @input="emit('update-rate', Number($event.currentTarget.value))"
                    />
                </label>
                <button type="button" @click="emit('export-save')">Export Save</button>
                <button type="button" @click="emit('import-save')">Import Save</button>
                <button type="button" @click="emit('reset-game')" >Reset Game </button>
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
