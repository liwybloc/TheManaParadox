export interface InventoryItemUse {
    readonly label: string;
    readonly action: string;
    readonly enabled: boolean;
}

export interface InventoryItemDefinition {
    readonly id: number;
    readonly name: string;
    readonly description: string;
    readonly width: number;
    readonly height: number;
    readonly style: string;
    readonly sellPrice: readonly [number, number];
    readonly use?: InventoryItemUse;
}

export function resolveItemDescription(
    description: string,
    placeholders: Readonly<Record<string, string | number>>,
): string {
    return description.replace(/\{([A-Za-z0-9_]+)\}/g, (token, key) => String(placeholders[key] ?? token));
}

export enum Items {
    POTION_SPEED_I = 2,
    POTION_SPEED_II = 19,

    WOLFINE_FUR = 1,
    SLIME_BALL = 3,
    GOBLIN_EAR = 4,
    GIANT_RAT_TAIL = 5,
    WISP_ESSENCE = 6,
    OLD_BONE = 7,
    CAVE_BAT_WING = 8,
    SPRIGGAN_TWIG = 9,
    ROCKLING_SHARD = 10,
    SHADE_RESIDUE = 11,
    MIRE_TOAD_GLAND = 12,
    OGRE_TOOTH = 13,
    DIRE_WOLFINE_FUR = 14,
    HARPY_FEATHER = 15,
    MANA_CORE = 16,
    REDSTONE = 17,
    GLOWSTONE = 18,
    POTION_SPEED_III = 20,
    WYRM_SCALE = 21,
    TROLL_HEART = 22,
    PHANTOM_SILK = 23,
    ARCANE_CRYSTAL = 24,
    DRAGON_GLASS = 25,
}

type InventoryItemData = Omit<InventoryItemDefinition, "sellPrice">;

const HIGH_TIER_ITEMS = new Set<number>([Items.POTION_SPEED_II, Items.MANA_CORE, Items.REDSTONE, Items.GLOWSTONE, Items.POTION_SPEED_III, Items.WYRM_SCALE, Items.TROLL_HEART, Items.PHANTOM_SILK, Items.ARCANE_CRYSTAL, Items.DRAGON_GLASS]);
const MID_TIER_ITEMS = new Set<number>([Items.OGRE_TOOTH, Items.DIRE_WOLFINE_FUR, Items.HARPY_FEATHER]);

function sellPriceFor(item: number): readonly [number, number] {
    if (HIGH_TIER_ITEMS.has(item)) return [2, 5];
    if (MID_TIER_ITEMS.has(item)) return [2, 3];
    return [1, 2];
}

