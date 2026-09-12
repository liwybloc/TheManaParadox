<script setup>
import { onBeforeUnmount, ref } from "vue";
import { displayKey, getKeybinds, KEYBIND_DEFINITIONS, resetKeybinds, setKeybind, subscribeToKeybinds } from "@game/keybinds.js";

defineEmits(["close"]);

const bindings = ref(getKeybinds());
const listeningFor = ref("");
const unsubscribe = subscribeToKeybinds(() => { bindings.value = getKeybinds(); });

function beginListening(id) {
    listeningFor.value = id;
    window.addEventListener("keydown", captureKey, true);
}

function captureKey(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key !== "Escape") setKeybind(listeningFor.value, event.key);
    stopListening();
}

function stopListening() {
    listeningFor.value = "";
    window.removeEventListener("keydown", captureKey, true);
}

onBeforeUnmount(() => {
    stopListening();
    unsubscribe();
});
</script>

<template>
    <div class="keybind-overlay" role="presentation" @click.self="$emit('close')">
        <section class="keybind-dialog" role="dialog" aria-modal="true" aria-labelledby="keybind-title">
            <header>
                <div><h2 id="keybind-title">Keybinds</h2><p>Click a key to change it. Conflicting keys are swapped.</p></div>
                <button class="keybind-close" type="button" aria-label="Close keybind menu" @click="$emit('close')">×</button>
            </header>
            <div class="keybind-list">
                <div v-for="binding in KEYBIND_DEFINITIONS" :key="binding.id" class="keybind-row">
                    <span>{{ binding.label }}</span>
                    <button type="button" :class="{ listening: listeningFor === binding.id }" @click="beginListening(binding.id)">
                        {{ listeningFor === binding.id ? "Press a key…" : displayKey(bindings[binding.id]) }}
                    </button>
                </div>
            </div>
            <footer><button type="button" @click="resetKeybinds">Reset Defaults</button></footer>
        </section>
    </div>
</template>
