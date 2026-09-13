import { addUS, divInto, gt, gte, log10Into, mulUS, reachesLayerBoundary, writeDecimal, writeNumber } from "../core/break_eternity.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";

export const ACHIEVEMENTS = [
    { id: "achievement_buymanaconduit", number: 1, title: "Something feels.. familiar", description: "Purchase a Mana Conduit.", reward: "+1% mana production" },
    { id: "achievement_buyconduitconjugation", number: 2, title: "Meta Production", description: "Purchase a Conduit Conjugation.", reward: "+2% mana production" },
    { id: "achievement_buyconjugationcreation", number: 3, title: "The promised achievement", description: "Purchase a Conjugation Creation.", reward: "+3% mana production" },
    { id: "achievement_buycreationmanufactory", number: 4, title: "Industrial age", description: "Purchase a Creation Manufactory.", reward: "+4% mana production" },
    { id: "achievement_buymanufacturestaff", number: 5, title: "The true best friend", description: "Purchase a Manufacture Staff.", reward: "+5% mana production" },
    { id: "achievement_playtwohours", number: 6, title: "Thanks!", description: "Play for 1 hour.", reward: "Mana is increased based on time played", dynamicReward: "time-played" },
    { id: "achievement_upgrademastery", number: 7, title: "Grandmastery", description: "Upgrade your mastery to level 5." },
    { id: "achievement_havesixstaff", number: 8, title: "Double the Sith", description: "Have at least 12 Manufacture Staff.", reward: "Unlock Staff Bolstering" },
    { id: "achievement_produce1e50mana", number: 9, title: "Yet not the AI", description: "Produce 1.00e50 mana.", reward: "Reset with 500 mana" },
    { id: "achievement_castspeedminute", number: 10, title: "This lasts like.. forever!", description: "Have over 1 minute of Cast Speed time.", reward: "Cast Speed time is increased by 5 seconds per purchase" },
    { id: "achievement_centennial", number: 11, title: "Centennial", description: "Reach 1.00e100 Mana.", reward: "Increase per-purchase multiplier by +0.1×" },
    { id: "achievement_circularhabits", number: 12, title: "Circular Habits", description: "Reach the limit of your mana circle." },
    { id: "achievement_difficulty", number: 13, title: "I think this is called difficulty", description: "Reach the limit of your mana circle without any Crystal Matrices.", reward: "Increase Crystal Matrix effect by +0.1×", category: "challenge" },
    { id: "achievement_realnews", number: 14, title: "REAL NEWS!", description: "View 50 different ticker messages." },
    { id: "achievement_clicker", number: 15, title: "Clicker!", description: "Click over 1,000 times.", reward: "Carpel tunnel" },
    { id: "achievement_lightning", number: 16, title: "Lightning", description: "Condense in under 1 minute.", reward: "Each tier 1 producer gains a production bonus based on its tier, from +1% to +5%.", category: "challenge" },
    { id: "achievement_pleasedosleep", number: 17, title: "Please do sleep", description: "Be offline for more than an hour." },
    { id: "achievement_noendgame", number: 18, title: "I don't believe in the Endgame", description: "Condense without bolstering.", reward: "Bolstering is 5× stronger", category: "challenge" },
    { id: "achievement_supercondensed", number: 19, title: "Super-Condensed", description: "Condense 50 times." },
    { id: "achievement_empowertwice", number: 20, title: "Wait, you can get 2 of these?!", description: "Empower any producer twice." },
    { id: "achievement_matrixmanipulation", number: 21, title: "Matrix Manipulation", description: "Conjure a Crystal Matrix without upgrading mastery.", category: "challenge" },
    { id: "achievement_unnecessary", number: 22, title: "Unnecessary", description: "Condense without casting speed.", category: "challenge" },
    { id: "achievement_timeforthefunpart", number: 23, title: "Time for the fun part", description: "Reach 10 condensed mana." },
    { id: "achievement_allcondensedupgrades", number: 24, title: "Is this the end of the game?", description: "Purchase every condensed upgrade." },
    { id: "achievement_newhorizons", number: 25, title: "LilysMana: New Horizons", description: "Expand your mana circle." },
    { id: "achievement_unlockguild", number: 26, title: "I should've related these two!", description: "Unlock the Guild." },
    { id: "achievement_firstquest", number: 27, title: "That was a battle! Literally", description: "Complete your first quest." },
    { id: "achievement_drinkpotion", number: 28, title: "It's bitter!", description: "Drink a potion." },
    { id: "achievement_tenquests", number: 29, title: "Will I rank up?", description: "Complete 10 quests." },
    { id: "achievement_rankupe", number: 30, title: "Yes you will!", description: "Rank up to E tier." },
];

