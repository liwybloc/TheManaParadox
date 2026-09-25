const sky = document.getElementById("sky") as HTMLCanvasElement;
const context = sky.getContext("2d")!;
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
let width = window.innerWidth;
let height = window.innerHeight;

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
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
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

function animateStars(timestamp: number): void {
    requestAnimationFrame(animateStars);
    if (!visible || document.hidden || timestamp - previousRenderedFrame < STAR_FRAME_INTERVAL) return;
    const elapsedSeconds = Math.min(0.1, Math.max(0, timestamp - previousFrame) / 1000);
    previousFrame = timestamp;
    previousRenderedFrame = timestamp;
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

window.addEventListener("resize", resizeSky);
resizeSky();
setStarsVisible(starsVisible());
setStarsAnimated(starsAnimated());
requestAnimationFrame(animateStars);
