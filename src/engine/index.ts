import { VQL } from "#db";
import { AnyCard, UnitCard_Leader } from "#shared/types/card";
import { GameState, Id } from "#shared/types/state";
import { wss } from "#ws/wss";
import { Room } from "@wxn0brp/gloves-link-server/room";
import { getEmptyBoard } from "./empty";

export class Engine {
    public state: GameState;
    public socketRoom: Room;

    constructor(users: [Id, Id], public gameId: Id) {
        const aggressive = Math.random() > 0.5 ? 0 : 1;

        this.state = {
            boards: [getEmptyBoard(), getEmptyBoard()],
            aggressive,
            users,
            phase: 0,
            cards: {}
        }

        this.socketRoom = wss.room("game-" + this.gameId);
    }

    triggerUserDisconnect(user: Id) {
        console.log("triggerUserDisconnect", user);
    }

    async load(deck1Ids: string[] = [], deck2Ids: string[] = []) {
        const cards = await VQL.execute<AnyCard[]>("card card");
        if ("err" in cards) return console.error(cards);

        this.state.aggressive = 0;
        this.state.boards[0].deploymentPoints = 20;
        this.state.boards[1].deploymentPoints = 20;

        this.state.cards = Object.fromEntries(cards.map(card => [card._id, card]));

        const processDeck = (deckIds: string[], boardIndex: number) => {
            const deckCards = deckIds.map(id => this.state.cards[id]).filter(Boolean);

            const leaderFn = (card: AnyCard) =>
                card.type === "unit" &&
                "class" in card &&
                card.class.includes("Leader");

            let leader: UnitCard_Leader | undefined = deckCards.find(leaderFn) as UnitCard_Leader;
            let others = deckCards.filter(c => c !== leader);

            if (deckCards.length === 0 || !leader) {
                const allLeaders = cards.filter(leaderFn) as UnitCard_Leader[];
                const allOthers = cards.filter(c => !leaderFn(c));

                if (!leader)
                    leader = allLeaders[Math.floor(Math.random() * allLeaders.length)];

                if (deckCards.length === 0) {
                    for (let i = allOthers.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [allOthers[i], allOthers[j]] = [allOthers[j], allOthers[i]];
                    }
                    others = allOthers;
                }
            }

            if (others.length > 15)
                others = others.slice(0, 15);

            this.state.boards[boardIndex].cards.castle[1] = leader._id;
            this.state.boards[boardIndex].cards.unused = others.map(card => card._id);

            const leaderState = {
                hp: leader.health
            };

            this.state.boards[boardIndex].cards.state["castle-1"] = structuredClone(leaderState);
        };

        processDeck(deck1Ids, 0);
        processDeck(deck2Ids, 1);
    }

    emit(type: string, ...args: any[]) {
        this.socketRoom.emit(type, ...args);
    }

    emitChanges() {
        this.emit("game.state", this.state);
    }
}
