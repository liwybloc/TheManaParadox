import { createDecimal, createZero } from "./break_eternity.js";

export interface PlayerHandles {
    mana: i32;
    statistics_totalManaProduced: i32;
    statistics_totalTimePlayed: i32;
    statistics_gameTimePlayed: i32;
    statistics_totalClicks: i32;
    statistics_condensedManaProduced: i32;
    statistics_condenses: i32;
    statistics_timeThisCondense: i32;
    statistics_fastestCondense: i32;
    statistics_questsCompleted: i32;
    mana_circle_tier: i32;
    multiplier_currencyGlobal: i32;
    multiplier_timePlayedAchievement: i32;
    multiplier_tierOnePerPurchase: i32;
    constant_timeAchievementDivisor: i32;
    count_manaConduit: i32;
    count_conduitConjugation: i32;
    count_conjugationCreation: i32;
    count_creationManufactory: i32;
    count_manufactureStaff: i32;
    bought_manaConduit: i32;
    bought_conduitConjugation: i32;
    bought_conjugationCreation: i32;
    bought_creationManufactory: i32;
    bought_manufactureStaff: i32;
    cost_manaConduit: i32;
    cost_conduitConjugation: i32;
    cost_conjugationCreation: i32;
    cost_creationManufactory: i32;
    cost_manufactureStaff: i32;
    multiplier_manaConduit: i32;
    multiplier_conduitConjugation: i32;
    multiplier_conjugationCreation: i32;
    multiplier_creationManufactory: i32;
    multiplier_manufactureStaff: i32;
    castSpeedTimer: i32;
    castSpeedMagnitude: i32;
    castSpeedCost: i32;
    sealedMeridiansOwned: i32;
    sealedMeridians: i32;
    sealMeridiansCost: i32;
    sealedMeridiansSpeedEffect: i32;
    matrixOwned: i32;
    matrixCost: i32;
    matrixPower: i32;
    matrixSpeedPower: i32;
    empowerment_manaConduit: i32;
    empowerment_conduitConjugation: i32;
    empowerment_conjugationCreation: i32;
    empowerment_creationManufactory: i32;
    legacy_000: i32;
    cost_empowerment_manaConduit: i32;
    cost_empowerment_conduitConjugation: i32;
    cost_empowerment_conjugationCreation: i32;
    cost_empowerment_creationManufactory: i32;
    cost_empowerment_manufactureStaff: i32;
    purifiedMeridiansMultiplier: i32;
    meridianPurificationEffect: i32;
    meridianPurificationRequirement: i32;
    courageTimer: i32;
    courageCooldown: i32;
    courageMultiplier: i32;
    condensedMana: i32;
    coins: i32;
    guildRank: i32;
    activeQuest: i32;
    wolfineHealth: i32;
    combatShield: i32;
    combatShieldMaximum: i32;
    combatFreezeTurns: i32;
    fireballCost: i32;
    whirlwindCost: i32;
    freezeCost: i32;
    inventoryWolfFur: i32;
    inventoryPotionOfSpeed: i32;
    inventoryWolfFurPosition: i32;
    inventoryPotionPosition: i32;
    potionSpeedTimer: i32;
}

export interface Player extends PlayerHandles {
    meridianSealedThisReset: bool;
    castSpeedUsedThisCondense: bool;
    potionUsedThisCondense: bool;
    boostedProducerThisCondense: bool;
    combatUsedNonFreeze: bool;
    courageUnlocked: bool;
    hasCondensed: bool;
    guildUnlocked: bool;
    guildMember: bool;
}

