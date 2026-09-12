const sky = document.getElementById("sky")!;
const STAR_COUNT = 200;
const fragment = document.createDocumentFragment();

function random(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement("i");
    star.className = "star";

    star.style.left = `${random(0, 100)}%`;
    star.style.top = `${random(0, 100)}%`;

    star.style.setProperty("--star-size", `${random(1, 3)}px`);
    star.style.setProperty("--twinkle-duration", `${random(1.8, 5.5)}s`);
    star.style.setProperty("--twinkle-delay", `${random(-5.5, 0)}s`);
    star.style.setProperty("--twinkle-minimum", `${random(0.15, 0.55)}`);
    star.style.setProperty("--drift-duration", `${random(45, 110)}s`);
    star.style.setProperty("--drift-delay", `${random(-110, 0)}s`);
    star.style.setProperty("--drift-x", `${random(-35, 35)}px`);
    star.style.setProperty("--drift-y", `${random(-25, 25)}px`);
    fragment.appendChild(star);
}
sky.appendChild(fragment);
