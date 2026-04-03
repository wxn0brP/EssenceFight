import { allCardMap } from "#engine/cards";
import { BoardState } from "#engine/utils/board";
import { checkWin } from "#engine/utils/checkWin";
import { UnitCard } from "#shared/types/card/card";
import { CardPosition } from "#shared/types/state";
import { EFSocket } from "#ws/game";
import { Socket_StandardRes } from "@wxn0brp/gls-limit/types";
import { getBaseData } from "../utils/baseData";
import { parseCardPosition } from "../utils/cardPosition";
import { SocketRes } from "@wxn0brp/gls-limit/res";

export async function game_attack_base(
    socket: EFSocket,
    aggressiveCardPositionData: CardPosition,
    defensiveCardPositionData: CardPosition
): Promise<Socket_StandardRes> {
    const { engine, playerId } = getBaseData(socket);
    const res = new SocketRes("game.attack.base");
    if (!engine)
        return res.err("00", "Game not found");

    if (!engine.state.phase)
        return res.err("01", "not in attack phase");

    if (playerId !== engine.state.users[engine.state.aggressive])
        return res.err("02", "not your turn");

    const { aggressiveBoard, defensiveBoard } = BoardState.byRole(engine.state);

    const aggressiveCardPosition = parseCardPosition(aggressiveCardPositionData);
    const defensiveCardPosition = parseCardPosition(defensiveCardPositionData);

    if (defensiveCardPosition[0] === "ground" && !defensiveBoard.cards.ground.some(Boolean))
        return res.err("10", "Fobidden attack");

    if (defensiveCardPosition[0] === "castle" && defensiveBoard.cards.ground.some(Boolean))
        return res.err("11", "Fobidden attack");

    if (defensiveCardPosition[0] === "runes")
        return res.err("12", "Fobidden attack");

    const defensiveCardId: string = defensiveBoard.cards[defensiveCardPosition[0]]?.[defensiveCardPosition[1]];
    const aggressiveCardId: string = aggressiveBoard.cards[aggressiveCardPosition[0]]?.[aggressiveCardPosition[1]];

    if (!defensiveCardId)
        return res.err("20", "Card not found");

    if (!aggressiveCardId)
        return res.err("21", "Card not found");

    const aggressiveCard = allCardMap[aggressiveCardId] as UnitCard;
    const defensiveCard = allCardMap[defensiveCardId] as UnitCard;
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

    engine.emit("game.attack", engine.state.aggressive, aggressiveCardPositionData, defensiveCardPositionData);

    if (checkWin(engine)) return;
    engine.emitChanges();
}
