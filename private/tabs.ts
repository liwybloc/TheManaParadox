export const TABS = [
    {
        id: "mana",
        label: "Mana",
        icon: "✦",
        subtabs: [{ id: "basic-spells", label: "Basic Spells" }],
    },
    {
        id: "condensed",
        label: "Condensed",
        icon: "◆",
        requiresCondensed: true,
        subtabs: [
            { id: "condensed-upgrades", label: "Condensed Upgrades" },
            { id: "expand-mana-circle", label: "Expand Mana Circle" },
        ],
    },
    { id: "achievements", label: "Achievements", icon: "★" },
    { id: "statistics", label: "Statistics", icon: "▤" },
    {
        id: "options",
        label: "Options",
        icon: "⚙",
        subtabs: [
            { id: "general", label: "General" },
            { id: "visuals", label: "Visuals" },
        ],
    },
];
