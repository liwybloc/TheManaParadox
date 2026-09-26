const sky = document.getElementById("sky") as HTMLCanvasElement;
const abyssVortex = document.getElementById("abyss-vortex") as HTMLCanvasElement;
const skyContext = sky.getContext("2d")!;
const vortexContext = abyssVortex.getContext("2d")!;
let context = skyContext;
const STAR_COUNT = 200;
const MAXIMUM_DRIFT_PIXELS_PER_SECOND = 300;
const STAR_FRAME_INTERVAL = 1000 / 30;
const MAXIMUM_DEVICE_PIXEL_RATIO = 2;
const STARS_VISIBLE_STORAGE_KEY = "starsVisible";
const STARS_ANIMATED_STORAGE_KEY = "starsAnimated";

type Star = {
    x: number;
    y: number;
    size: number;
    directionX: number;
    directionY: number;
    twinkleDuration: number;
    twinkleOffset: number;
    minimumOpacity: number;
};

const stars: Star[] = [];
let manaProgress = 0;
let previousFrame = performance.now();
let previousRenderedFrame = 0;
let animationEnabled = true;
let visible = true;
let abyssActive = false;
let abyssVortexActive = false;
let width = window.innerWidth;
let height = window.innerHeight;
const abyssBubbles = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: random(3, 18),
    speed: random(0.025, 0.09),
    drift: random(-0.035, 0.035),
    opacity: random(0.25, 0.8),
}));

function random(minimum: number, maximum: number): number {
    return Math.random() * (maximum - minimum) + minimum;
}

for (let index = 0; index < STAR_COUNT; index++) {
    const angle = random(0, Math.PI * 2);
    stars.push({
        x: random(0, width),
        y: random(0, height),
        size: random(1, 3),
        directionX: Math.cos(angle),
        directionY: Math.sin(angle),
        twinkleDuration: random(1.8, 5.5),
        twinkleOffset: random(-5.5, 0),
        minimumOpacity: random(0.15, 0.55),
    });
}

function resizeSky(): void {
    const previousWidth = width;
    const previousHeight = height;
    width = window.innerWidth;
    height = window.innerHeight;
    const devicePixelRatio = Math.min(MAXIMUM_DEVICE_PIXEL_RATIO, window.devicePixelRatio || 1);
    sky.width = Math.max(1, Math.round(width * devicePixelRatio));
    sky.height = Math.max(1, Math.round(height * devicePixelRatio));
    abyssVortex.width = sky.width;
    abyssVortex.height = sky.height;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    vortexContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    if (previousWidth > 0 && previousHeight > 0) {
        for (const star of stars) {
            star.x = star.x / previousWidth * width;
            star.y = star.y / previousHeight * height;
        }
    }
    drawStars(performance.now());
}

function drawStars(timestamp: number): void {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fff";
    for (const star of stars) {
        const cycle = (timestamp / 1000 + star.twinkleOffset) / star.twinkleDuration;
        const wave = (Math.sin(cycle * Math.PI) + 1) / 2;
        context.globalAlpha = animationEnabled
            ? star.minimumOpacity + (1 - star.minimumOpacity) * wave
            : 1;
        context.beginPath();
        context.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
        context.fill();
    }
    context.globalAlpha = 1;
}

const ARM_COLORS = ["#0c2b49", "#0e3152", "#123957", "#103450", "#16405e"];

