import { allCardMap } from "#engine/cards";
import { interpretEffect } from "#engine/effects";
import { getBaseData } from "#engine/utils/baseData";
import { BoardState } from "#engine/utils/board";
import { parseCardPosition } from "#engine/utils/cardPosition";
import { markEffectUsed } from "#engine/utils/mark";
import { CardEffect } from "#shared/types/card/effect";
import { CardPosition } from "#shared/types/state";
import { EFSocket } from "#ws/game";
import { Id } from "@wxn0brp/db";
import { SocketRes } from "@wxn0brp/gls-limit/res";

export async function game_effect_use(
    socket: EFSocket,
    cardPosOrCardId: string,
    effectId: string,
    target: CardPosition
) {
    const res = new SocketRes("game.effect.use");
    const { engine } = getBaseData(socket);
    if (!engine)
        return res.err("00", "Game not found");

    const board = BoardState.byUser(engine.state, socket.user._id);
    let cardId: Id;
    let cardPos: CardPosition;

    if (cardPosOrCardId.startsWith("board:")) {
        cardPos = cardPosOrCardId.replace("board:", "");
        const [position, index] = parseCardPosition(cardPos);
        cardId = board.cards[position][index];

    } else if (cardPosOrCardId.startsWith("deck:"))
        cardId = board.cards.unused.find(card => card === cardPosOrCardId.replace("deck:", ""));

    else
        return res.err("01", "Card not found");

    if (!cardId)
        return res.valid("02", "Card not found");

    const card = allCardMap[cardId];
    if (!card)
        return res.err("03", "Card not found");

    const effect: CardEffect.Effect = card.effects.find(e => e._id === effectId);

    if (!effect)
        return res.valid("04", "Effect not found");

    const actionKey = cardPos || cardId;
    if (board.actionHistory[actionKey]?.effects.includes(effect._id))
        return res.valid("05", "Effect already used");

    const userIndex = socket.user._id === engine.state.users[0] ? 0 : 1;
    const effectRes = await interpretEffect({
        store: {},
        engine,
        userIndex,
        sourceCardId: cardId,
        cardPos,
        effect,
        targets: [target]
    });

    markEffectUsed(engine.state, userIndex, actionKey, effectId);

    if (!effectRes)
        return res.err("06", "Effect failed");

    engine.emitChanges();
    return res.data();
}
