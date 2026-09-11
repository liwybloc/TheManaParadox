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
    fragment.appendChild(star);
}
sky.appendChild(fragment);
