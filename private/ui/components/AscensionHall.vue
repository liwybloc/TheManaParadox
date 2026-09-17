<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const emit = defineEmits(["ascend"]);
const canvas = ref(null);
const walking = ref(false);
let context;
let animationFrame;
let resizeObserver;
let previousTime = 0;
let distance = 0;
let crossedGate = false;
const keyDownListener = (event) => handleKey(event, true);
const keyUpListener = (event) => handleKey(event, false);
const blurListener = () => setWalking(false);

const SEGMENT_LENGTH = 240;
const SEGMENT_COUNT = 30;
const WALK_SPEED = 260;
const FLOOR_LEVEL = 230;
const DEPTH_CURVE = 2;
const GATE_DISTANCE = 7600;
const GATE_CROSSING_DISTANCE = GATE_DISTANCE - 42;

function setWalking(value) {
    walking.value = value;
}

function handleKey(event, value) {
    if (event.code !== "KeyW" && event.code !== "ArrowUp") return;
    event.preventDefault();
    setWalking(value);
}

function resizeCanvas() {
    const element = canvas.value;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    element.width = Math.max(1, Math.round(bounds.width * scale));
    element.height = Math.max(1, Math.round(bounds.height * scale));
    context = element.getContext("2d");
    context.setTransform(scale, 0, 0, scale, 0, 0);
}

function project(x, y, depth, centerX, centerY, focalLength) {
    const linearDepth = Math.max(45, depth);
    const curvedDepth = 45 + Math.pow(linearDepth - 45, DEPTH_CURVE) / Math.pow(SEGMENT_LENGTH, DEPTH_CURVE - 1);
    const scale = focalLength / curvedDepth;
    return { x: centerX + x * scale, y: centerY + y * scale };
}

function polygon(points, fill, stroke = null) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index++) context.lineTo(points[index].x, points[index].y);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
        context.strokeStyle = stroke;
        context.stroke();
    }
}

function drawPainting(side, nearDepth, centerX, centerY, focalLength, seed, time) {
    const wallX = side * 390;
    const innerX = side * 384;
    const top = -115;
    const bottom = 70;
    const farDepth = nearDepth + 125;
    const corners = [
        project(wallX, top, nearDepth, centerX, centerY, focalLength),
        project(innerX, top, farDepth, centerX, centerY, focalLength),
        project(innerX, bottom, farDepth, centerX, centerY, focalLength),
        project(wallX, bottom, nearDepth, centerX, centerY, focalLength),
    ];
    context.lineWidth = 4;
    polygon(corners, "#08070b", "#c99a36");
    context.lineWidth = 1;
    context.save();
    context.beginPath();
    context.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.closePath();
    context.clip();

    const minX = Math.min(...corners.map((point) => point.x));
    const maxX = Math.max(...corners.map((point) => point.x));
    const minY = Math.min(...corners.map((point) => point.y));
    const maxY = Math.max(...corners.map((point) => point.y));
    const phase = Math.floor(time / 55) + seed * 97;
    for (let index = 0; index < 42; index++) {
        const noise = Math.sin((phase + index * 31) * 12.9898) * 43758.5453;
        const noise2 = Math.sin((phase + index * 71) * 7.233) * 12839.193;
        const x = minX + (noise - Math.floor(noise)) * (maxX - minX);
        const y = minY + (noise2 - Math.floor(noise2)) * (maxY - minY);
        context.fillStyle = index % 4 === 0 ? "#ac8fc4aa" : index % 3 === 0 ? "#ddd8e666" : "#49415199";
        context.fillRect(x, y, Math.max(1, (maxX - minX) / 18), Math.max(1, (maxY - minY) / 55));
    }
    context.fillStyle = "#ffffff0c";
    for (let y = minY; y < maxY; y += 4) context.fillRect(minX, y, maxX - minX, 1);
    context.restore();
}

function drawEndWall(depth, centerX, centerY, focalLength, width, height) {
    const leftBottom = project(-400, FLOOR_LEVEL, depth, centerX, centerY, focalLength);
    const rightBottom = project(400, FLOOR_LEVEL, depth, centerX, centerY, focalLength);
    const left = project(-400, -500, depth, centerX, centerY, focalLength);
    const right = project(400, -500, depth, centerX, centerY, focalLength);
    left.y = -height;
    right.y = -height;
    const wall = context.createLinearGradient(leftBottom.x, 0, rightBottom.x, 0);
    wall.addColorStop(0, "#382318");
    wall.addColorStop(0.5, "#69452f");
    wall.addColorStop(1, "#382318");
    polygon([left, right, rightBottom, leftBottom], wall, "#94704b");

    const gateCenter = project(0, -35, depth, centerX, centerY, focalLength);
    const glow = context.createRadialGradient(gateCenter.x, gateCenter.y, 0, gateCenter.x, gateCenter.y, Math.max(10, width * 0.22));
    glow.addColorStop(0, "#ad7bca20");
    glow.addColorStop(1, "#0000");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
}

