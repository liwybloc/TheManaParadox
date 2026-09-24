<script setup>
import { computed } from 'vue';

defineEmits(["info"]);

const props = defineProps({
    activeSubtab: {
        type: String,
        required: true
    },

    manaCircle: {
        type: Number,
        required: true
    }
});

const circleClass = computed(() => {
    return `mana-${props.manaCircle}`;
});
const manaMax = computed(() => {
    switch(props.manaCircle) {
        case 0: return "1.79e308";
        case 1: return "e9.00e15";
        default: return "I forgor";
    }
})
</script>

<template>
  <section class="tab-panel">
    <div
      v-if="activeSubtab === 'current-mana-circle'"
      class="section-title"
    >
      <h1>Current Mana Circle <button class="info-button" type="button" aria-label="Open Mana Circle information" @click="$emit('info')">ⓘ</button></h1>
      <p>Mana Maximum: {{ manaMax }}</p>

      <div class="mana-stage">
        <div
          class="mana-circle"
          :class="circleClass"
        >
          <div class="outer-glow"></div>

          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>

          <div class="runes">
            <span
              v-for="i in 12"
              :key="i"
              :style="{ '--i': i }"
            >
              ✦
            </span>
          </div>

          <div class="energy-orbit orbit-1"></div>
          <div class="energy-orbit orbit-2"></div>

          <div class="mana-core">
            <div class="core-inner"></div>
          </div>

          <div class="mana-number">
            {{ manaCircle + 1 }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
