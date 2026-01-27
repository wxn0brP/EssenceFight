import { VQL } from "#db";
import { AnyCard, UnitCard_Leader } from "#shared/types/card";
import { GameState, Id } from "#shared/types/state";
import { wss } from "#ws/wss";
import { getEmptyBoard } from "./empty";

export class Engine {
    public state: GameState;

    constructor(users: [Id, Id], public gameId: Id) {
        const aggressive = Math.random() > 0.5 ? 0 : 1;

        this.state = {
            boards: [getEmptyBoard(), getEmptyBoard()],
            aggressive,
            users,
            phase: 0,
            cards: {}
        }
    }

    triggerUserDisconnect(user: Id) {
        console.log("triggerUserDisconnect", user);
    }

    async loadDev() {
        const cards = await VQL.execute<AnyCard[]>("card card");
        if ("err" in cards) return console.error(cards);

        this.state.aggressive = 0;
        this.state.boards[0].deploymentPoints = 20;
        this.state.boards[1].deploymentPoints = 20;

        const leaderFn = (card: AnyCard) =>
            card.type === "unit" &&
            "class" in card &&
            card.class.includes("Leader");

        const leaders: UnitCard_Leader[] = [];
        const others: AnyCard[] = [];

        for (const card of cards) {
            if (leaderFn(card)) leaders.push(card as any);
            else others.push(card);
        }

        const leader = leaders[Math.floor(Math.random() * leaders.length)];

        this.state.cards = Object.fromEntries(cards.map(card => [card._id, card]));
        this.state.boards[0].cards.castle[1] = leader._id;
        this.state.boards[1].cards.castle[1] = leader._id;
        this.state.boards[0].cards.unused = others.map(card => card._id);
        this.state.boards[1].cards.unused = others.map(card => card._id);

        const leaderState = {
            hp: leader.health
        }

        this.state.boards[0].cards.state["castle-1"] = structuredClone(leaderState);
        this.state.boards[1].cards.state["castle-1"] = structuredClone(leaderState);
    }

    emitChanges() {
        wss.room("game-" + this.gameId).emit("game.state", this.state);
    }
}