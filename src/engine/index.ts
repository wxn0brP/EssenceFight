import { db } from "#db";
import { AnyCard, UnitCard_Leader } from "#shared/types/card";
import { GameState, GameType, Id } from "#shared/types/state";
import { wss } from "#ws/wss";
import { Room } from "@wxn0brp/gloves-link-server/room";
import { allCardMap, allCardsArray } from "./cards";
import { getEmptyBoard } from "./empty";

export class Engine {
    public state: GameState;
    public socketRoom: Room;

    constructor(users: [Id, Id], public gameId: Id, public gameType: GameType) {
        const aggressive = Math.random() > 0.5 ? 0 : 1;
        this.socketRoom = wss.room("game-" + this.gameId);

        this.state = {
            boards: [getEmptyBoard(), getEmptyBoard()],
            aggressive,
            users,
            usersMeta: [null, null],
            phase: 0,
            phaseMeta: [],
            turn: 0,
        }
    }

    triggerUserDisconnect(user: Id) {
        console.log("triggerUserDisconnect", user);
    }

    async load(deck1Ids: string[] = [], deck2Ids: string[] = []) {
        this.state.aggressive = 0;
        this.state.boards[0].deploymentPoints = 1;
        this.state.boards[1].deploymentPoints = 1;

        const processDeck = (deckIds: string[], boardIndex: number) => {
            const deckCards = deckIds.map(id => allCardMap[id]).filter(Boolean);

            const leaderFn = (card: AnyCard) =>
                card.type === "unit" &&
                "class" in card &&
                card.class.includes("Leader");

            let leader: UnitCard_Leader | undefined = deckCards.find(leaderFn) as UnitCard_Leader;
            let others = deckCards.filter(c => c !== leader);

            if (deckCards.length === 0 || !leader) {
                const allLeaders = allCardsArray.filter(leaderFn) as UnitCard_Leader[];
                const allOthers = allCardsArray.filter(c => !leaderFn(c));

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

        this.state.usersMeta = [
            await db.userMeta.findOne({ _id: this.state.users[0] }),
            await db.userMeta.findOne({ _id: this.state.users[1] })
        ];
    }

    emit(type: string, ...args: any[]) {
        this.socketRoom.emit(type, ...args);
    }

    emitChanges() {
        this.emit("game.state", this.state);
    }
}
