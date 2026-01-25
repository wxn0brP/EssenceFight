import { Engine } from "#engine";
import { Id } from "@wxn0brp/db";
import { getBoards } from "./utils/board";

const logPrefix = (index: string) => `[EF-SRV-ENG-CARD-PUT-${index}]`;

export async function putCard(engine: Engine, cardId: Id, positionData: string, playerId: Id) {
    if (playerId !== engine.state.users[engine.state.aggressive])
        return console.error(`${logPrefix("01")} your turn`);

    const { aggressiveBoard } = getBoards(engine.state);

    if (aggressiveBoard.deploymentPoints <= 0)
        return console.error(`${logPrefix("02")} No deployment points`);

    const unusedIndex = aggressiveBoard.cards.unused.findIndex(card => card === cardId);
    if (unusedIndex === -1)
        return console.error(`${logPrefix("03")} Card not found`);

    const [position, indexString] = positionData.split("-");
    const index = Number(indexString);

    if (aggressiveBoard.cards[position][index])
        return console.error(`${logPrefix("04")} Fobidden move`);

    const card = structuredClone(aggressiveBoard.cards.unused[unusedIndex]);
    aggressiveBoard.cards.unused.splice(unusedIndex, 1);

    aggressiveBoard.cards[position][index] = card;
    aggressiveBoard.deploymentPoints--;

    engine.emitChanges();
}