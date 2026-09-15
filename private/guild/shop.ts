export const GUILD_SHOP_UPGRADES = [
    { id: 0, rank: 0, title: "Potions last ×2 longer", cost: 20 },
    { id: 1, rank: 0, title: "Mana is increased by 100%", cost: 40 },
    { id: 2, rank: 0, title: "Unlock a 4th quest slot", cost: 80 },
    { id: 3, rank: 1, title: "Potions are ×1.5 stronger", cost: 100 },
    { id: 4, rank: 1, title: "Unlock a 5th quest slot", cost: 125 },
    { id: 5, rank: 1, title: "Unlock equipment (TBA)", cost: 200, unobtainable: true },
    { id: 6, rank: 2, title: "Unlock a 6th quest slot", cost: 300 },
    { id: 7, rank: 2, title: "Unlock Auto-Casters", cost: 75 },
    { id: 8, rank: 2, title: "Open the Gate (TBA)", cost: 10000, unobtainable: true },
] as const;