export const HANDLES: PlayerHandles = {
    mana: createDecimal(1, 0, 10),
    statistics_totalManaProduced: createZero(),
    statistics_totalTimePlayed: createZero(),
    statistics_gameTimePlayed: createZero(),
    statistics_totalClicks: createZero(),
    statistics_condensedManaProduced: createZero(),
    statistics_condenses: createZero(),
    statistics_timeThisCondense: createZero(),
    statistics_fastestCondense: createZero(),
    statistics_questsCompleted: createZero(),
    mana_circle_tier: createZero(),
    multiplier_currencyGlobal: createDecimal(1, 0, 1),
    multiplier_timePlayedAchievement: createDecimal(1, 0, 1),
    multiplier_tierOnePerPurchase: createDecimal(1, 0, 2),
    constant_timeAchievementDivisor: createDecimal(1, 0, 500),
    count_manaConduit: createZero(),
    count_conduitConjugation: createZero(),
    count_conjugationCreation: createZero(),
    count_creationManufactory: createZero(),
    count_manufactureStaff: createZero(),
    bought_manaConduit: createZero(),
    bought_conduitConjugation: createZero(),
    bought_conjugationCreation: createZero(),
    bought_creationManufactory: createZero(),
    bought_manufactureStaff: createZero(),
    cost_manaConduit: createZero(),
    cost_conduitConjugation: createZero(),
    cost_conjugationCreation: createZero(),
    cost_creationManufactory: createZero(),
    cost_manufactureStaff: createZero(),
    multiplier_manaConduit: createZero(),
    multiplier_conduitConjugation: createZero(),
    multiplier_conjugationCreation: createZero(),
    multiplier_creationManufactory: createZero(),
    multiplier_manufactureStaff: createZero(),
    castSpeedTimer: createZero(),
    castSpeedMagnitude: createDecimal(1, 0, 1),
    castSpeedCost: createDecimal(1, 0, 1000),
    sealedMeridiansOwned: createZero(),
    sealedMeridians: createDecimal(1, 0, 1),
    sealMeridiansCost: createDecimal(1, 0, 1),
    sealedMeridiansSpeedEffect: createDecimal(1, 0, 1),
    matrixOwned: createZero(),
    matrixCost: createDecimal(1, 0, 10),
    matrixPower: createDecimal(1, 0, 0.5),
    matrixSpeedPower: createDecimal(1, 0, 2),
    empowerment_manaConduit: createZero(),
    empowerment_conduitConjugation: createZero(),
    empowerment_conjugationCreation: createZero(),
    empowerment_creationManufactory: createZero(),
    legacy_000: createZero(),
    cost_empowerment_manaConduit: createZero(),
    cost_empowerment_conduitConjugation: createZero(),
    cost_empowerment_conjugationCreation: createZero(),
    cost_empowerment_creationManufactory: createZero(),
    cost_empowerment_manufactureStaff: createZero(),
    purifiedMeridiansMultiplier: createDecimal(1, 0, 1),
    meridianPurificationEffect: createDecimal(1, 0, 1.01),
    meridianPurificationRequirement: createDecimal(1, 1, 45),
    courageTimer: createZero(),
    courageCooldown: createZero(),
    courageMultiplier: createDecimal(1, 0, 10),
    condensedMana: createZero(),
    coins: createZero(),
    guildRank: createZero(),
    activeQuest: createDecimal(-1, 0, 1),
    wolfineHealth: createZero(),
    combatShield: createZero(),
    combatShieldMaximum: createZero(),
    combatFreezeTurns: createZero(),
    fireballCost: createDecimal(1, 1, 40),
    whirlwindCost: createDecimal(1, 1, 80),
    freezeCost: createDecimal(1, 1, 120),
    inventoryWolfFur: createZero(),
    inventoryPotionOfSpeed: createZero(),
    inventoryWolfFurPosition: createDecimal(-1, 0, 1),
    inventoryPotionPosition: createDecimal(-1, 0, 1),
    potionSpeedTimer: createZero(),
};

/** [WASM] */

