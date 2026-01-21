import { GameState } from "#shared/types/state";

export function getBoards(state: GameState) {
    return {
        aggressiveBoard: state.boards[state.aggressive],
        defensiveBoard: state.boards[1 - state.aggressive],
    }
}