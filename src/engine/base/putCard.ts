import { allCardMap } from "#engine/cards";
import { getBaseData } from "#engine/utils/baseData";
import { BoardState } from "#engine/utils/board";
import { parseCardPosition } from "#engine/utils/cardPosition";;
import { UnitCard } from "#shared/types/card/card";
import { CardPosition } from "#shared/types/state";
import { EFSocket } from "#ws/game";
import { Id } from "@wxn0brp/db";
import { SocketRes } from "@wxn0brp/gls-limit/res";
import { Socket_StandardRes } from "@wxn0brp/gls-limit/types";

export async function game_card_put(socket: EFSocket, cardId: Id, positionData: CardPosition): Promise<Socket_StandardRes> {
    const res = new SocketRes("game.card.put");
    const { engine, playerId } = getBaseData(socket);
    if (!engine)
        return res.err("00", "Game not found");

    if (playerId !== engine.state.users[engine.state.aggressive])
        return res.err("01", "your turn");

    const { aggressiveBoard } = BoardState.byRole(engine.state);

    if (aggressiveBoard.deploymentPoints <= 0)
        return res.err("02", "No deployment points");

    const unusedIndex = aggressiveBoard.cards.unused.findIndex(card => card === cardId);
    if (unusedIndex === -1)
        return res.err("03", "Card not found");

    const [position, index] = parseCardPosition(positionData);
    if (aggressiveBoard.cards[position][index])
        return res.err("04", "Fobidden move");

    const cardData = allCardMap[cardId];
    if (!cardData)
        return res.err("05", "Unknown card");

    const isRunesSlot = position === "runes";

    if (isRunesSlot && cardData.type !== "rune")
        return res.err("06", "Only rune cards can be placed on runes slots");

    if (!isRunesSlot && cardData.type !== "unit")
        return res.err("07", "Fobidden card (not unit)");

    aggressiveBoard.cards.unused.splice(unusedIndex, 1);

    aggressiveBoard.cards[position][index] = cardId;
    aggressiveBoard.deploymentPoints--;

    aggressiveBoard.cards.state[positionData] = {
        hp: (allCardMap[cardId] as UnitCard).health
    }

    engine.emitChanges();

    return res.data();
}
