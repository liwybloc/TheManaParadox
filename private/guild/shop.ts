export const GUILD_SHOP_UPGRADES = [
    { id: 0, rank: 0, title: "Potions last ×2 longer", cost: 25 },
    { id: 1, rank: 0, title: "Mana is increased by 100%", cost: 50 },
    { id: 2, rank: 0, title: "Unlock a 4th quest slot", cost: 100 },
    { id: 3, rank: 1, title: "Potions are ×1.5 stronger", cost: 125 },
    { id: 4, rank: 1, title: "Unlock a 5th quest slot", cost: 175 },
    { id: 5, rank: 1, title: "Unlock equipment (TBA)", cost: 250 },
    { id: 6, rank: 2, title: "Unlock a 6th quest slot", cost: 325 },
    { id: 7, rank: 2, title: "Unlock Auto-Casters", cost: 100, unobtainable: true },
    { id: 8, rank: 2, title: "Open the Gate", cost: 10000 },
] as const;