function drawAbyss(timestamp: number): void {
    context.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = Math.min(height * 0.58, 520);
    const portalSize = Math.min(width, height) * 0.68;
    const radius = portalSize * 0.48;
    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#2a668d");
    background.addColorStop(0.28, "#123c5d");
    background.addColorStop(0.62, "#071d35");
    background.addColorStop(1, "#020817");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    const glow = context.createRadialGradient(centerX * 0.9, centerY * 0.86, 0, centerX, centerY, radius * 1.35);
    glow.addColorStop(0, "rgba(35, 104, 145, 0.42)");
    glow.addColorStop(0.55, "rgba(12, 51, 83, 0.2)");
    glow.addColorStop(1, "rgba(0, 5, 14, 0.4)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    context = vortexContext;
    context.clearRect(0, 0, width, height);
    if (!abyssVortexActive) {
        context = skyContext;
    } else {
    context.save();
    context.translate(centerX, centerY);
    context.globalCompositeOperation = "screen";
    const swirlFill = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    swirlFill.addColorStop(0, "#071c32");
    swirlFill.addColorStop(0.55, "#0a2946");
    swirlFill.addColorStop(1, "#061a31");
    context.globalCompositeOperation = "source-over";
    context.fillStyle = swirlFill;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "screen";
    for (let arm = 0; arm < 16; arm++) {
        context.beginPath();
        for (let step = 0; step <= 75; step++) {
            const progress = step / 75;
            const angle = progress * Math.PI * 2.05 + timestamp / 9000 + arm * Math.PI * 2 / 16
                + Math.sin(progress * Math.PI * 6 + arm * 0.7) * 0.1;
            const distance = progress * radius;
            const wave = 1 + Math.sin(progress * Math.PI * 7 + timestamp / 1800 + arm) * 0.06;
            const x = Math.cos(angle) * distance * wave;
            const y = Math.sin(angle) * distance * wave;
            if (step === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.strokeStyle = ARM_COLORS[arm % 5] + "b8";
        context.lineWidth = Math.max(3, radius * (arm % 5 === 0 ? 0.032 : 0.021));
        context.shadowBlur = 6;
        context.shadowColor = context.strokeStyle;
        context.stroke();
    }
    context.lineWidth = Math.max(1, radius * 0.008);
    for (let wisp = 0; wisp < 6; wisp++) {
        const startAngle = wisp * Math.PI * 2 / 6 + timestamp / 11000;
        context.beginPath();
        for (let step = 0; step <= 28; step++) {
            const progress = step / 28;
            const angle = startAngle + progress * 0.45;
            const distance = radius * (0.92 + progress * 0.42);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            if (step === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.strokeStyle = "#17446655";
        context.stroke();
    }
    const edgeFade = context.createRadialGradient(0, 0, radius * 0.62, 0, 0, radius * 1.18);
    edgeFade.addColorStop(0, "rgba(2, 8, 23, 0)");
    edgeFade.addColorStop(0.72, "rgba(2, 8, 23, 0.12)");
    edgeFade.addColorStop(1, "rgba(2, 8, 23, 0.88)");
    context.globalCompositeOperation = "source-over";
    context.fillStyle = edgeFade;
    context.beginPath();
    context.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "source-over";
    context.beginPath();
    const funnel = context.createRadialGradient(0, 0, 0, 0, 0, radius * 0.16);
    funnel.addColorStop(0, "#01030a");
    funnel.addColorStop(0.7, "#020b18");
    funnel.addColorStop(1, "#0a2944");
    context.fillStyle = funnel;
    context.shadowBlur = 45;
    context.shadowColor = "#1c5c8a99";
    context.fill();
    context.restore();
    }

    context = skyContext;
    for (const bubble of abyssBubbles) {
        bubble.y -= bubble.speed / 60;
        bubble.x += Math.sin(timestamp / 1200 + bubble.y * 10) * bubble.drift / 60;
        if (bubble.y < -0.08) {
            bubble.y = 1.04;
            bubble.x = Math.random();
            bubble.size = random(3, 18);
        }
        const x = bubble.x * width;
        const y = bubble.y * height;
        context.beginPath();
        context.arc(x, y, bubble.size / 2, 0, Math.PI * 2);
        context.strokeStyle = `rgba(71, 129, 174, ${bubble.opacity})`;
        context.lineWidth = 1;
        context.fillStyle = "rgba(22, 69, 105, 0.18)";
        context.shadowBlur = 10;
        context.shadowColor = "rgba(34, 105, 153, 0.55)";
        context.fill();
        context.stroke();
    }
    context.shadowBlur = 0;
}

function animateStars(timestamp: number): void {
    requestAnimationFrame(animateStars);
    if (!visible || document.hidden || timestamp - previousRenderedFrame < STAR_FRAME_INTERVAL) return;
    const elapsedSeconds = Math.min(0.1, Math.max(0, timestamp - previousFrame) / 1000);
    previousFrame = timestamp;
    previousRenderedFrame = timestamp;
    if (abyssActive) {
        drawAbyss(timestamp);
        return;
    }
    if (animationEnabled && manaProgress > 0) {
        const distance = MAXIMUM_DRIFT_PIXELS_PER_SECOND * manaProgress * elapsedSeconds;
        for (const star of stars) {
            star.x = (star.x + star.directionX * distance + width) % width;
            star.y = (star.y + star.directionY * distance + height) % height;
        }
    }
    drawStars(timestamp);
}

export function starsVisible(): boolean {
    return localStorage.getItem(STARS_VISIBLE_STORAGE_KEY) !== "false";
}

export function starsAnimated(): boolean {
    return localStorage.getItem(STARS_ANIMATED_STORAGE_KEY) !== "false";
}

export function setStarsVisible(nextVisible: boolean): void {
    visible = nextVisible;
    document.body.classList.toggle("effects-disabled", !nextVisible);
    localStorage.setItem(STARS_VISIBLE_STORAGE_KEY, String(nextVisible));
    if (nextVisible) drawStars(performance.now());
}

export function setStarsAnimated(animated: boolean): void {
    animationEnabled = animated;
    localStorage.setItem(STARS_ANIMATED_STORAGE_KEY, String(animated));
    drawStars(performance.now());
}

export function setStarManaProgress(progress: number): void {
    manaProgress = Math.max(0, Math.min(1, progress));
}

export function setAbyssActive(active: boolean): void {
    abyssActive = active;
    if (active) drawAbyss(performance.now());
    else {
        context = skyContext;
        vortexContext.clearRect(0, 0, width, height);
        drawStars(performance.now());
    }
}

export function setAbyssVortexActive(active: boolean): void {
    abyssVortexActive = active;
    if (!active) vortexContext.clearRect(0, 0, width, height);
    else if (abyssActive) drawAbyss(performance.now());
}

window.addEventListener("resize", resizeSky);
resizeSky();
setStarsVisible(starsVisible());
setStarsAnimated(starsAnimated());
requestAnimationFrame(animateStars);