export const player: Player = {
    mana: 0,
    statistics_totalManaProduced: 0,
    statistics_totalTimePlayed: 0,
    statistics_gameTimePlayed: 0,
    statistics_totalClicks: 0,
    statistics_condensedManaProduced: 0,
    statistics_condenses: 0,
    statistics_timeThisCondense: 0,
    statistics_fastestCondense: 0,
    statistics_questsCompleted: 0,
    mana_circle_tier: 0,
    multiplier_currencyGlobal: 0,
    multiplier_timePlayedAchievement: 0,
    multiplier_tierOnePerPurchase: 0,
    constant_timeAchievementDivisor: 0,
    count_manaConduit: 0,
    count_conduitConjugation: 0,
    count_conjugationCreation: 0,
    count_creationManufactory: 0,
    count_manufactureStaff: 0,
    bought_manaConduit: 0,
    bought_conduitConjugation: 0,
    bought_conjugationCreation: 0,
    bought_creationManufactory: 0,
    bought_manufactureStaff: 0,
    cost_manaConduit: 0,
    cost_conduitConjugation: 0,
    cost_conjugationCreation: 0,
    cost_creationManufactory: 0,
    cost_manufactureStaff: 0,
    multiplier_manaConduit: 0,
    multiplier_conduitConjugation: 0,
    multiplier_conjugationCreation: 0,
    multiplier_creationManufactory: 0,
    multiplier_manufactureStaff: 0,
    castSpeedTimer: 0,
    castSpeedMagnitude: 0,
    castSpeedCost: 0,
    sealedMeridiansOwned: 0,
    sealedMeridians: 0,
    sealMeridiansCost: 0,
    sealedMeridiansSpeedEffect: 0,
    matrixOwned: 0,
    matrixCost: 0,
    matrixPower: 0,
    matrixSpeedPower: 0,
    empowerment_manaConduit: 0,
    empowerment_conduitConjugation: 0,
    empowerment_conjugationCreation: 0,
    empowerment_creationManufactory: 0,
    legacy_000: 0,
    cost_empowerment_manaConduit: 0,
    cost_empowerment_conduitConjugation: 0,
    cost_empowerment_conjugationCreation: 0,
    cost_empowerment_creationManufactory: 0,
    cost_empowerment_manufactureStaff: 0,
    purifiedMeridiansMultiplier: 0,
    meridianPurificationEffect: 0,
    meridianPurificationRequirement: 0,
    courageTimer: 0,
    courageCooldown: 0,
    courageMultiplier: 0,
    condensedMana: 0,
    coins: 0,
    guildRank: 0,
    activeQuest: 0,
    wolfineHealth: 0,
    combatShield: 0,
    combatShieldMaximum: 0,
    combatFreezeTurns: 0,
    fireballCost: 0,
    whirlwindCost: 0,
    freezeCost: 0,
    inventoryWolfFur: 0,
    inventoryPotionOfSpeed: 0,
    inventoryWolfFurPosition: 0,
    inventoryPotionPosition: 0,
    potionSpeedTimer: 0,
    meridianSealedThisReset: false,
    castSpeedUsedThisCondense: false,
    potionUsedThisCondense: false,
    boostedProducerThisCondense: false,
    combatUsedNonFreeze: false,
    courageUnlocked: false,
    hasCondensed: false,
    guildUnlocked: false,
    guildMember: false,
};

export function initializeCoreHandles(
    mana: i32,
    totalManaProduced: i32,
    totalTimePlayed: i32,
    gameTimePlayed: i32,
    totalClicks: i32,
    infinityBreakIndex: i32,
    globalMultiplier: i32,
    timePlayedMultiplier: i32,
    tierOnePerPurchase: i32,
    timeDivisor: i32,
): void {
    player.mana = mana;
    player.statistics_totalManaProduced = totalManaProduced;
    player.statistics_totalTimePlayed = totalTimePlayed;
    player.statistics_gameTimePlayed = gameTimePlayed;
    player.statistics_totalClicks = totalClicks;
    player.mana_circle_tier = infinityBreakIndex;
    player.multiplier_currencyGlobal = globalMultiplier;
    player.multiplier_timePlayedAchievement = timePlayedMultiplier;
    player.multiplier_tierOnePerPurchase = tierOnePerPurchase;
    player.constant_timeAchievementDivisor = timeDivisor;
}

export function initializeCondensedStatisticHandles(
    condensedManaProduced: i32,
    condenses: i32,
    timeThisCondense: i32,
    fastestCondense: i32,
): void {
    player.statistics_condensedManaProduced = condensedManaProduced;
    player.statistics_condenses = condenses;
    player.statistics_timeThisCondense = timeThisCondense;
    player.statistics_fastestCondense = fastestCondense;
}

export function initializeGuildStatisticHandles(questsCompleted: i32): void {
    player.statistics_questsCompleted = questsCompleted;
}