function drawExpansionGate(depth, centerX, centerY, focalLength, time) {
    const gateCenter = project(0, -35, depth, centerX, centerY, focalLength);
    const gateEdge = project(78, -35, depth, centerX, centerY, focalLength);
    const gateBottom = project(0, 76, depth, centerX, centerY, focalLength);
    const gateHeight = Math.abs(gateBottom.y - gateCenter.y);
    const pulse = (Math.sin(time / 700) + 1) / 2;
    const radius = Math.max(2, Math.abs(gateEdge.x - gateCenter.x));
    const gateX = gateCenter.x;
    const gateY = gateCenter.y;
    context.save();
    context.globalCompositeOperation = "screen";

    const glow = context.createRadialGradient(gateX, gateY, 0, gateX, gateY, radius * 2.6);
    glow.addColorStop(0, "#fff7d9dd");
    glow.addColorStop(0.16, "#d7a8ff99");
    glow.addColorStop(0.48, "#8654c744");
    glow.addColorStop(1, "#0000");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(gateX, gateY, radius * 2.6, 0, Math.PI * 2);
    context.fill();

    context.lineWidth = 1.5;
    for (let ring = 0; ring < 4; ring++) {
        const ringRadius = radius * (0.55 + ring * 0.38) + pulse * ring * 0.8;
        const startAngle = (time / (1700 + ring * 310)) % (Math.PI * 2);
        context.strokeStyle = ring % 2 === 0 ? "#e4bd67cc" : "#c79ce8bb";
        context.beginPath();
        context.ellipse(gateX, gateY, ringRadius, ringRadius + gateHeight * 0.2, 0, startAngle, startAngle + Math.PI * (1.45 + ring * 0.18));
        context.stroke();
    }

    const expandingRadius = radius * (1.05 + ((time / 1300) % 1) * 1.15);
    context.strokeStyle = `rgba(211, 169, 244, ${0.55 * (1 - ((time / 1300) % 1))})`;
    context.beginPath();
    context.arc(gateX, gateY, expandingRadius, 0, Math.PI * 2);
    context.stroke();

    for (let rune = 0; rune < 8; rune++) {
        const angle = time / 2400 + rune * Math.PI / 4;
        const runeRadius = radius * 1.48;
        const x = gateX + Math.cos(angle) * runeRadius;
        const y = gateY + Math.sin(angle) * runeRadius;
        context.fillStyle = rune % 2 === 0 ? "#f2d58b" : "#d4a9f2";
        context.save();
        context.translate(x, y);
        context.rotate(angle + Math.PI / 4);
        context.fillRect(-1.5, -1.5, 3, 3);
        context.restore();
    }

    context.fillStyle = "#fff5cf";
    context.beginPath();
    context.moveTo(gateX, gateY - radius * 0.35);
    context.lineTo(gateX + radius * 0.28, gateY);
    context.lineTo(gateX, gateY + radius * 0.35);
    context.lineTo(gateX - radius * 0.28, gateY);
    context.closePath();
    context.fill();
    context.restore();
}

