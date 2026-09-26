import { createDecimal, createZero } from "./break_eternity.js";

export class Scratch {
    currencyGain: i32 = 0;
    tierOneSeconds: i32 = 0;
    tierOneProduction: i32 = 0;
    tierOneExponent: i32 = 0;
    manaExponent: i32 = 0;
    productionModifier: i32 = 0;
    purificationRelativeIncrease: i32 = 0;
    tierOneDisplayMultiplier: i32 = 0;
    tierOneCostAcceleration: i32 = 0;
    condenseGain: i32 = 0;
    gameSpeed: i32 = 0;
    effectiveGameSpeed: i32 = 0;
    manaPerSecond: i32 = 0;
    oomPerSecond: i32 = 0;
    updatesPerSecond: i32 = 0;
    enemyMaximumHealth: i32 = 0;
    memoryProductionMultiplier: i32 = 0;
    memoryProductionExponent: i32 = 0;
    memoryCrystalMultiplier: i32 = 0;
    crystal11HighestMultiplier: i32 = 0;
    crystal11TemporaryMultiplier: i32 = 0;
    crystal11CbrtExponent: i32 = 0;
    expCostIncreasesAt: i32 = 0;
    crystal12BoostTotal: i32 = 0;
    crystal12Power: i32 = 0;
    crystal13Elapsed: i32 = 0;
    crystal13Power: i32 = 0;
    crystal13CostBoostTotal: i32 = 0;
    crystal13CostPower: i32 = 0;
    crystal13RewardPurchases: i32 = 0;
    crystal13RewardPower: i32 = 0;
    remembranceCostFormat: i32 = 0;
    remembranceCostExponent: i32 = 0;
    remembranceCost: i32 = 0;

    D10000: i32 = 0;
    D0_1: i32 = 0;
    D0_95: i32 = 0;
    D1_1: i32 = 0;
    D1_25: i32 = 0;
    D1_04: i32 = 0;
}

const Z = createZero;
const D = createDecimal;

export const SCRATCH_HANDLES: Scratch = {
    currencyGain: Z(),
    tierOneSeconds: Z(),
    tierOneProduction: Z(),
    tierOneExponent: Z(),
    manaExponent: Z(),
    productionModifier: Z(),
    purificationRelativeIncrease: Z(),
    tierOneDisplayMultiplier: D(1, 0, 1),
    tierOneCostAcceleration: Z(),
    condenseGain: Z(),
    gameSpeed: D(1, 0, 1),
    effectiveGameSpeed: D(1, 0, 1),
    manaPerSecond: Z(),
    oomPerSecond: Z(),
    updatesPerSecond: Z(),
    enemyMaximumHealth: Z(),
    memoryProductionMultiplier: Z(),
    memoryProductionExponent: Z(),
    memoryCrystalMultiplier: Z(),
    crystal11HighestMultiplier: Z(),
    crystal11TemporaryMultiplier: Z(),
    crystal11CbrtExponent: Z(),
    expCostIncreasesAt: Z(),
    crystal12BoostTotal: Z(),
    crystal12Power: Z(),
    crystal13Elapsed: Z(),
    crystal13Power: Z(),
    crystal13CostBoostTotal: Z(),
    crystal13CostPower: Z(),
    crystal13RewardPurchases: Z(),
    crystal13RewardPower: Z(),
    remembranceCostFormat: Z(),
    remembranceCostExponent: Z(),
    remembranceCost: Z(),
    
    D10000: D(1, 0, 10000),
    D0_1: D(1, 0, 0.1),
    D0_95: D(1, 0, 0.95),
    D1_1: D(1, 0, 1.1),
    D1_25: D(1, 0, 1.25),
    D1_04: D(1, 0, 1.04),
};

/** [WASM] */

export const scratch = new Scratch();

