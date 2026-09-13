<script setup>
const props = defineProps({
    activeSubtab: { type: String, required: true },
    condensedMana: { type: String, required: true },
    upgrades: { type: Array, required: true },
    placeholders: { type: Object, required: true },
});
defineEmits(["buy"]);

function resolvePlaceholders(text) {
    return text.replace(/\{([A-Za-z0-9_]+)\}/g, (token, key) => props.placeholders[key] ?? token);
}
</script>

<template>
    <section class="tab-panel">
        <div class="section-title">
            <h1>Condensed</h1>
            <p>You have {{ condensedMana }} condensed mana.</p>
        </div>
        <div v-if="activeSubtab === 'condensed-upgrades'" class="condensed-upgrade-grid">
            <button
                v-for="upgrade in upgrades"
                :key="upgrade.index"
                v-show="upgrade.visible"
                type="button"
                :class="{ purchased: upgrade.purchased }"
                :style="{ gridColumn: upgrade.slot % 5 + 1, gridRow: Math.floor(upgrade.slot / 5) + 1 }"
                :disabled="!upgrade.affordable"
                @click="$emit('buy', upgrade.index)"
            >
                <strong>{{ resolvePlaceholders(upgrade.title) }}</strong>
                <small>{{ upgrade.purchased ? "Purchased" : `Cost: ${upgrade.cost} condensed mana` }}</small>
            </button>
        </div>
    </section>
</template>
