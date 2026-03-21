import { UserMeta } from "./meta";

export type Id = string;
export type CardPosition = string;

export type GameType = "normal" | "ranked";

export interface CardState {
    hp: number;
}

export interface BoardState {
    essencePoints: number;
    deploymentPoints: number;

    cards: {
        ground: [Id, Id, Id, Id, Id],
        castle: [Id, Id, Id],
        runes: [Id, Id],
        unused: Id[];
        state: Record<string, CardState>;
    }
}

export interface GameState {
    boards: [BoardState, BoardState];
    aggressive: 0 | 1;
    users: [Id, Id];
    usersMeta: [UserMeta, UserMeta];
    phase: 0 | 1;
    phaseMeta: Id[];
    turn: number;
}