export function initializeScratch(
    currencyGain: i32, tierOneSeconds: i32, tierOneProduction: i32, tierOneExponent: i32, manaExponent: i32,
    productionModifier: i32, purificationRelativeIncrease: i32, tierOneDisplayMultiplier: i32,
    tierOneCostAcceleration: i32, condenseGain: i32, gameSpeed: i32, effectiveGameSpeed: i32,
    manaPerSecond: i32, oomPerSecond: i32, updatesPerSecond: i32, enemyMaximumHealth: i32,
    memoryProductionMultiplier: i32, memoryProductionExponent: i32, memoryCrystalMultiplier: i32,
    crystal11HighestMultiplier: i32, crystal11TemporaryMultiplier: i32, crystal11CbrtExponent: i32,
    expCostIncreasesAt: i32, crystal12BoostTotal: i32, crystal12Power: i32, crystal13Elapsed: i32,
    crystal13Power: i32, crystal13CostBoostTotal: i32, crystal13CostPower: i32,
    crystal13RewardPurchases: i32, crystal13RewardPower: i32,
    remembranceCostFormat: i32, remembranceCostExponent: i32, remembranceCost: i32,
    D10000: i32, D0_1: i32, D0_95: i32, D1_1: i32, D1_25: i32, D1_04: i32,
): void {
    scratch.currencyGain = currencyGain;
    scratch.tierOneSeconds = tierOneSeconds;
    scratch.tierOneProduction = tierOneProduction;
    scratch.tierOneExponent = tierOneExponent;
    scratch.manaExponent = manaExponent;
    scratch.productionModifier = productionModifier;
    scratch.purificationRelativeIncrease = purificationRelativeIncrease;
    scratch.tierOneDisplayMultiplier = tierOneDisplayMultiplier;
    scratch.tierOneCostAcceleration = tierOneCostAcceleration;
    scratch.condenseGain = condenseGain;
    scratch.gameSpeed = gameSpeed;
    scratch.effectiveGameSpeed = effectiveGameSpeed;
    scratch.manaPerSecond = manaPerSecond;
    scratch.oomPerSecond = oomPerSecond;
    scratch.updatesPerSecond = updatesPerSecond;
    scratch.enemyMaximumHealth = enemyMaximumHealth;
    scratch.memoryProductionMultiplier = memoryProductionMultiplier;
    scratch.memoryProductionExponent = memoryProductionExponent;
    scratch.memoryCrystalMultiplier = memoryCrystalMultiplier;
    scratch.crystal11HighestMultiplier = crystal11HighestMultiplier;
    scratch.crystal11TemporaryMultiplier = crystal11TemporaryMultiplier;
    scratch.crystal11CbrtExponent = crystal11CbrtExponent;
    scratch.expCostIncreasesAt = expCostIncreasesAt;
    scratch.crystal12BoostTotal = crystal12BoostTotal;
    scratch.crystal12Power = crystal12Power;
    scratch.crystal13Elapsed = crystal13Elapsed;
    scratch.crystal13Power = crystal13Power;
    scratch.crystal13CostBoostTotal = crystal13CostBoostTotal;
    scratch.crystal13CostPower = crystal13CostPower;
    scratch.crystal13RewardPurchases = crystal13RewardPurchases;
    scratch.crystal13RewardPower = crystal13RewardPower;
    scratch.remembranceCostFormat = remembranceCostFormat;
    scratch.remembranceCostExponent = remembranceCostExponent;
    scratch.remembranceCost = remembranceCost;
    scratch.D10000 = D10000;
    scratch.D0_1 = D0_1;
    scratch.D0_95 = D0_95;
    scratch.D1_1 = D1_1;
    scratch.D1_25 = D1_25;
    scratch.D1_04 = D1_04;
}

/** [/WASM] */

const scratchValues = Object.values(SCRATCH_HANDLES);
initializeScratch(
    scratchValues[0],  scratchValues[1],  scratchValues[2],  scratchValues[3],  scratchValues[4],
    scratchValues[5],  scratchValues[6],  scratchValues[7],  scratchValues[8],  scratchValues[9],
    scratchValues[10], scratchValues[11], scratchValues[12], scratchValues[13], scratchValues[14],
    scratchValues[15], scratchValues[16], scratchValues[17], scratchValues[18], scratchValues[19],
    scratchValues[20], scratchValues[21], scratchValues[22], scratchValues[23], scratchValues[24],
    scratchValues[25], scratchValues[26], scratchValues[27], scratchValues[28], scratchValues[29],
    scratchValues[30], scratchValues[31], scratchValues[32], scratchValues[33], scratchValues[34],
    scratchValues[35], scratchValues[36], scratchValues[37], scratchValues[38], scratchValues[39],
);
