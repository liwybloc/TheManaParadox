<script setup>
import { computed } from 'vue';

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
    return 'mana' + props.manaCircle;
});
</script>

<template>
  <section class="tab-panel">
    <div
      v-if="activeSubtab === 'current-mana-circle'"
      class="section-title"
    >
      <h1>Current Mana Circle</h1>

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