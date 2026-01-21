import { GameState, Id } from "#shared/types/state";
import { getEmptyBoard } from "./empty";

export class Engine {
    public state: GameState;

    constructor(users: [Id, Id]) {
        const aggressive = Math.random() > 0.5 ? 0 : 1;

        this.state = {
            boards: [getEmptyBoard(), getEmptyBoard()],
            aggressive,
            users,
            phase: 0,
        }
    }

    triggerUserDisconnect(user: Id) {
        console.log("triggerUserDisconnect", user);
    }
}