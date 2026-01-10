export type PlayerId = string;

export interface Player {
    _id: PlayerId;          // playerId
    mmr: number;            // hidden rating
    rank: RankTier;         // visible rank
    lp: number;             // 0–100
    gamesPlayed: number;
}

export type RankTier =
    | "BRONZE"
    | "SILVER"
    | "GOLD"
    | "PLATINUM"
    | "DIAMOND";

export interface MatchProposal {
    playerId: string;
    opponentId: string;
    proposedMatch: boolean;
}

export interface PendingMatch {
    player1: Player;
    player2: Player;
    requiresConsent: boolean;
    accepted: {
        player1: boolean | null;
        player2: boolean | null;
    };
}