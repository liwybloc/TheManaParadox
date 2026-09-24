export const AUTOCASTER_NAMES = [
    "Wandrew",
    "Mana Lisa",
    "Staff Infection",
    "Castiel",
    "Merlin Monroe",
    "Spellvis Presley",
    "Abra Cadaniel",
    "The Wage Mage",
    "Hex Employee",
    "Conjurer Jeremy",
    "Wizard McWizardface",
    "Payroll the Wise",
    "Mana Maniac",
    "John Stick",
    "Witch Gaga",
    "Circuitsy Circuit",
] as const;

export const AUTOCASTER_TIERS = [
    { tier: 1, label: "Tier 1", hireCost: 2, sellPrice: 1, wage: 1 },
    { tier: 2, label: "Tier 2", hireCost: 5, sellPrice: 2, wage: 2 },
    { tier: 3, label: "Tier 3", hireCost: 10, sellPrice: 5, wage: 4 },
] as const;

export const AUTOCASTER_TASKS = [
    { id: 0, action: "Cast/Boost Mana Absorbers", minimumTier: 1, cooldown: 1, effects: ["Buys max", "Buys max and Empowers", "Buys max and Empowers; ×2 cooldown speed"] },
    { id: 1, action: "Cast/Boost Pylons", minimumTier: 1, cooldown: 1, effects: ["Buys max", "Buys max and Empowers", "Buys max and Empowers; ×2 cooldown speed"] },
    { id: 2, action: "Cast/Boost Conduits", minimumTier: 1, cooldown: 1, effects: ["Buys max", "Buys max and Empowers", "Buys max and Empowers; ×2 cooldown speed"] },
    { id: 3, action: "Cast/Boost Circuits", minimumTier: 1, cooldown: 1, effects: ["Buys max", "Buys max and Empowers", "Buys max and Empowers; ×2 cooldown speed"] },
    { id: 4, action: "Cast/Boost Meridians", minimumTier: 1, cooldown: 1, effects: ["Buys max", "Buys max", "Buys max; ×2 cooldown speed"] },
    { id: 5, action: "Condense", minimumTier: 2, cooldown: 30, effects: [null, "Condenses", "Condenses; ×2 cooldown speed"] },
    { id: 6, action: "Purify Meridians", minimumTier: 2, cooldown: 3, effects: [null, "Purifies Meridians", "Purifies Meridians; ×2 cooldown speed"] },
    { id: 7, action: "Seal Meridians", minimumTier: 1, cooldown: 3, effects: ["Seals Meridians", "Seals Meridians", "Seals Meridians; ×2 cooldown speed"] },
    { id: 8, action: "Conjure Crystal Matrix", minimumTier: 1, cooldown: 3, effects: ["Conjures a Matrix", "Conjures a Matrix", "Conjures a Matrix; ×2 cooldown speed"] },
    { id: 9, action: "Activate Courage", minimumTier: 2, cooldown: 5, effects: [null, "Activates Courage", "Activates Courage; ×2 cooldown speed"] },
    { id: 10, action: "Meditate", minimumTier: 2, cooldown: 1, effects: [null, "Meditates", "Meditates; ×2 cooldown speed"] },
] as const;

export const MAX_AUTOCASTERS = 9;