function render(time) {
    const element = canvas.value;
    if (!element || !context) return;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const delta = previousTime === 0 ? 0 : Math.min(50, time - previousTime) / 1000;
    previousTime = time;
    if (walking.value && !crossedGate) {
        distance = Math.min(GATE_CROSSING_DISTANCE, distance + WALK_SPEED * delta);
        if (distance >= GATE_CROSSING_DISTANCE) {
            crossedGate = true;
            setWalking(false);
            emit("ascend");
            return;
        }
    }

    const bob = walking.value ? Math.sin(distance / 28) * 3 : Math.sin(time / 1700) * 0.4;
    const centerX = width / 2;
    const centerY = height * 0.5 + bob;
    const focalLength = Math.min(width, height) * 0.92;
    const offset = distance % SEGMENT_LENGTH;

    const backdrop = context.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, "#09070d");
    backdrop.addColorStop(0.52, "#17111d");
    backdrop.addColorStop(1, "#07060a");
    context.fillStyle = backdrop;
    context.fillRect(0, 0, width, height);

    const vanishingGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.16);
    vanishingGlow.addColorStop(0, "#030205");
    vanishingGlow.addColorStop(0.12, "#100b15");
    vanishingGlow.addColorStop(1, "#0000");
    context.fillStyle = vanishingGlow;
    context.fillRect(0, 0, width, height);

    const wallDepth = Math.max(45, GATE_DISTANCE - distance);
    drawEndWall(wallDepth + 8, centerX, centerY, focalLength, width, height);

    for (let index = SEGMENT_COUNT; index >= 0; index--) {
        const worldSegment = index + Math.floor(distance / SEGMENT_LENGTH);
        const segmentWorldDepth = 95 + worldSegment * SEGMENT_LENGTH;
        if (segmentWorldDepth >= GATE_DISTANCE) continue;
        const nearDepth = Math.max(55, 95 + index * SEGMENT_LENGTH - offset);
        const farDepth = Math.min(nearDepth + SEGMENT_LENGTH, wallDepth);
        const near = {
            leftTop: { ...project(-400, 0, nearDepth, centerX, centerY, focalLength), y: -height },
            rightTop: { ...project(400, 0, nearDepth, centerX, centerY, focalLength), y: -height },
            leftBottom: project(-400, FLOOR_LEVEL, nearDepth, centerX, centerY, focalLength),
            rightBottom: project(400, FLOOR_LEVEL, nearDepth, centerX, centerY, focalLength),
        };
        const far = {
            leftTop: { ...project(-400, 0, farDepth, centerX, centerY, focalLength), y: -height },
            rightTop: { ...project(400, 0, farDepth, centerX, centerY, focalLength), y: -height },
            leftBottom: project(-400, FLOOR_LEVEL, farDepth, centerX, centerY, focalLength),
            rightBottom: project(400, FLOOR_LEVEL, farDepth, centerX, centerY, focalLength),
        };
        const alternate = worldSegment % 2 === 0;
        polygon([near.leftTop, far.leftTop, far.leftBottom, near.leftBottom], alternate ? "#5a3b29" : "#493021", "#7b563b");
        polygon([far.rightTop, near.rightTop, near.rightBottom, far.rightBottom], alternate ? "#4b3021" : "#60402b", "#7b563b");
        polygon([far.leftBottom, far.rightBottom, near.rightBottom, near.leftBottom], alternate ? "#e8e1d2" : "#d8d0c0", "#a49a88");

        const nearRunnerLeft = project(-115, FLOOR_LEVEL, nearDepth, centerX, centerY, focalLength);
        const nearRunnerRight = project(115, FLOOR_LEVEL, nearDepth, centerX, centerY, focalLength);
        const farRunnerLeft = project(-115, FLOOR_LEVEL, farDepth, centerX, centerY, focalLength);
        const farRunnerRight = project(115, FLOOR_LEVEL, farDepth, centerX, centerY, focalLength);
        polygon(
            [farRunnerLeft, farRunnerRight, nearRunnerRight, nearRunnerLeft],
            alternate ? "#711d26" : "#821f2b",
            "#b17550",
        );

        if (index > 0 && index < SEGMENT_COUNT && worldSegment % 2 === 0) {
            drawPainting(-1, nearDepth + 35, centerX, centerY, focalLength, worldSegment, time);
            drawPainting(1, nearDepth + 35, centerX, centerY, focalLength, worldSegment + 19, time);
        }
    }

    drawExpansionGate(wallDepth, centerX, centerY, focalLength, time);

    const haze = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.45);
    haze.addColorStop(0, "#b58bd118");
    haze.addColorStop(0.18, "#5942670c");
    haze.addColorStop(1, "#0000");
    context.fillStyle = haze;
    context.fillRect(0, 0, width, height);
    animationFrame = requestAnimationFrame(render);
}

onMounted(() => {
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas.value);
    resizeCanvas();
    window.addEventListener("keydown", keyDownListener);
    window.addEventListener("keyup", keyUpListener);
    window.addEventListener("blur", blurListener);
    animationFrame = requestAnimationFrame(render);
});

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    window.removeEventListener("keydown", keyDownListener);
    window.removeEventListener("keyup", keyUpListener);
    window.removeEventListener("blur", blurListener);
});
</script>

<template>
    <section class="ascension-hall-scene">
        <canvas ref="canvas"></canvas>
        <div class="ascension-hall-vignette" aria-hidden="true"></div>
        <div class="ascension-hall-title"><strong>Ascension Hall</strong><span>The paintings are unknown to you at this time.</span></div>
        <button
            type="button"
            @pointerdown="setWalking(true)"
            @pointerup="setWalking(false)"
            @pointercancel="setWalking(false)"
            @pointerleave="setWalking(false)"
        >Hold to walk forward <small>or press W</small></button>
    </section>
</template>
