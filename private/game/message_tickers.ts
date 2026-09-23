import { namedWasm } from "../../generated/_wasm$globals.js";

const REAL_NEWS_ACHIEVEMENT_INDEX = 13;
const REAL_NEWS_MESSAGE_COUNT = 50;

const BASE_MESSAGE_TICKERS = [
    "yay another incremental",
    "probably should buy something",
    "this is progress, apparently",
    "the mana demands more mana",
    "the Kernel Corn situation is crazy...",
    "living in the mana dimension must be crazy because you need x10 more mana to make something x2 boosted",
    "at first i thought this was gibberish, then i realized it was actually written in parkour",
    "I be ponderin my orb",
    "mrawo :3",
    "Mr. Layer? Congrats, you're always on the list!",
    "woah, i see a horizon appearing! like some sort of.. New Horizons!",
    "i wish my brain looked like a potato",
    "you ever just smell like vegetables?",
    "Hello Scarlet, what do you want?",
    "what do you want... do you want pets?",
    "oh you want food? you...",
    "this is not newsticker suggestions",
    "shame on your dog",
    "i see a little silhouette of a wizard. lily! lily! can you do the next mana circle update please...",
    "im gay but no one will know because this text is written in mana",
    "free mrbest $2,000 give way!!",
    "bwaaa",
    "bwaaaa",
    "abwa",
    "bwa",
    "\"what does this upgrade do\" isn't it obvious",
    "avaritia aint got nuthin' on mana paradox",
    "why do you always pick the female characters? Cuz i like girls duh",
    "marlo marid is outdated :pensive:",
    ":fatfuc:",
    "did you know that this message will be removed in v0.1.0",
    "how tall really is the ascension hall?",
    "Stop larping, The Mana Paradox. We won't give you leaks.",
    "Welcome to the AntiMatter Zone. Only break infinity inside anti-dimensions",
    "oh my god they killed kenny",
    "Beware of the man who speaks in timewalls",
    "i am very original",
    "HERETIC ARRESTED AFTER SPEAKING BLASPHEMY OF USING STORED TIME TO OVERCOME THE 5 HOUR BARRIER!!",
    "I think we need to abandon the idea of getting to infinity.",
    "Click this for 50 antimatter",
    "user reportedly forgot to purify meridians before condensing",
    "Fun fact: 100% of deaths are caused by loss of life!",
    "Local man discovers mana. Soon undiscovers it due to bain damge...",
    "that's right, it goes in the main branch!",
    "we are on our way home",
    "This is the story of how I reincarnated in Ancient China",
    "Dewordle at the De-pixel",
    "name ten dust particles",
    "wordle in 7",
    "applied apiculture coming soon to a AE2 modpack near you",
    "update is soon™",
    "naneinf? wait till you meat Infinitye2147483647",
    "isn't this just the spiral abyss?",
    "turi ip ip ip",
    "when is the guild tag coming out",
    "cosidering yrou'e a wizerd i thot yu wood b beter at speling",
    "please be patient, all bugs will be fixed in the next update",
    "have you tried turning the mana off and on again?",
    "ok the spell might not be mana efficient but is it at least card efficient?",
    "would you do it all again? sure, why not! -lily",
] as const;

export const MESSAGE_TICKERS: readonly string[] = ([
    `fun fact there are ${BASE_MESSAGE_TICKERS.length + 1} different message tickers`,
    ...BASE_MESSAGE_TICKERS,
]);
export const MESSAGE_TICKER_COUNT = MESSAGE_TICKERS.length;

let totalMessageTickersSeen = 0;
const seenMessageTickers = new Uint8Array(MESSAGE_TICKER_COUNT);

export function getTotalMessageTickersSeen(): number {
    return totalMessageTickersSeen;
}

export function setTotalMessageTickersSeen(value: number): void {
    totalMessageTickersSeen = Math.max(0, Math.floor(value));
}

export function hasSeenMessageTicker(index: number): boolean {
    return index >= 0 && index < MESSAGE_TICKER_COUNT && seenMessageTickers[index] !== 0;
}

export function setSeenMessageTicker(index: number, seen: boolean): void {
    if (index < 0 || index >= MESSAGE_TICKER_COUNT) return;
    seenMessageTickers[index] = seen ? 1 : 0;
}

export function getUniqueMessageTickersSeen(): number {
    let total = 0;
    for (const seen of seenMessageTickers) total += seen;
    return total;
}

export function recordMessageTicker(index: number): { total: number; unique: number } {
    totalMessageTickersSeen++;
    setSeenMessageTicker(index, true);
    const statistics = {
        total: totalMessageTickersSeen,
        unique: getUniqueMessageTickersSeen(),
    };
    if (statistics.unique >= REAL_NEWS_MESSAGE_COUNT) {
        namedWasm.unlockTierOneAchievement(REAL_NEWS_ACHIEVEMENT_INDEX);
    }
    return statistics;
}
