import { namedWasm } from "../../generated/_wasm$globals.js";
import { resetForCondense, saveGame } from "./save.js";

type CondenseListener = () => void;

const condenseListeners = new Set<CondenseListener>();

export function condense(): boolean {
    if (!namedWasm.calculateCondenseGain()) return false;
    resetForCondense();
    namedWasm.completeCondense();
    void saveGame();
    for (const listener of condenseListeners) listener();
    return true;
}

export function subscribeToCondense(listener: CondenseListener): () => void {
    condenseListeners.add(listener);
    return () => condenseListeners.delete(listener);
}

export function buyMaxTierOne(index: number): void {
    namedWasm.buyMaxTierOne(index);
}

export function buyMaxAllTierOne(): void {
    namedWasm.buyMaxAllTierOne();
}

export function castAll(): void {
    namedWasm.castSpeedMax();
    namedWasm.buyMaxAllTierOne();
}

export function increaseMastery(): void {
    namedWasm.increaseMastery();
}

export function increaseMatrix(): void {
    namedWasm.increaseMatrix();
}

export function castSpeed(): void {
    namedWasm.castSpeed();
}
