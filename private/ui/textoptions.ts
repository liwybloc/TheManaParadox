export const GLITCH_SYMBOLS = "!@#$%^&*()[]\\-=+_`~.,></;:'\"";

export function createGlitchPositions(length: number, count: number): Set<number> {
    const positions = new Set<number>();
    while (positions.size < Math.min(length, count)) positions.add(Math.floor(Math.random() * length));
    return positions;
}

export function renderGlitchText(length: number, positions: Set<number>): string {
    const text = Array.from({ length }, () => "?");
    for (const position of positions) {
        text[position] = GLITCH_SYMBOLS[Math.floor(Math.random() * GLITCH_SYMBOLS.length)];
    }
    return text.join("");
}
