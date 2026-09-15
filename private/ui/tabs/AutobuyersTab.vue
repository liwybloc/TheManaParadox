<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
    autocasters: { type: Object, required: true },
    coins: { type: String, required: true },
});

const emit = defineEmits(["hire", "assign", "move", "sell"]);
const rosterGrid = ref(null);
const selectedCasterId = ref(null);
const dragging = ref(null);
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

onBeforeUnmount(() => {
    window.removeEventListener("pointermove", trackPress);
    window.removeEventListener("pointerup", finishPress);
});
</script>

<template>
    <section class="autobuyers-tab">
        <div class="section-title"><h1>Guild Auto-Casters</h1><p>You have {{ coins }} {{ coinLabel(coins) }}.</p></div>
        <div class="autocaster-hiring">
            <button v-for="option in autocasters.hireOptions" :key="option.tier" type="button" :disabled="!option.affordable" @click="$emit('hire', option.tier)">
                Hire Tier {{ option.tier }}<small>{{ option.hireCost }} {{ coinLabel(option.hireCost) }} · {{ option.wage }} {{ coinLabel(option.wage) }} / 10 min</small>
            </button>
        </div>
        <p class="autocaster-explanation">Wages are only collected after an auto-caster performs work.</p>
        <div class="autocaster-assignment-row">
            <article v-for="task in autocasters.tasks" :key="task.id" class="autocaster-task-slot" :class="{ occupied: task.caster }" :data-autocaster-task="task.id">
                <button class="autocaster-help" type="button" :data-tooltip="taskTooltip(task)" :aria-label="taskTooltip(task)">?</button>
                <strong>{{ task.action }}</strong><small>Tier {{ task.minimumTier }}+ · {{ task.cooldown }}s</small>
                <div v-if="task.caster" class="assigned-caster" :style="{ visibility: dragging?.caster.id === task.caster.id ? 'hidden' : 'visible' }" @pointerdown="beginPress($event, task.caster)">
                    <span>{{ task.caster.name }}</span><small>Tier {{ task.caster.tier }}</small><small class="autocaster-timer">{{ task.caster.status }}</small>
                </div>
                <span v-else class="assignment-empty">Drop here</span>
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
