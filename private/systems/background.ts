const sky = document.getElementById("sky")!;
const STAR_COUNT = 200;
const MAXIMUM_DRIFT_PIXELS_PER_SECOND = 300;
const STARS_VISIBLE_STORAGE_KEY = "starsVisible";
const STARS_ANIMATED_STORAGE_KEY = "starsAnimated";
const fragment = document.createDocumentFragment();
type Star = {
    element: HTMLElement;
    x: number;
    y: number;
    directionX: number;
    directionY: number;
};

const stars: Star[] = [];
let manaProgress = 0;
let previousFrame = performance.now();
let animationEnabled = true;

function random(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement("i");
    star.className = "star";

    star.style.setProperty("--star-size", `${random(1, 3)}px`);
    star.style.setProperty("--twinkle-duration", `${random(1.8, 5.5)}s`);
    star.style.setProperty("--twinkle-delay", `${random(-5.5, 0)}s`);
    star.style.setProperty("--twinkle-minimum", `${random(0.15, 0.55)}`);
    const angle = random(0, Math.PI * 2);
    const x = random(0, window.innerWidth);
    const y = random(0, window.innerHeight);
    star.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    fragment.appendChild(star);
    stars.push({ element: star, x, y, directionX: Math.cos(angle), directionY: Math.sin(angle) });
}
sky.appendChild(fragment);

function moveStars(timestamp: number): void {
    const elapsedSeconds = Math.min(0.1, Math.max(0, timestamp - previousFrame) / 1000);
    previousFrame = timestamp;
    if (animationEnabled && manaProgress > 0) {
        const distance = MAXIMUM_DRIFT_PIXELS_PER_SECOND * manaProgress * elapsedSeconds;
        const width = window.innerWidth;
        const height = window.innerHeight;
        for (const star of stars) {
            star.x = (star.x + star.directionX * distance + width) % width;
            star.y = (star.y + star.directionY * distance + height) % height;
            star.element.style.transform = `translate3d(${star.x}px, ${star.y}px, 0)`;
        }
    }
    requestAnimationFrame(moveStars);
}

export function starsVisible(): boolean {
    return localStorage.getItem(STARS_VISIBLE_STORAGE_KEY) !== "false";
}

export function starsAnimated(): boolean {
    return localStorage.getItem(STARS_ANIMATED_STORAGE_KEY) !== "false";
}

export function setStarsVisible(visible: boolean): void {
    document.body.classList.toggle("effects-disabled", !visible);
    localStorage.setItem(STARS_VISIBLE_STORAGE_KEY, String(visible));
}

export function setStarsAnimated(animated: boolean): void {
    animationEnabled = animated;
    document.body.classList.toggle("star-animation-disabled", !animated);
    localStorage.setItem(STARS_ANIMATED_STORAGE_KEY, String(animated));
}

export function setStarManaProgress(progress: number): void {
    manaProgress = Math.max(0, Math.min(1, progress));
}

setStarsVisible(starsVisible());
setStarsAnimated(starsAnimated());
requestAnimationFrame(moveStars);