const INVENTORY_ITEM_DATA: readonly InventoryItemData[] = [
	{
		id: Items.POTION_SPEED_I,
		name: "Potion of Speed",
		description: "Boosts game speed by +{effect}× for {duration} seconds",
		width: 1,
		height: 1,
		style: "potion-speed",
		use: {
			label: "Drink",
			action: "drink-speed-potion",
			enabled: true,
		},
	},
    {
		id: Items.POTION_SPEED_II,
		name: "Potion of Speed II",
		description: "Boosts game speed by +{effect}× for {duration} seconds",
		width: 1,
		height: 1,
		style: "potion-speed",
		use: {
			label: "Drink",
			action: "drink-speed-potion",
			enabled: true,
		},
	},
    {
        id: Items.POTION_SPEED_III,
        name: "Potion of Speed III",
        description: "Boosts game speed by +{effect}× for {duration} seconds",
        width: 1,
        height: 1,
        style: "potion-speed",
        use: { label: "Drink", action: "drink-speed-potion", enabled: true },
    },
    {
		id: Items.WOLFINE_FUR,
		name: "Wolfine Fur",
		description: "Soft fur taken from a defeated Wolfine.",
		width: 2,
		height: 1,
		style: "wolfine-fur",
    },
	{
		id: Items.SLIME_BALL,
		name: "Slime Ball",
		description: "A wobbling clump left behind by a slime.",
		width: 1,
		height: 1,
		style: "slime-ball"
	},
	{
		id: Items.GOBLIN_EAR,
		name: "Goblin Ear",
		description: "Proof that a goblin was driven from the road.",
		width: 1,
		height: 1,
		style: "goblin-ear"
	},
	{
		id: Items.GIANT_RAT_TAIL,
		name: "Giant Rat Tail",
		description: "A surprisingly sturdy giant rat tail.",
		width: 2,
		height: 2,
		style: "rat-tail"
	},
	{
		id: Items.WISP_ESSENCE,
		name: "Wisp Essence",
		description: "Faint mana gathered from a dispersed wisp.",
		width: 1,
		height: 2,
		style: "wisp-essence"
	},
	{
		id: Items.OLD_BONE,
		name: "Old Bone",
		description: "A bone recovered from a defeated skeleton.",
		width: 1,
		height: 1,
		style: "old-bone"
	},
	{
		id: Items.CAVE_BAT_WING,
		name: "Cave Bat Wing",
		description: "A leathery wing from a cave bat.",
		width: 1,
		height: 1,
		style: "bat-wing"
	},
	{
		id: Items.SPRIGGAN_TWIG,
		name: "Spriggan Twig",
		description: "A living twig cut from a spriggan.",
		width: 1,
		height: 1,
		style: "spriggan-twig"
	},
	{
		id: Items.ROCKLING_SHARD,
		name: "Rockling Shard",
		description: "A sharp fragment of animated stone.",
		width: 1,
		height: 1,
		style: "rockling-shard"
	},
	{
		id: Items.SHADE_RESIDUE,
		name: "Shade Residue",
		description: "Cold residue left by a banished shade.",
		width: 1,
		height: 1,
		style: "shade-residue"
	},
	{
		id: Items.MIRE_TOAD_GLAND,
		name: "Mire Toad Gland",
		description: "An alchemical gland from a mire toad.",
		width: 1,
		height: 1,
		style: "toad-gland"
	},
	{
		id: Items.OGRE_TOOTH,
		name: "Ogre Tooth",
		description: "A heavy tooth from a defeated ogre.",
		width: 2,
		height: 2,
		style: "ogre-tooth"
	},
	{
		id: Items.DIRE_WOLFINE_FUR,
		name: "Dire Wolfine Fur",
		description: "Dense fur from a dire Wolfine.",
		width: 3,
		height: 2,
		style: "dire-wolfine-fur"
	},
	{
		id: Items.HARPY_FEATHER,
		name: "Harpy Feather",
		description: "A long feather carrying a trace of wind mana.",
		width: 3,
		height: 1,
		style: "harpy-feather"
	},
	{
		id: Items.MANA_CORE,
		name: "Mana Core",
		description: "The condensed core of a disabled mana golem.",
		width: 2,
		height: 2,
		style: "mana-core"
	},
	{
		id: Items.REDSTONE,
		name: "Redstone",
		description: "Crimson magical dust carried by witches.",
		width: 1,
		height: 1,
		style: "redstone"
	},
	{
		id: Items.GLOWSTONE,
		name: "Glowstone",
		description: "Warm luminous dust carried by witches.",
		width: 1,
		height: 1,
		style: "glowstone"
	},
    { id: Items.WYRM_SCALE, name: "Wyrm Scale", description: "A resilient scale from a young wyrm.", width: 2, height: 2, style: "wyrm-scale" },
    { id: Items.TROLL_HEART, name: "Troll Heart", description: "A dense heart steeped in regenerative mana.", width: 2, height: 2, style: "troll-heart" },
    { id: Items.PHANTOM_SILK, name: "Phantom Silk", description: "Nearly weightless silk left by a phantom.", width: 2, height: 1, style: "phantom-silk" },
    { id: Items.ARCANE_CRYSTAL, name: "Arcane Crystal", description: "A crystal saturated with refined magic.", width: 1, height: 2, style: "arcane-crystal" },
    { id: Items.DRAGON_GLASS, name: "Dragon Glass", description: "Heat-fused glass from a draconic lair.", width: 2, height: 1, style: "dragon-glass" },
];

export const INVENTORY_ITEMS: readonly InventoryItemDefinition[] = INVENTORY_ITEM_DATA.map((item) => ({
    ...item,
    sellPrice: sellPriceFor(item.id),
}));

export const INVENTORY_ITEMS_BY_ID = new Map(INVENTORY_ITEMS.map((item) => [item.id, item]));
