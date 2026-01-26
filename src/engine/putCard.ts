import { UnitCard } from "#shared/types/card";
import { CardPosition } from "#shared/types/state";
import { EFSocket } from "#ws/game";
import { Id } from "@wxn0brp/db";
import { getBaseData } from "./utils/baseData";
import { getBoards } from "./utils/board";
import { parseCardPosition } from "./utils/cardPosition";
import { socket400 } from "./utils/err";

const logPrefix = `CARD-PUT`;

export async function putCard(socket: EFSocket, cardId: Id, positionData: CardPosition) {
    const { engine, playerId } = getBaseData(socket);

    if (playerId !== engine.state.users[engine.state.aggressive])
        return socket400(socket, logPrefix, "01", "your turn");

    const { aggressiveBoard } = getBoards(engine.state);

    if (aggressiveBoard.deploymentPoints <= 0)
        return socket400(socket, logPrefix, "02", "No deployment points");

    const unusedIndex = aggressiveBoard.cards.unused.findIndex(card => card === cardId);
    if (unusedIndex === -1)
        return socket400(socket, logPrefix, "03", "Card not found");

    const [position, index] = parseCardPosition(positionData);
    if (aggressiveBoard.cards[position][index])
        return socket400(socket, logPrefix, "04", "Fobidden move");

    const cardData = engine.state.cards[cardId];
    if (!cardData || cardData.type !== "unit")
        return socket400(socket, logPrefix, "05", "Fobidden card (not unit)");

    aggressiveBoard.cards.unused.splice(unusedIndex, 1);

    aggressiveBoard.cards[position][index] = cardId;
    aggressiveBoard.deploymentPoints--;

    aggressiveBoard.cards.state[positionData] = {
        hp: (engine.state.cards[cardId] as UnitCard).health
    }

    engine.emitChanges();
}