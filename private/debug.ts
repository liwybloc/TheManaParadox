import { writeNumber, readString } from "./break_eternity.js";
import { CONDENSED_UPGRADE_COUNT, setCondensedUpgrade } from "./condensed.js";
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

(globalThis as any).assignOwned = (category: string, index: number, owned: boolean) => {
    if (category !== "condensed") throw new Error(`Unknown owned category: ${category}`);
    if (!Number.isInteger(index) || index < 0 || index >= CONDENSED_UPGRADE_COUNT) {
        throw new Error(`Condensed upgrade index must be an integer from 0 to ${CONDENSED_UPGRADE_COUNT - 1}`);
    }
    setCondensedUpgrade(index, owned);
    refreshMasteryDerivedState();
};