export const PROGRESSION_ACHIEVEMENT_ORDER = [
    1, 2, 3, 4, 5,
    14, 15, 9, 10, 20,
    11, 7, 26, 27, 28,
    29, 30, 12, 17, 6,
    8, 19, 23, 24, 25,
];

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
        case 15: return player.achievement_lightning;
        case 16: return player.achievement_pleasedosleep;
        case 17: return player.achievement_noendgame;
        case 18: return player.achievement_supercondensed;
        case 19: return player.achievement_empowertwice;
        case 20: return player.achievement_matrixmanipulation;
        case 21: return player.achievement_unnecessary;
        case 22: return player.achievement_timeforthefunpart;
        case 23: return player.achievement_allcondensedupgrades;
        case 24: return player.achievement_newhorizons;
        case 25: return player.achievement_unlockguild;
        case 26: return player.achievement_firstquest;
        case 27: return player.achievement_drinkpotion;
        case 28: return player.achievement_tenquests;
        case 29: return player.achievement_rankupe;
        default: return false;
    }
}

export function setTierOneAchievement(index: i32, unlocked: bool): void {
    const previous = hasTierOneAchievement(index);
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
        case 15: player.achievement_lightning = unlocked; break;
        case 16: player.achievement_pleasedosleep = unlocked; break;
        case 17: player.achievement_noendgame = unlocked; break;
        case 18: player.achievement_supercondensed = unlocked; break;
        case 19: player.achievement_empowertwice = unlocked; break;
        case 20: player.achievement_matrixmanipulation = unlocked; break;
        case 21: player.achievement_unnecessary = unlocked; break;
        case 22: player.achievement_timeforthefunpart = unlocked; break;
        case 23: player.achievement_allcondensedupgrades = unlocked; break;
        case 24: player.achievement_newhorizons = unlocked; break;
        case 25: player.achievement_unlockguild = unlocked; break;
        case 26: player.achievement_firstquest = unlocked; break;
        case 27: player.achievement_drinkpotion = unlocked; break;
        case 28: player.achievement_tenquests = unlocked; break;
        case 29: player.achievement_rankupe = unlocked; break;
    }
    if (previous !== unlocked) achievementRevision++;
    refreshAchievementRewards();
}

let achievementRevision: i32 = 0;

export function getAchievementRevision(): i32 {
    return achievementRevision;
}

export function unlockTierOneAchievement(index: i32): bool {
    let changed = false;
    if (!hasTierOneAchievement(index)) {
        setTierOneAchievement(index, true);
        if (index === 10 || index === 12) tierOneRewardsChanged = true;
        changed = true;
    }
    if (index === 4 && gte(player.count_manufactureStaff, 12) && !hasTierOneAchievement(7)) {
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
    if (reachesLayerBoundary(player.mana, 0)) unlockTierOneAchievement(11);
    if (reachesLayerBoundary(player.mana, 0) && !gt(player.matrixOwned, 0)) unlockTierOneAchievement(12);
    writeDecimal(scratch.currencyGain, 1, 1, 100);
    if (gte(player.mana, scratch.currencyGain)) unlockTierOneAchievement(10);
}

export function checkOfflineAchievement(seconds: f64): void {
    if (seconds > 3600) unlockTierOneAchievement(16);
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
