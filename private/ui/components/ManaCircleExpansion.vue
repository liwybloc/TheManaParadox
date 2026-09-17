<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const emit = defineEmits(["complete"]);
const canvas = ref(null);
let animationFrame;
let startTime;

function render(time) {
    const element = canvas.value;
    if (!element) return;
    if (startTime === undefined) startTime = time;
    const elapsed = time - startTime;
    const progress = Math.min(1, elapsed / 2600);
    const scale = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (element.width !== Math.round(width * scale) || element.height !== Math.round(height * scale)) {
        element.width = Math.round(width * scale);
        element.height = Math.round(height * scale);
    }
    const context = element.getContext("2d");
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const maximumRadius = Math.hypot(width, height) * 0.72;

    const flash = Math.sin(Math.min(1, progress * 1.7) * Math.PI);
    context.fillStyle = `rgba(80, 31, 118, ${flash * 0.32})`;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "screen";
    for (let ring = 0; ring < 7; ring++) {
        const localProgress = Math.max(0, Math.min(1, progress * 1.45 - ring * 0.055));
        const radius = maximumRadius * localProgress * localProgress;
        context.lineWidth = Math.max(1, 10 - ring);
        context.strokeStyle = ring % 2 === 0
            ? `rgba(222, 174, 255, ${1 - localProgress})`
            : `rgba(255, 226, 153, ${(1 - localProgress) * 0.8})`;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.stroke();
    }
    for (let spark = 0; spark < 90; spark++) {
        const angle = spark * 2.39996 + Math.sin(spark * 19.3) * 0.2;
        const radius = maximumRadius * progress * (0.22 + (spark % 17) / 20);
        const length = 8 + progress * 55;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        context.strokeStyle = spark % 3 === 0 ? "#f7d78dcc" : "#d5a0ffbb";
        context.lineWidth = spark % 5 === 0 ? 2 : 1;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
        context.stroke();
    }
    context.globalCompositeOperation = "source-over";
    context.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - Math.abs(progress - 0.45) * 7) * 0.72})`;
    context.fillRect(0, 0, width, height);
    if (progress >= 1) {
        emit("complete");
        return;
    }
    animationFrame = requestAnimationFrame(render);
}

onMounted(() => {
    animationFrame = requestAnimationFrame(render);
});

onBeforeUnmount(() => cancelAnimationFrame(animationFrame));
</script>

<template>
    <div class="mana-circle-expansion" aria-hidden="true">
        <canvas ref="canvas"></canvas>
        <strong>YOUR MANA CIRCLE EXPANDS</strong>
    </div>
</template>
