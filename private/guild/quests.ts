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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "2-3"
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
			amount: "1-3"
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
    { id: 17, rank: 2, title: "Hunt Wyrms", monster: "Wyrms", description: "Hunt the young wyrms circling the mountain pass.", rewards: [{ item: Items.MANA_CORE, amount: "1-2" }, { item: Items.WYRM_SCALE, amount: "1-3" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 18, rank: 2, title: "Defeat Trolls", monster: "Trolls", description: "Defeat the trolls occupying a Guild bridge.", rewards: [{ item: Items.DIRE_WOLFINE_FUR, amount: "1-2" }, { item: Items.TROLL_HEART, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 19, rank: 2, title: "Dispel Phantoms", monster: "Phantoms", description: "Dispel the phantoms haunting an old watchtower.", rewards: [{ item: Items.GLOWSTONE, amount: "1-3" }, { item: Items.PHANTOM_SILK, amount: "1-3" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 20, rank: 2, title: "Shatter Arcane Constructs", monster: "Arcane Constructs", description: "Shatter unstable constructs beneath the Guild.", rewards: [{ item: Items.REDSTONE, amount: "1-3" }, { item: Items.ARCANE_CRYSTAL, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 21, rank: 2, title: "Raid a Draconic Lair", monster: "Drakes", description: "Drive the drakes from a newly discovered lair.", rewards: [{ item: Items.MANA_CORE, amount: "1-2" }, { item: Items.DRAGON_GLASS, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 22, rank: 3, title: "Break a Wolfine Horde", monster: "Horde of Wolfines", description: "Break a vast Wolfine horde before it reaches the Guild.", rewards: [{ item: Items.WOLFINE_FUR, amount: "10-20" }, { item: Items.DIRE_WOLFINE_FUR, amount: "3-6" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 23, rank: 3, title: "Drive Back Elder Trolls", monster: "Elder Trolls", description: "Drive a band of elder trolls from the mountain road.", rewards: [{ item: Items.TROLL_HEART, amount: "3-6" }, { item: Items.OLD_BONE, amount: "8-14" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 24, rank: 3, title: "Disperse a Wisp Tempest", monster: "Wisp Tempest", description: "Disperse a storm of wisps tearing through the mana wells.", rewards: [{ item: Items.WISP_ESSENCE, amount: "8-15" }, { item: Items.ENCHANTED_THREAD, amount: "1-2" }, { item: Items.POTION_SPEED_III, amount: "1-3" }] },
    { id: 25, rank: 3, title: "Shatter a Golem Siege", monster: "Mana Golem Siege", description: "Shatter a formation of reinforced mana golems.", rewards: [{ item: Items.MANA_CORE, amount: "4-8" }, { item: Items.REDSTONE, amount: "5-10" }, { item: Items.GLOWSTONE, amount: "5-10" }] },
    { id: 26, rank: 3, title: "Hunt a Drake Brood", monster: "Drake Brood", description: "Hunt a brood of drakes nesting above the pass.", rewards: [{ item: Items.DRAGON_GLASS, amount: "4-8" }, { item: Items.WYRM_SCALE, amount: "5-10" }, { item: Items.POTION_SPEED_III, amount: "2-4" }] },
    { id: 27, rank: 4, title: "Stop a Wolfine Stampede", monster: "Wolfine Stampede", description: "Stop an enormous stampede of dire Wolfines.", rewards: [{ item: Items.WOLFINE_FUR, amount: "25-50" }, { item: Items.DIRE_WOLFINE_FUR, amount: "8-14" }, { item: Items.POTION_SPEED_III, amount: "3-6" }] },
    { id: 28, rank: 4, title: "Banish a Phantom Legion", monster: "Phantom Legion", description: "Banish a legion marching out of a ruined fortress.", rewards: [{ item: Items.PHANTOM_SILK, amount: "8-15" }, { item: Items.SOUL_FRAGMENT, amount: "1-3" }, { item: Items.GLOWSTONE, amount: "10-18" }] },
    { id: 29, rank: 4, title: "Purge a Wyrm Nest", monster: "Wyrm Nest", description: "Purge a sprawling nest of mature wyrms.", rewards: [{ item: Items.WYRM_SCALE, amount: "10-18" }, { item: Items.DRAGON_GLASS, amount: "6-12" }, { item: Items.POTION_SPEED_III, amount: "3-6" }] },
    { id: 30, rank: 4, title: "Destroy an Arcane Colossus", monster: "Arcane Colossus", description: "Destroy a colossal construct powered by unstable crystals.", rewards: [{ item: Items.ARCANE_CRYSTAL, amount: "6-12" }, { item: Items.MANA_CORE, amount: "8-14" }, { item: Items.ENCHANTED_THREAD, amount: "2-4" }] },
    { id: 31, rank: 4, title: "Break the Witch Coven", monster: "Grand Witch Coven", description: "Break a coven channeling mana across the countryside.", rewards: [{ item: Items.REDSTONE, amount: "15-30" }, { item: Items.GLOWSTONE, amount: "15-30" }, { item: Items.POTION_SPEED_III, amount: "4-8" }] },
    { id: 32, rank: 5, title: "Survive the Endless Pack", monster: "Endless Wolfine Pack", description: "Survive a seemingly endless tide of empowered Wolfines.", rewards: [{ item: Items.WOLFINE_FUR, amount: "60-100" }, { item: Items.DIRE_WOLFINE_FUR, amount: "20-35" }, { item: Items.POTION_SPEED_III, amount: "8-12" }] },
    { id: 33, rank: 5, title: "Slay an Ancient Dragon", monster: "Ancient Dragon", description: "Slay an ancient dragon awakened beneath the mountains.", rewards: [{ item: Items.DRAGON_HEART, amount: "1" }, { item: Items.DRAGON_GLASS, amount: "15-25" }, { item: Items.WYRM_SCALE, amount: "20-30" }] },
    { id: 34, rank: 5, title: "Defeat the Phantom Court", monster: "Phantom Court", description: "Defeat the spectral court ruling a city of the dead.", rewards: [{ item: Items.SOUL_FRAGMENT, amount: "4-8" }, { item: Items.PHANTOM_SILK, amount: "20-35" }, { item: Items.ARCANE_CRYSTAL, amount: "10-18" }] },
    { id: 35, rank: 5, title: "Shatter the Living Mountain", monster: "Living Mountain", description: "Shatter a mountain animated by ancient runes.", rewards: [{ item: Items.ROCKLING_SHARD, amount: "30-50" }, { item: Items.ARCANE_CRYSTAL, amount: "15-25" }, { item: Items.ENCHANTED_THREAD, amount: "6-10" }] },
    { id: 36, rank: 5, title: "Disable the Mana Titan", monster: "Mana Titan", description: "Disable a city-sized mana construct before it overloads.", rewards: [{ item: Items.MANA_CORE, amount: "20-35" }, { item: Items.REDSTONE, amount: "30-50" }, { item: Items.GLOWSTONE, amount: "30-50" }] },
];

export const GUILD_QUESTS_BY_ID = new Map(GUILD_QUESTS.map((quest) => [quest.id, quest]));
import { Items } from "./items.js";
