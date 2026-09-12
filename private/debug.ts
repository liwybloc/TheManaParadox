import { writeNumber, readString } from "./break_eternity.js";
import { clampManaToInfinityBoundary } from "./currencies.js";
import { HANDLES } from "./player.js";
import { refreshMasteryDerivedState, refreshMatrixDerivedState } from "./progression.js";
import { refreshTierOneDerivedState } from "./tier_one.js";

(globalThis as any).readValue = (value: keyof typeof HANDLES) => {
    return readString(HANDLES[value] ?? HANDLES.mana);
};

(globalThis as any).assignValue = (value: keyof typeof HANDLES, number: number) => {
    writeNumber(HANDLES[value] ?? HANDLES.mana, number);
    refreshTierOneDerivedState();
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    clampManaToInfinityBoundary();
};
