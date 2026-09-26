<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
    autocasters: { type: Object, required: true },
    coins: { type: String, required: true },
    manaCircle: { type: Number, required: true },
});

const emit = defineEmits(["hire", "assign", "move", "sell", "casts-max", "purify-minimum", "condense-gain", "maximum-owned", "toggle"]);
const rosterGrid = ref(null);
const selectedCasterId = ref(null);
const dragging = ref(null);
const settingsTaskId = ref(null);
const purifyMinimumDraft = ref(1.01);
const condenseGainDraft = ref(1);
const maximumOwnedDraft = ref("Infinity");
let pendingPress = null;
const selectedCaster = computed(() => props.autocasters.casters.find((caster) => caster?.id === selectedCasterId.value) ?? null);

watch(selectedCaster, (caster) => {
    if (!caster) selectedCasterId.value = null;
});

function beginPress(event, caster) {
    if (event.button !== 0) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    pendingPress = { caster, bounds, startX: event.clientX, startY: event.clientY, cursorX: event.clientX, cursorY: event.clientY };
    window.addEventListener("pointermove", trackPress);
    window.addEventListener("pointerup", finishPress, { once: true });
}

function trackPress(event) {
    if (!pendingPress) return;
    event.preventDefault();
    pendingPress.cursorX = event.clientX;
    pendingPress.cursorY = event.clientY;
    if (!dragging.value && Math.hypot(event.clientX - pendingPress.startX, event.clientY - pendingPress.startY) > 25) {
        const { caster, bounds } = pendingPress;
        dragging.value = { caster, cursorX: event.clientX, cursorY: event.clientY, width: bounds.width, height: bounds.height };
    }
    if (dragging.value) {
        dragging.value.cursorX = event.clientX;
        dragging.value.cursorY = event.clientY;
    }
}

function finishPress(event) {
    window.removeEventListener("pointermove", trackPress);
    if (!pendingPress) return;
    if (dragging.value) finishDrag(event.clientX, event.clientY);
    else selectedCasterId.value = pendingPress.caster.id;
    pendingPress = null;
}

function finishDrag(clientX, clientY) {
    const caster = dragging.value?.caster;
    const target = document.elementFromPoint(clientX, clientY);
    const taskElement = target?.closest?.("[data-autocaster-task]");
    const rosterElement = target?.closest?.("[data-autocaster-position]");
    if (caster && taskElement) emit("assign", caster.id, Number(taskElement.dataset.autocasterTask));
    else if (caster && rosterElement) {
        if (caster.assignment >= 0) emit("assign", caster.id, -1);
        const position = Number(rosterElement.dataset.autocasterPosition);
        queueMicrotask(() => emit("move", caster.id, position));
    }
    dragging.value = null;
}

function casterAt(position) {
    return props.autocasters.casters.find((caster) => caster?.assignment < 0 && caster.position === position) ?? null;
}

function taskTooltip(task) {
    const effects = task.effects.map((effect, index) => effect ? `Tier ${index + 1}: ${effect}` : `Tier ${index + 1}: Cannot perform this task`).join("\n");
    return `Minimum required: Tier ${task.minimumTier}\n${effects}`;
}

function coinLabel(value) {
    return Number(value) === 1 ? "coin" : "coins";
}

function draggedCasterStyle() {
    if (!dragging.value) return {};
    return {
        position: "fixed",
        left: `${dragging.value.cursorX}px`,
        top: `${dragging.value.cursorY}px`,
        width: `${dragging.value.width}px`,
        height: `${dragging.value.height}px`,
        transform: "translate(-50%, -50%)",
        zIndex: 200,
        pointerEvents: "none",
    };
}

function sellSelected() {
    if (!selectedCaster.value) return;
    emit("sell", selectedCaster.value.id);
    selectedCasterId.value = null;
}

function toggleSettings(task) {
    if (task.id === 6) purifyMinimumDraft.value = task.purifyMinimum;
    if (task.id === 5) condenseGainDraft.value = task.condenseGain;
    if (task.id === 7 || task.id === 8) maximumOwnedDraft.value = task.maximumOwned;
    settingsTaskId.value = settingsTaskId.value === task.id ? null : task.id;
}

function commitCondenseGain() {
    emit("condense-gain", condenseGainDraft.value);
}

function updateCondenseGain(event) {
    condenseGainDraft.value = event.target.value;
    commitCondenseGain();
}

function updatePurifyMinimum(event) {
    purifyMinimumDraft.value = event.target.value;
    commitPurifyMinimum();
}

function commitPurifyMinimum() {
    emit("purify-minimum", purifyMinimumDraft.value);
}

function updateMaximumOwned(event) {
    maximumOwnedDraft.value = event.target.value;
    emit("maximum-owned", settingsTaskId.value, maximumOwnedDraft.value);
}

onBeforeUnmount(() => {
    window.removeEventListener("pointermove", trackPress);
    window.removeEventListener("pointerup", finishPress);
});
</script>

