export interface GuildQuestDefinition {
    readonly id: number;
    readonly rank: number;
    readonly title: string;
    readonly monster: string;
    readonly description: string;
    readonly rewards: readonly { readonly item: number; readonly amount: string }[];
}

export const GUILD_QUESTS: readonly GuildQuestDefinition[] = [
    {
		id: 0,
		rank: 0,
		title: "Fight Wolfines",
		monster: "Wolfines",
		description: "Defeat a pack of three Wolfines.",
		rewards: [{
			item: Items.WOLFINE_FUR,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "1-2"
		}]
	},
	{
		id: 1,
		rank: 0,
		title: "Fight Wolfines",
		monster: "Wolfines",
		description: "Defeat a pack of three Wolfines.",
		rewards: [{
			item: Items.WOLFINE_FUR,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "1-2"
		}]
	},
	{
		id: 2,
		rank: 0,
		title: "Fight Wolfines",
		monster: "Wolfines",
		description: "Defeat a pack of three Wolfines.",
		rewards: [{
			item: Items.WOLFINE_FUR,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "1-2"
		}]
	},
	{
		id: 3,
		rank: 0,
		title: "Hunt Giant Rats",
		monster: "Giant Rats",
		description: "Remove the giant rats beneath the Guild hall.",
		rewards: [{
			item: Items.GIANT_RAT_TAIL,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 4,
		rank: 0,
		title: "Repel Wisps",
		monster: "Wisps",
		description: "Disperse the wisps gathering near the mana wells.",
		rewards: [{
			item: Items.WISP_ESSENCE,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 5,
		rank: 0,
		title: "Break Skeletons",
		monster: "Skeletons",
		description: "Put a wandering skeleton patrol back to rest.",
		rewards: [{
			item: 7,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 6,
		rank: 0,
		title: "Chase Cave Bats",
		monster: "Cave Bats",
		description: "Clear the Guild's supply tunnels of cave bats.",
		rewards: [{
			item: 8,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 7,
		rank: 0,
		title: "Defeat Spriggans",
		monster: "Spriggans",
		description: "Stop the spriggans tangling the western trail.",
		rewards: [{
			item: 9,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 8,
		rank: 0,
		title: "Crush Rocklings",
		monster: "Rocklings",
		description: "Break apart the rocklings blocking the quarry.",
		rewards: [{
			item: 10,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 9,
		rank: 0,
		title: "Banish Shades",
		monster: "Shades",
		description: "Banish the shades haunting a nearby ruin.",
		rewards: [{
			item: 11,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 10,
		rank: 0,
		title: "Clear Slimes",
		monster: "Slimes",
		description: "Clear a cluster of mana-fed slimes.",
		rewards: [{
			item: 3,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 11,
		rank: 0,
		title: "Scatter Goblins",
		monster: "Goblins",
		description: "Drive a goblin band away from the road.",
		rewards: [{
			item: 4,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_I,
			amount: "0-1"
		}]
	},
	{
		id: 12,
		rank: 1,
		title: "Slay an Ogre",
		monster: "Ogre",
		description: "Bring down an ogre raiding Guild caravans.",
		rewards: [{
			item: 13,
			amount: "1-2"
		}, {
			item: Items.POTION_SPEED_II,
			amount: "0-2"
		}]
	},
	{
		id: 13,
		rank: 1,
		title: "Hunt Dire Wolfines",
		monster: "Dire Wolfines",
		description: "Hunt a stronger pack led by a dire Wolfine.",
		rewards: [{
			item: 14,
			amount: "2-4"
		}, {
			item: Items.POTION_SPEED_II,
			amount: "2-4"
		}]
	},
	{
		id: 14,
		rank: 1,
		title: "Silence Harpies",
		monster: "Harpies",
		description: "Silence the harpies nesting above the pass.",
		rewards: [{
			item: 15,
			amount: "1-3"
		}, {
			item: Items.POTION_SPEED_II,
			amount: "1-3"
		}]
	},
	{
		id: 15,
		rank: 1,
		title: "Defeat a Mana Golem",
		monster: "Mana Golem",
		description: "Disable a mana golem that has lost control.",
		rewards: [{
			item: 16,
			amount: "1"
		}, {
			item: Items.POTION_SPEED_II,
			amount: "1-3"
		}]
	},
	{
		id: 16,
		rank: 1,
		title: "Fight Witches",
		monster: "Witches",
		description: "Defeat the witches gathering magical dust.",
		rewards: [{
			item: Items.REDSTONE,
			amount: "0-2"
		}, {
			item: Items.GLOWSTONE,
			amount: "0-2"
		}, {
            item: Items.POTION_SPEED_II,
            amount: "1-3",
        }]
	},
    { id: 17, rank: 2, title: "Hunt Wyrms", monster: "Wyrms", description: "Hunt the young wyrms circling the mountain pass.", rewards: [{ item: Items.MANA_CORE, amount: "1-2" }, { item: Items.WYRM_SCALE, amount: "1-3" }, { item: Items.POTION_SPEED_III, amount: "0-2" }] },
    { id: 18, rank: 2, title: "Defeat Trolls", monster: "Trolls", description: "Defeat the trolls occupying a Guild bridge.", rewards: [{ item: Items.DIRE_WOLFINE_FUR, amount: "1-2" }, { item: Items.TROLL_HEART, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "0-2" }] },
    { id: 19, rank: 2, title: "Dispel Phantoms", monster: "Phantoms", description: "Dispel the phantoms haunting an old watchtower.", rewards: [{ item: Items.GLOWSTONE, amount: "1-3" }, { item: Items.PHANTOM_SILK, amount: "1-3" }, { item: Items.POTION_SPEED_III, amount: "0-2" }] },
    { id: 20, rank: 2, title: "Shatter Arcane Constructs", monster: "Arcane Constructs", description: "Shatter unstable constructs beneath the Guild.", rewards: [{ item: Items.REDSTONE, amount: "1-3" }, { item: Items.ARCANE_CRYSTAL, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "0-2" }] },
    { id: 21, rank: 2, title: "Raid a Draconic Lair", monster: "Drakes", description: "Drive the drakes from a newly discovered lair.", rewards: [{ item: Items.MANA_CORE, amount: "1-2" }, { item: Items.DRAGON_GLASS, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "1-2" }] },
];

export const GUILD_QUESTS_BY_ID = new Map(GUILD_QUESTS.map((quest) => [quest.id, quest]));
import { Items } from "./items.js";
