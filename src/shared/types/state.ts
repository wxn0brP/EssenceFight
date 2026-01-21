import {
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
        low: [
            AttackCards,
            AttackCards,
        ],
        high: [
            AttackCards,
            DefenseCards,
            AttackCards,
        ],
        castle: [
            DefenseCards,
            UnitCard_Leader,
            DefenseCards
        ],
        runes: [
            RuneCard,
            RuneCard,
        ]
    }
}

export interface GameState {
    boards: [BoardState, BoardState];
    aggressive: 0 | 1;
    users: [Id, Id];
    phase: 0 | 1;
}