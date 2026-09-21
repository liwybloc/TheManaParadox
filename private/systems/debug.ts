import { writeNumber, readString } from "../core/break_eternity.js";
import { CONDENSED_UPGRADE_COUNT, setCondensedUpgrade } from "../game/condensed.js";
import { clampManaToInfinityBoundary } from "../game/currencies.js";
import { HANDLES } from "../core/player.js";
import { refreshMatrixDerivedState, refreshSealedMeridiansDerivedState } from "../game/progression.js";
import { refreshTierOneDerivedState } from "../game/tier_one.js";
import { setTotalMemories } from "../game/memories.js";
import { setQuestRefreshRemaining } from "../guild/guild.js";

(globalThis as any).readValue = (value: keyof typeof HANDLES) => {
    return readString(HANDLES[value] ?? HANDLES.mana);
};

(globalThis as any).assignValue = (value: keyof typeof HANDLES, number: number) => {
    writeNumber(HANDLES[value] ?? HANDLES.mana, number);
    refreshTierOneDerivedState();
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    clampManaToInfinityBoundary();
};

(globalThis as any).assignOwned = (category: string, index: number, owned: boolean) => {
    if (category !== "condensed") throw new Error(`Unknown owned category: ${category}`);
    if (!Number.isInteger(index) || index < 0 || index >= CONDENSED_UPGRADE_COUNT) {
        throw new Error(`Condensed upgrade index must be an integer from 0 to ${CONDENSED_UPGRADE_COUNT - 1}`);
    }
    setCondensedUpgrade(index, owned);
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
    refreshTierOneDerivedState();
};

(globalThis as any).assignMemories = (number: number) => {
    return setTotalMemories(number);
}

(globalThis as any).refreshQuests = () => {
    setQuestRefreshRemaining(0);
}