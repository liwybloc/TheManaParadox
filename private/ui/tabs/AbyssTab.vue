<script setup>

import { ref, onMounted, onBeforeUnmount, defineProps, watch, nextTick } from 'vue';

const props = defineProps({
    activeSubtab: { type: String, required: true },
});

const source = document.getElementById('abyss-vortex');
const target = ref(null);
let updateTarget;

watch(() => props.activeSubtab, async () => {
    await nextTick();
    if (updateTarget) updateTarget();
});

onMounted(() => {
  updateTarget = () => {
    if (!source || !target.value) return;
    const rect = source.getBoundingClientRect();
        const size = Math.min(window.innerWidth, window.innerHeight) * 0.6528;
        const centerY = Math.min(window.innerHeight * 0.58, 520);
        target.value.style.left = `${rect.left + (rect.width - size) / 2}px`;
        target.value.style.top = `${rect.top + centerY - size / 2}px`;
        target.value.style.width = `${size}px`;
        target.value.style.height = `${size}px`;
    };
    updateTarget();
    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget);
});
onBeforeUnmount(() => {
    if (!updateTarget) return;
    window.removeEventListener('scroll', updateTarget);
    window.removeEventListener('resize', updateTarget);
});

function completeBeta() {
    alert("You have completed the beta for now! Congrats! :)");
}

</script>

<template>
    <section class="abyss-tab">
        <div class="section-title">
            <section v-if="activeSubtab === 'depths'">
                <h1>The Abyss</h1>
                <p>Click the vortex to delve into the abyss...</p>

                <button ref="target" id="enter-abyss" type="button" aria-label="Enter the Abyss" v-on:click="completeBeta"></button>
            </section>
            <section v-else>
                <h1>Abyssal Resonance</h1>
            </section>
        </div>
    </section>
</template>

<style scoped>
.abyss-tab {
    position: relative;
    min-height: 100vh;
}
.section-title {
    position: relative;
    z-index: 1;
}
#enter-abyss {
    position: fixed;
    border: 0;
    padding: 0;
    background: none;
    box-shadow: none;
    outline: none;
    appearance: none;
    cursor: pointer;
}
#enter-abyss:focus,
#enter-abyss:focus-visible,
#enter-abyss:active {
    border: 0;
    box-shadow: none;
    outline: 0;
}
</style>
