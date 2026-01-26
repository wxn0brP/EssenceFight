import {
    AnyCard
} from "./card";

export type Id = string;
export type CardPosition = string;

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
    phase: 0 | 1;
    cards: Record<Id, AnyCard>;
}