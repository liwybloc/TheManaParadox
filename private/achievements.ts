import { addUS, divInto, eq, gt, gte, log10Into, mulUS, writeDecimal, writeNumber } from "./break_eternity.js";
import type { Player } from "./player.js";
import type { Scratch } from "./scratch.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const TIER_ONE_ACHIEVEMENT_COUNT: i32 = 5;
let tierOneRewardsChanged = false;

export function hasTierOneAchievement(index: i32): bool {
    switch (index) {
        case 0: return player.achievement_buymanaconduit;
        case 1: return player.achievement_buyconduitconjugation;
        case 2: return player.achievement_buyconjugationcreation;
        case 3: return player.achievement_buycreationmanufactory;
        case 4: return player.achievement_buymanufacturestaff;
        case 5: return player.achievement_playtwohours;
        case 6: return player.achievement_upgrademastery;
        case 7: return player.achievement_havesixstaff;
        case 8: return player.achievement_produce1e50mana;
        case 9: return player.achievement_castspeedminute;
        case 10: return player.achievement_centennial;
        case 11: return player.achievement_circularhabits;
        case 12: return player.achievement_difficulty;
        case 13: return player.achievement_realnews;
        case 14: return player.achievement_clicker;
        default: return false;
    }
}

export function setTierOneAchievement(index: i32, unlocked: bool): void {
    switch (index) {
        case 0: player.achievement_buymanaconduit = unlocked; break;
        case 1: player.achievement_buyconduitconjugation = unlocked; break;
        case 2: player.achievement_buyconjugationcreation = unlocked; break;
        case 3: player.achievement_buycreationmanufactory = unlocked; break;
        case 4: player.achievement_buymanufacturestaff = unlocked; break;
        case 5: player.achievement_playtwohours = unlocked; break;
        case 6: player.achievement_upgrademastery = unlocked; break;
        case 7: player.achievement_havesixstaff = unlocked; break;
        case 8: player.achievement_produce1e50mana = unlocked; break;
        case 9: player.achievement_castspeedminute = unlocked; break;
        case 10: player.achievement_centennial = unlocked; break;
        case 11: player.achievement_circularhabits = unlocked; break;
        case 12: player.achievement_difficulty = unlocked; break;
        case 13: player.achievement_realnews = unlocked; break;
        case 14: player.achievement_clicker = unlocked; break;
    }
    refreshAchievementRewards();
}

export function unlockTierOneAchievement(index: i32): bool {
    let changed = false;
    if (!hasTierOneAchievement(index)) {
        setTierOneAchievement(index, true);
        if (index === 10) tierOneRewardsChanged = true;
        changed = true;
    }
    if (index === 4 && eq(player.count_manufactureStaff, 12) && !hasTierOneAchievement(7)) {
        setTierOneAchievement(7, true);
        changed = true;
    }
    return changed;
}

export function checkTimeAchievements(): void {
    writeNumber(scratch.currencyGain, 3600);
    if (gte(player.statistics_totalTimePlayed, scratch.currencyGain)) unlockTierOneAchievement(5);
    refreshAchievementRewards();
}

export function checkManaAchievements(): void {
    writeDecimal(scratch.currencyGain, 1, 1, 50);
    if (gte(player.statistics_totalManaProduced, scratch.currencyGain)) unlockTierOneAchievement(8);
    writeDecimal(scratch.currencyGain, 1, 1, 100);
    if (gte(player.mana, scratch.currencyGain)) unlockTierOneAchievement(10);
}

export function checkCastSpeedAchievements(): void {
    writeNumber(scratch.currencyGain, 60);
    if (gt(player.castSpeedTimer, scratch.currencyGain)) unlockTierOneAchievement(9);
}

export function consumeTierOneRewardsChanged(): bool {
    const changed = tierOneRewardsChanged;
    tierOneRewardsChanged = false;
    return changed;
}

export function refreshAchievementRewards(): void {
    writeNumber(player.multiplier_currencyGlobal, 1);
    for (let index: i32 = 0; index < TIER_ONE_ACHIEVEMENT_COUNT; index++) {
        if (!hasTierOneAchievement(index)) continue;
        writeNumber(scratch.currencyGain, <f64>(index + 1) / 100);
        addUS(player.multiplier_currencyGlobal, scratch.currencyGain);
    }
    writeNumber(player.multiplier_timePlayedAchievement, 1);
    if (hasTierOneAchievement(5)) {
        divInto(scratch.currencyGain, player.statistics_totalTimePlayed, player.constant_timeAchievementDivisor);
        log10Into(scratch.currencyGain, scratch.currencyGain);
        mulUS(scratch.currencyGain, 2);
        if (gt(scratch.currencyGain, 1)) {
            writeNumber(player.multiplier_timePlayedAchievement, 0);
            addUS(player.multiplier_timePlayedAchievement, scratch.currencyGain);
        }
    }
    mulUS(player.multiplier_currencyGlobal, player.multiplier_timePlayedAchievement);
    writeNumber(player.multiplier_tierOnePerPurchase, 2);
    if (hasTierOneAchievement(10)) {
        writeNumber(scratch.currencyGain, 0.1);
        addUS(player.multiplier_tierOnePerPurchase, scratch.currencyGain);
    }
}

export function recordClick(): void {
    addUS(player.statistics_totalClicks, 1);
    writeNumber(scratch.currencyGain, 1000);
    if (gt(player.statistics_totalClicks, scratch.currencyGain)) unlockTierOneAchievement(14);
}

/** [/WASM] */

refreshAchievementRewards();
