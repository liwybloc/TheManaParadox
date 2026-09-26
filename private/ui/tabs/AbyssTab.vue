<script setup>
defineProps({
    activeSubtab: { type: String, required: true },
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

            </section>
            <section v-else>
                <h1>Abyssal Resonance</h1>
            </section>
        </div>
        <template v-if="activeSubtab === 'depths'">
            <video id="abyss-vortex" :src="'./assets/videos/abyss-vortex.webm'" loop muted playsinline preload="metadata" aria-hidden="true" hidden></video>
            <button id="enter-abyss" type="button" aria-label="Enter the Abyss" v-on:click="completeBeta"></button>
        </template>
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
    position: absolute;
    z-index: 1;
    top: 90px;
    left: 50%;
    width: min(65.28vw, 65.28vh, calc(100% - 24px));
    height: min(65.28vw, 65.28vh, calc(100% - 24px));
    border: 0;
    padding: 0;
    background: none;
    box-shadow: none;
    outline: none;
    appearance: none;
    cursor: pointer;
    transform: translateX(-50%);
}
#abyss-vortex {
    position: absolute;
    z-index: 0;
    top: 90px;
    left: 50%;
    width: min(65.28vw, 65.28vh, calc(100% - 24px));
    height: min(65.28vw, 65.28vh, calc(100% - 24px));
    pointer-events: none;
    opacity: 0.96;
    transform: translateX(-50%);
}
#enter-abyss:focus,
#enter-abyss:focus-visible,
#enter-abyss:active {
    border: 0;
    box-shadow: none;
    outline: 0;
}
</style>