export function initializeTierOneHandles(
    a0: i32, a1: i32, a2: i32, a3: i32, a4: i32,
    b0: i32, b1: i32, b2: i32, b3: i32, b4: i32,
    c0: i32, c1: i32, c2: i32, c3: i32, c4: i32,
    m0: i32, m1: i32, m2: i32, m3: i32, m4: i32,
): void {
    player.count_manaConduit = a0;
    player.count_conduitConjugation = a1;
    player.count_conjugationCreation = a2;
    player.count_creationManufactory = a3;
    player.count_manufactureStaff = a4;
    player.bought_manaConduit = b0;
    player.bought_conduitConjugation = b1;
    player.bought_conjugationCreation = b2;
    player.bought_creationManufactory = b3;
    player.bought_manufactureStaff = b4;
    player.cost_manaConduit = c0;
    player.cost_conduitConjugation = c1;
    player.cost_conjugationCreation = c2;
    player.cost_creationManufactory = c3;
    player.cost_manufactureStaff = c4;
    player.multiplier_manaConduit = m0;
    player.multiplier_conduitConjugation = m1;
    player.multiplier_conjugationCreation = m2;
    player.multiplier_creationManufactory = m3;
    player.multiplier_manufactureStaff = m4;
}

export function initializeProgressionHandles(
    timer: i32, magnitude: i32, speedCost: i32,
    sealedMeridiansOwned: i32, sealedMeridians: i32, sealMeridiansCost: i32, sealedMeridiansEffect: i32,
    matrixOwned: i32, matrixCost: i32, matrixPower: i32, matrixEffect: i32,
): void {
    player.castSpeedTimer = timer;
    player.castSpeedMagnitude = magnitude;
    player.castSpeedCost = speedCost;
    player.sealedMeridiansOwned = sealedMeridiansOwned;
    player.sealedMeridians = sealedMeridians;
    player.sealMeridiansCost = sealMeridiansCost;
    player.sealedMeridiansSpeedEffect = sealedMeridiansEffect;
    player.matrixOwned = matrixOwned;
    player.matrixCost = matrixCost;
    player.matrixPower = matrixPower;
    player.matrixSpeedPower = matrixEffect;
}

export function initializeEmpowermentHandles(
    e0: i32, e1: i32, e2: i32, e3: i32, legacy: i32,
    c0: i32, c1: i32, c2: i32, c3: i32, c4: i32,
    purifiedMeridiansMultiplier: i32, meridianPurificationEffect: i32, meridianPurificationRequirement: i32,
): void {
    player.empowerment_manaConduit = e0;
    player.empowerment_conduitConjugation = e1;
    player.empowerment_conjugationCreation = e2;
    player.empowerment_creationManufactory = e3;
    player.legacy_000 = legacy;
    player.cost_empowerment_manaConduit = c0;
    player.cost_empowerment_conduitConjugation = c1;
    player.cost_empowerment_conjugationCreation = c2;
    player.cost_empowerment_creationManufactory = c3;
    player.cost_empowerment_manufactureStaff = c4;
    player.purifiedMeridiansMultiplier = purifiedMeridiansMultiplier;
    player.meridianPurificationEffect = meridianPurificationEffect;
    player.meridianPurificationRequirement = meridianPurificationRequirement;
}

export function initializeCourageHandles(timer: i32, cooldown: i32, multiplier: i32): void {
    player.courageTimer = timer;
    player.courageCooldown = cooldown;
    player.courageMultiplier = multiplier;
}

export function initializeCondensedManaHandle(condensedMana: i32): void {
    player.condensedMana = condensedMana;
}

export function initializeGuildHandles(
    coins: i32, rank: i32, activeQuest: i32, wolfineHealth: i32, shield: i32, shieldMaximum: i32, freezeTurns: i32,
    fireballCost: i32, whirlwindCost: i32, freezeCost: i32,
    wolfFur: i32, potionOfSpeed: i32, wolfFurPosition: i32, potionPosition: i32, potionSpeedTimer: i32,
): void {
    player.coins = coins;
    player.guildRank = rank;
    player.activeQuest = activeQuest;
    player.wolfineHealth = wolfineHealth;
    player.combatShield = shield;
    player.combatShieldMaximum = shieldMaximum;
    player.combatFreezeTurns = freezeTurns;
    player.fireballCost = fireballCost;
    player.whirlwindCost = whirlwindCost;
    player.freezeCost = freezeCost;
    player.inventoryWolfFur = wolfFur;
    player.inventoryPotionOfSpeed = potionOfSpeed;
    player.inventoryWolfFurPosition = wolfFurPosition;
    player.inventoryPotionPosition = potionPosition;
    player.potionSpeedTimer = potionSpeedTimer;
}

