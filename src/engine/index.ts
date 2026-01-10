import { GameState, Id } from "#shared/types/state";
import { getEmptyBoard } from "./empty";

export class Engine {
    public state: GameState;

    constructor(users: [Id, Id]) {
        const aggressive = Math.random() > 0.5 ? 0 : 1;

        this.state = {
            users: {
                aggressive: users[aggressive],
                defensive: users[1 - aggressive],
            },
            boardAggressive: getEmptyBoard(),
            boardDefensive: getEmptyBoard(),
            turn: "aggressive",
        }
    }

    triggerUserDisconnect(user: Id) {
        console.log("triggerUserDisconnect", user);
    }
}