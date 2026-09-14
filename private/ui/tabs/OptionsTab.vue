<script setup>
defineProps({
    activeSubtab: { type: String, required: true },
    updateRate: { type: Number, required: true },
    starsVisible: { type: Boolean, required: true },
    starsAnimated: { type: Boolean, required: true },
});
const emit = defineEmits(["edit-keybinds", "stars-visible", "stars-animated", "export-save", "import-save", "reset-game", "update-rate"]);
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

                <button type="button" @click="emit('edit-keybinds')">Edit Keybinds</button>
                <button type="button" @click="emit('export-save')"  >Export Save  </button>
                <button type="button" @click="emit('import-save')"  >Import Save  </button>
                <button type="button" @click="emit('reset-game')"   >Reset Game   </button>
            </div>
        </div>
        <div v-else-if="activeSubtab === 'visuals'">
            <div class="section-title"><h1>Visual Options</h1><p>Configure decorative elements.</p></div>
            <div class="option-list">
                <label><span><strong>Show star background</strong><small>Display background stars.</small></span><input type="checkbox" :checked="starsVisible" @change="emit('stars-visible', $event.currentTarget.checked)" /></label>
                <label><span><strong>Animate stars</strong><small>Allow stars to twinkle and move with mana.</small></span><input type="checkbox" :checked="starsAnimated" @change="emit('stars-animated', $event.currentTarget.checked)" /></label>
            </div>
        </div>
    </section>
</template>
