import { BoardState, GameState } from "#shared/types/state";
import { Id } from "@wxn0brp/db";

function ensureHistory(board: BoardState, position: string) {
    board.actionHistory[position] ||= {
        attacked: false,
        effects: []
    };
}

export function markAttackUsed(state: GameState, userIndex: number, position: string) {
    const board = state.boards[userIndex];
    ensureHistory(board, position);
    board.actionHistory[position].attacked = true;
}

export function markEffectUsed(state: GameState, userIndex: number, position: string, effectId: Id) {
    const board = state.boards[userIndex];
    ensureHistory(board, position);
    board.actionHistory[position].effects.push(effectId);
}
