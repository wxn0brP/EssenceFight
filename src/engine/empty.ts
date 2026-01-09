import { BoardState } from "#shared/types/state";

export function getEmptyBoard(): BoardState {
    return {
        deploymentPoints: 1,
        essencePoints: 1,

        cards: {
            low: [null, null],
            high: [null, null, null],
            castle: [null, null, null],
            runes: [null, null],
        }
    }
}