import { namedWasm } from "../../generated/_wasm$globals.js";
import { SCRATCH_HANDLES } from "../core/scratch.js";
import { CRYSTALS } from "../game/crystals.js";
import { resetForCondense, saveGame } from "./save.js";

type CondenseListener = () => void;
type MemoryGainListener = () => void;

const condenseListeners = new Set<CondenseListener>();
const memoryGainListeners = new Set<MemoryGainListener>();

export function condense(): boolean {
    if (!namedWasm.calculateCondenseGain()) return false;
    const focused = namedWasm.isFocusing();
    const memoryChance = focused ? namedWasm.memoryChance(SCRATCH_HANDLES.condenseGain) : 0;
    resetForCondense();
    namedWasm.completeCondense();
    if (focused && namedWasm.resolveFocusedCondense(Math.random(), memoryChance)) {
        for (const listener of memoryGainListeners) listener();
        if (namedWasm.getTotalMemories() >= 25) namedWasm.unlockTierOneAchievement(46);
    }
    void saveGame();
    for (const listener of condenseListeners) listener();
    return true;
}

export function focus(): boolean {
    if (!namedWasm.toggleFocus()) return false;
    resetForCondense();
    void saveGame();
    for (const listener of condenseListeners) listener();
    return true;
}

export function enterCrystal(index: number): boolean {
    if (!namedWasm.enterCrystal(index)) return false;
    resetForCondense();
    void saveGame();
    return true;
}

export function escapeCrystal(): boolean {
    if (!namedWasm.escapeCrystal()) return false;
    resetForCondense();
    void saveGame();
    return true;
}

export function shatterCrystal(): boolean {
    if (!namedWasm.shatterActiveCrystal()) return false;
    namedWasm.unlockTierOneAchievement(45);
    if (CRYSTALS.every((_, index) => namedWasm.hasCompletedCrystal(index))) {
        namedWasm.unlockTierOneAchievement(47);
    }
    resetForCondense();
    void saveGame();
    return true;
}

export function subscribeToCondense(listener: CondenseListener): () => void {
    condenseListeners.add(listener);
    return () => condenseListeners.delete(listener);
}

export function subscribeToMemoryGain(listener: MemoryGainListener): () => void {
    memoryGainListeners.add(listener);
    return () => memoryGainListeners.delete(listener);
}

export function buyMaxTierOne(index: number): void {
    namedWasm.buyMaxTierOne(index);
}

export function buyMaxAllTierOne(): void {
    namedWasm.buyMaxAllTierOne();
}

export function castAll(): void {
    namedWasm.buyMaxAllTierOne();
    namedWasm.castSpeedMax();
}

export function sealMeridians(): void {
    namedWasm.sealMeridians();
}

export function increaseMatrix(): void {
    namedWasm.increaseMatrix();
}

export function castSpeed(): void {
    namedWasm.castSpeed();
}
