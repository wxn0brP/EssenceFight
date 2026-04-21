import { GameState } from "#shared/types/state";
import { Id } from "@wxn0brp/db";

export namespace BoardState {
    export function byRole(state: GameState) {
        return {
            aggressiveBoard: state.boards[state.aggressive],
            defensiveBoard: state.boards[1 - state.aggressive],
        }
    }

    export function byUser(state: GameState, userId: Id) {
        return state.boards[userIndex(state, userId)];
    }

    export function userIndex(state: GameState, userId: Id) {
        return userId === state.users[0] ? 0 : 1;
    }
}
