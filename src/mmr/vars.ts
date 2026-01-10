import { Player, RankTier } from "../shared/types/mmr";
import { db } from "#db";

export const RankPlayersC = db.c<Player>("rank");

export const RANKS: RankTier[] = [
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "DIAMOND",
];

export const INITIAL_MMR = 1000;
export const INITIAL_RANK: RankTier = "BRONZE";
export const INITIAL_LP = 50;

export const K_FACTOR = 32;