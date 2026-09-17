<script setup>
const props = defineProps({
    activeSubtab: { type: String, required: true },
    condensedMana: { type: String, required: true },
    upgrades: { type: Array, required: true },
    placeholders: { type: Object, required: true },
    isAscended: { type: Boolean, required: true },
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
            <p v-if="isAscended">Ascended Upgrades replace the upgrade.</p>
        </div>
        <div v-if="activeSubtab === 'condensed-upgrades'" class="condensed-upgrade-grid">
            <button
                v-for="upgrade in upgrades"
                :key="upgrade.index"
                v-show="upgrade.visible"
                type="button"
                :class="{
                    purchased: upgrade.circleTwoAvailable ? upgrade.circleTwoPurchased : upgrade.purchased,
                    'circle-two-available': upgrade.circleTwoAvailable && !upgrade.circleTwoPurchased,
                    'circle-two-purchased': upgrade.circleTwoPurchased,
                }"
                :style="{ gridColumn: upgrade.slot % 5 + 1, gridRow: Math.floor(upgrade.slot / 5) + 1 }"
                :disabled="!upgrade.affordable"
                @click="$emit('buy', upgrade.index)"
            >
                <span
                    v-if="upgrade.circleTwoAvailable && !upgrade.circleTwoPurchased"
                    class="condensed-upgrade-original"
                >
                    <strong>{{ resolvePlaceholders(upgrade.title) }}</strong>
                    <small>Ascended upgrade available</small>
                </span>
                <span
                    v-if="upgrade.circleTwoAvailable && !upgrade.circleTwoPurchased"
                    class="condensed-upgrade-ascended-preview"
                >
                    <strong>{{ resolvePlaceholders(upgrade.circleTwo.title) }}</strong>
                    <small>Cost: {{ upgrade.cost }} condensed mana</small>
                </span>
                <template v-else-if="upgrade.circleTwoPurchased">
                    <strong>{{ resolvePlaceholders(upgrade.circleTwo.title) }}</strong>
                    <small>Purchased</small>
                </template>
                <template v-else>
                    <strong>{{ resolvePlaceholders(upgrade.title) }}</strong>
                    <small>{{ upgrade.purchased ? "Purchased" : `Cost: ${upgrade.cost} condensed mana` }}</small>
                </template>
            </button>
        </div>
    </section>
</template>