/** [/WASM] */

initializeCoreHandles(
    HANDLES.mana,
    HANDLES.statistics_totalManaProduced,
    HANDLES.statistics_totalTimePlayed,
    HANDLES.statistics_gameTimePlayed,
    HANDLES.statistics_totalClicks,
    HANDLES.mana_circle_tier,
    HANDLES.multiplier_currencyGlobal,
    HANDLES.multiplier_timePlayedAchievement,
    HANDLES.multiplier_tierOnePerPurchase,
    HANDLES.constant_timeAchievementDivisor,
);
initializeCondensedStatisticHandles(
    HANDLES.statistics_condensedManaProduced,
    HANDLES.statistics_condenses,
    HANDLES.statistics_timeThisCondense,
    HANDLES.statistics_fastestCondense,
);
initializeGuildStatisticHandles(HANDLES.statistics_questsCompleted);
initializeTierOneHandles(
    HANDLES.count_manaConduit, HANDLES.count_conduitConjugation, HANDLES.count_conjugationCreation,
    HANDLES.count_creationManufactory, HANDLES.count_manufactureStaff,
    HANDLES.bought_manaConduit, HANDLES.bought_conduitConjugation, HANDLES.bought_conjugationCreation,
    HANDLES.bought_creationManufactory, HANDLES.bought_manufactureStaff,
    HANDLES.cost_manaConduit, HANDLES.cost_conduitConjugation, HANDLES.cost_conjugationCreation,
    HANDLES.cost_creationManufactory, HANDLES.cost_manufactureStaff,
    HANDLES.multiplier_manaConduit, HANDLES.multiplier_conduitConjugation,
    HANDLES.multiplier_conjugationCreation, HANDLES.multiplier_creationManufactory,
    HANDLES.multiplier_manufactureStaff,
);
initializeProgressionHandles(
    HANDLES.castSpeedTimer, HANDLES.castSpeedMagnitude, HANDLES.castSpeedCost,
    HANDLES.sealedMeridiansOwned, HANDLES.sealedMeridians, HANDLES.sealMeridiansCost, HANDLES.sealedMeridiansSpeedEffect,
    HANDLES.matrixOwned, HANDLES.matrixCost, HANDLES.matrixPower, HANDLES.matrixSpeedPower,
);
initializeEmpowermentHandles(
    HANDLES.empowerment_manaConduit, HANDLES.empowerment_conduitConjugation,
    HANDLES.empowerment_conjugationCreation, HANDLES.empowerment_creationManufactory, HANDLES.legacy_000,
    HANDLES.cost_empowerment_manaConduit, HANDLES.cost_empowerment_conduitConjugation,
    HANDLES.cost_empowerment_conjugationCreation, HANDLES.cost_empowerment_creationManufactory,
    HANDLES.cost_empowerment_manufactureStaff, HANDLES.purifiedMeridiansMultiplier,
    HANDLES.meridianPurificationEffect, HANDLES.meridianPurificationRequirement,
);
initializeCourageHandles(HANDLES.courageTimer, HANDLES.courageCooldown, HANDLES.courageMultiplier);
initializeCondensedManaHandle(HANDLES.condensedMana);
initializeGuildHandles(
    HANDLES.coins, HANDLES.guildRank, HANDLES.activeQuest, HANDLES.wolfineHealth, HANDLES.combatShield, HANDLES.combatShieldMaximum, HANDLES.combatFreezeTurns,
    HANDLES.fireballCost, HANDLES.whirlwindCost, HANDLES.freezeCost,
    HANDLES.inventoryWolfFur, HANDLES.inventoryPotionOfSpeed,
    HANDLES.inventoryWolfFurPosition, HANDLES.inventoryPotionPosition, HANDLES.potionSpeedTimer,
);
