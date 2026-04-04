import { allCardMap } from "#cards";
import { gameState } from "#state";
import { cmdAttack, cmdDeploy, cmdEffectUse, cmdEndTurn, cmdNextPhase, execMacro } from "./run";
import { clearBuf, feedback, strToPos, validSlot } from "./utils";
import { $keyboard, Zone, zoneMap } from "./vars";

export function exec() {
    const { buffer } = $keyboard;
    if (!buffer) return;

    const mm = buffer.match(/^m\.(\w+)$/);
    if (mm) {
        execMacro(mm[1]);
        clearBuf();
        return;
    }

    if (buffer === "ee") {
        cmdEndTurn();
        clearBuf();
        return;
    }

    if (buffer === "nn") {
        cmdNextPhase();
        clearBuf();
        return;
    }

    const dm = buffer.match(/^d(\d+)([gcr])(\d+)$/);
    if (dm) {
        cmdDeploy(+dm[1], zoneMap[dm[2]], +dm[3]);
        clearBuf();
        return;
    }

    const am = buffer.match(/^a([gcr])(\d+)([gcr])(\d+)$/);
    if (am) {
        cmdAttack(zoneMap[am[1]], +am[2], zoneMap[am[3]], +am[4]);
        clearBuf();
        return;
    }

    const em = buffer.match(/^e([gcrg]?)(\d+)\.(\d+)([gcr]\d+)?$/);
    if (em) {
        const zone: string = zoneMap[em[1]] || null;
        const slotIdx = +em[2];
        const effectIdx = +em[3];
        const targetStr = em[4] || null;

        let cardRef: string;
        let effectId: string;
        let target = "";

        if (!zone || zone === "d") {
            const board = gameState.data.boards[gameState.myBoardIndex];
            const cardId = board.cards.unused[slotIdx];
            if (!cardId)
                return feedback("Deck card not found");

            cardRef = `deck:${cardId}`;
            const card = allCardMap[cardId];

            if (!card || !card.effects[effectIdx])
                return feedback("Effect not found");

            effectId = card.effects[effectIdx]._id;
        } else {
            const pos = strToPos(zone as Zone, slotIdx);
            cardRef = `board:${pos}`;
            const board = gameState.data.boards[gameState.myBoardIndex];

            const position = zone === "g" ? "ground" : zone === "c" ? "castle" : "runes";
            const cardId = board.cards[position][slotIdx];

            if (!cardId)
                return feedback("Card not found");

            const card = allCardMap[cardId];
            if (!card || !card.effects[effectIdx])
                return feedback("Effect not found");

            effectId = card.effects[effectIdx]._id;
        }

        if (targetStr) {
            const tZone = zoneMap[targetStr[0]] as Zone;
            const tIdx = +targetStr.slice(1);
            if (!validSlot(tZone, tIdx))
                return feedback("Invalid target slot");
            target = strToPos(tZone, tIdx);
        }

        cmdEffectUse(cardRef, effectId, target);
        clearBuf();
        return;
    }

    feedback(`Unknown: ${buffer}`);
    clearBuf();
}
