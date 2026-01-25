import {
    AnyCard,
    AttackCards,
    DefenseCards,
    RuneCard,
    UnitCard_Leader
} from "./card";

export type Id = string;

export interface BoardState {
    essencePoints: number;
    deploymentPoints: number;

    cards: {
        ground: [Id, Id, Id, Id, Id],
        castle: [Id, Id, Id],
        runes: [Id, Id],
        unused: Id[];
    }
}

export interface GameState {
    boards: [BoardState, BoardState];
    aggressive: 0 | 1;
    users: [Id, Id];
    phase: 0 | 1;
    cards: Record<Id, AnyCard>;
}