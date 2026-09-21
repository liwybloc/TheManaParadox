<script setup>
defineProps({ combat: { type: Object, required: true } });
defineEmits(["cast", "abandon"]);
</script>

<template>
    <section class="tab-panel combat-panel">
        <div class="combatant wolfines">
            <div><strong>{{ combat.monster }}</strong><span>Rank {{ combat.rank }}</span></div>
            <div class="combat-health"><span :style="{ width: `${combat.enemyPercent * 100}%` }"></span></div>
            <small>{{ combat.enemyHealth }} / {{ combat.enemyMaximumHealth }} HP</small>
        </div>
        <div class="combat-field"><span>⚔️</span><span>👹</span></div>
        <div class="combatant player-shield">
            <div><strong>Mana Shield</strong><span v-if="combat.freezeTurns !== '0'">{{ combat.monster }} frozen: {{ combat.freezeTurns }} turns</span></div>
            <div class="combat-health shield"><span :style="{ width: `${combat.shieldPercent * 100}%` }"></span></div>
            <small>{{ combat.shield }} shield</small>
        </div>
        <div class="combat-spells">
            <button
                v-for="spell in combat.spells"
                v-show="spell.unlocked !== false"
                :key="spell.index"
                type="button"
                :class="{ affordable: spell.affordable, unaffordable: !spell.affordable }"
                :disabled="!spell.affordable"
                @click="$emit('cast', spell.index)"
            >
                <strong>{{ spell.name }}</strong><span>{{ spell.effect }}</span><small>{{ spell.cost }} mana</small>
            </button>
        </div>
        <button class="abandon-quest" type="button" @click="$emit('abandon')">Abandon Quest</button>
    </section>
</template>
