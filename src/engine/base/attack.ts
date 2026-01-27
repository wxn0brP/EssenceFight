import { checkWin } from "#engine/utils/chcekWin";
import { UnitCard } from "#shared/types/card";
import { CardPosition } from "#shared/types/state";
import { EFSocket } from "#ws/game";
import { getBaseData } from "../utils/baseData";
import { getBoards } from "../utils/board";
import { parseCardPosition } from "../utils/cardPosition";
import { socket400 } from "../utils/err";

const logPrefix = "ATTACK-BASE";

export function baseAttack(
    socket: EFSocket,
    aggressiveCardPositionData: CardPosition,
    defensiveCardPositionData: CardPosition
) {
    const { engine, playerId } = getBaseData(socket);

    if (playerId !== engine.state.users[engine.state.aggressive])
        return socket400(socket, logPrefix, "01", "your turn");

    const { aggressiveBoard, defensiveBoard } = getBoards(engine.state);

    const aggressiveCardPosition = parseCardPosition(aggressiveCardPositionData);
    const defensiveCardPosition = parseCardPosition(defensiveCardPositionData);

    if (defensiveCardPosition[0] === "ground" && !defensiveBoard.cards.ground.some(Boolean))
        return socket400(socket, logPrefix, "10", "Fobidden attack");

    if (defensiveCardPosition[0] === "castle" && defensiveBoard.cards.ground.some(Boolean))
        return socket400(socket, logPrefix, "11", "Fobidden attack");

    if (defensiveCardPosition[0] === "runes")
        return socket400(socket, logPrefix, "12", "Fobidden attack");

    const defensiveCardId: string = defensiveBoard.cards[defensiveCardPosition[0]]?.[defensiveCardPosition[1]];
    const aggressiveCardId: string = aggressiveBoard.cards[aggressiveCardPosition[0]]?.[aggressiveCardPosition[1]];

    if (!defensiveCardId)
        return socket400(socket, logPrefix, "20", "Card not found");

    if (!aggressiveCardId)
        return socket400(socket, logPrefix, "21", "Card not found");

    const aggressiveCard = engine.state.cards[aggressiveCardId] as UnitCard;
    const defensiveCard = engine.state.cards[defensiveCardId] as UnitCard;
    const defensiveState = defensiveBoard.cards.state[defensiveCardPositionData];

    defensiveState.hp -=
        (
            Math.max(aggressiveCard.attack.physical - defensiveCard.armor.physical, 0) +
            Math.max(aggressiveCard.attack.arts - defensiveCard.armor.arts, 0) +
            aggressiveCard.attack.true
        );

    if (defensiveState.hp <= 0) {
        defensiveBoard.cards[defensiveCardPosition[0]][defensiveCardPosition[1]] = null;
        defensiveBoard.cards.state[defensiveCardPositionData] = null;
    }

    if (checkWin(engine)) return;
    engine.emitChanges();
}