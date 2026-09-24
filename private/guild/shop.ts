export const GUILD_SHOP_UPGRADES = [
    { id: 0, rank: 0, title: "Potions last ×2 longer", cost: 20 },
    { id: 7, rank: 0, title: "Unlock Autocasters", cost: 75 },
    { id: 2, rank: 0, title: "Unlock a 4th quest slot", cost: 80 },
    { id: 3, rank: 1, title: "Potions are ×1.5 stronger", cost: 100 },
    { id: 4, rank: 1, title: "Unlock a 5th quest slot", cost: 125 },
    { id: 5, rank: 1, title: "Unlock equipment", cost: 200 },
    { id: 6, rank: 2, title: "Unlock a 6th quest slot", cost: 300 },
    { id: 1, rank: 2, title: "Mana is increased by ×2", cost: 100 },
    { id: 8, rank: 2, title: "Open the Gate (TBA)", cost: 10_000, unobtainable: true },
    { id: 9, rank: 3, title: "Unlock Spell Scroll: Lightning", cost: 250 },
    { id: 10, rank: 3, title: "Unlock Spell Scroll: Meteor", cost: 500 },
    { id: 11, rank: 3, title: "Unlock Spell Scroll: Arcane Nova", cost: 750 },
] as const;