<template>
    <section class="autocasters-tab">
        <div class="section-title">
            <h1>Guild Autocasters</h1>
            <p>You have {{ coins }} {{ coinLabel(coins) }}.</p>
            <p>You can equip multiple autocasters to the same spell to make it faster.</p>
        </div>
        <button type="button" @click="$emit('toggle')">
            {{ autocasters.enabled ? "Pause Autocasters" : "Resume Autocasters" }}
        </button>
        <div class="autocaster-hiring">
            <button v-for="option in autocasters.hireOptions" :key="option.tier" type="button" :disabled="!option.affordable" @click="$emit('hire', option.tier)">
                Hire Tier {{ option.tier }}<small>{{ option.hireCost }} {{ coinLabel(option.hireCost) }} · {{ option.wage }} {{ coinLabel(option.wage) }} / 10 min</small>
            </button>
        </div>
        <p class="autocaster-explanation">Wages are only collected after an auto-caster performs work.</p>
        <div class="autocaster-assignment-row">
            <article v-for="task in autocasters.tasks" :key="task.id" class="autocaster-task-slot" :class="{ occupied: task.casters.length > 0 }" :data-autocaster-task="task.id">
                <button class="autocaster-settings-button" type="button" aria-label="Auto-caster settings" @click="toggleSettings(task)">⚙︎</button>
                <button class="autocaster-help" type="button" :data-tooltip="taskTooltip(task)" :aria-label="taskTooltip(task)">?</button>
                <strong>{{ task.action }}</strong><small>Tier {{ task.minimumTier }}+ · {{ task.effectiveCooldown.toFixed(3) }}s</small>
                <div v-if="task.casters.length" class="assigned-caster-list">
                    <div
                        v-for="caster in task.casters"
                        :key="caster.id"
                        class="assigned-caster"
                        :style="{ visibility: dragging?.caster.id === caster.id ? 'hidden' : 'visible' }"
                        @pointerdown="beginPress($event, caster)"
                    >
                        <span>{{ caster.name }}</span><small>Tier {{ caster.tier }}</small><small class="autocaster-timer">{{ caster.status }}</small>
                    </div>
                </div>
                <span v-else class="assignment-empty">Drop here</span>
                <section v-if="settingsTaskId === task.id" class="autocaster-settings-panel">
                    <strong>{{ task.action }} Settings</strong>
                    <label v-if="task.id < 5" class="autocaster-toggle-setting">
                        <input type="checkbox" :checked="task.castsMax" @change="$emit('casts-max', task.id, $event.target.checked)">
                        Cast max
                    </label>
                    <label v-else-if="task.id === 5 && manaCircle > 0" class="autocaster-slider-setting">
                        <span>Condense at {{ condenseGainDraft }} Condensed Mana gained</span>
                        <input :value="condenseGainDraft" type="text" inputmode="decimal" @input="updateCondenseGain">
                    </label>
                    <label v-else-if="task.id === 6" class="autocaster-slider-setting">
                        <span>Minimum Relative Multiplier: ×{{ purifyMinimumDraft }}</span>
                        <input
                            type="text"
                            inputmode="decimal"
                            :value="purifyMinimumDraft"
                            @input="updatePurifyMinimum"
                        >
                    </label>
                    <label v-else-if="task.id === 7 || task.id === 8" class="autocaster-slider-setting">
                        <span>Maximum owned: {{ maximumOwnedDraft }}</span>
                        <input :value="maximumOwnedDraft" type="text" inputmode="decimal" @input="updateMaximumOwned">
                    </label>
                    <span v-else>No settings available yet.</span>
                </section>
            </article>
        </div>
        <div class="autocaster-lower-layout">
            <section><h2>Unassigned Casters</h2>
                <div ref="rosterGrid" class="autocaster-roster">
                    <div v-for="position in 9" :key="position" class="autocaster-roster-slot" :data-autocaster-position="position - 1">
                        <article v-if="casterAt(position - 1)" :style="{ visibility: dragging?.caster.id === casterAt(position - 1).id ? 'hidden' : 'visible' }" @pointerdown="beginPress($event, casterAt(position - 1))">
                            <strong>{{ casterAt(position - 1).name }}</strong><span>Tier {{ casterAt(position - 1).tier }}</span><small class="autocaster-timer">{{ casterAt(position - 1).status }}</small>
                        </article>
                    </div>
                </div>
            </section>
            <aside class="autocaster-inspector">
                <template v-if="selectedCaster">
                    <strong>{{ selectedCaster.name }}</strong><span>Tier {{ selectedCaster.tier }} Auto-Caster</span><small>{{ selectedCaster.status }}</small>
                    <p>Wage: {{ selectedCaster.wage }} {{ coinLabel(selectedCaster.wage) }} every active 10 minutes.</p>
                    <button v-if="selectedCaster.assignment >= 0" type="button" @click="$emit('assign', selectedCaster.id, -1)">Unassign</button>
                    <button class="autocaster-sell" type="button" @click="sellSelected">Sell for {{ selectedCaster.sellPrice }} {{ coinLabel(selectedCaster.sellPrice) }}</button>
                </template>
                <span v-else>Select an auto-caster to view them.</span>
            </aside>
        </div>
        <Teleport to="body">
            <article v-if="dragging" class="autocaster-drag-preview" :style="draggedCasterStyle()">
                <strong>{{ dragging.caster.name }}</strong><span>Tier {{ dragging.caster.tier }}</span>
            </article>
        </Teleport>
    </section>
</template>
