import { allCardMap } from "#cards";
import { boardsComp, gameState } from "#state";
import { socket } from "#ws";
import { cardAt, feedback, isMyTurn, strToPos, validSlot } from "./utils";
import { $keyboard, Zone } from "./vars";

export function cmdDeploy(cardIdx: number, zone: Zone, slotIdx: number) {
    if (!isMyTurn()) return console.error("Not your turn");

    const board = gameState.data.boards[gameState.myBoardIndex];

    if (board.deploymentPoints <= 0) return console.error("No deployment points");
    if (cardIdx < 0 || cardIdx >= board.cards.unused.length)
        return console.error(`Bad card index ${cardIdx}`);
    if (!validSlot(zone, slotIdx)) return console.error("Bad slot");

    const pos = strToPos(zone, slotIdx);
    const mc = board.cards;
    if (zone === "ground" && mc.ground[slotIdx]) return console.error(`${pos} occupied`);
    if (zone === "castle" && mc.castle[slotIdx]) return console.error(`${pos} occupied`);
    if (zone === "runes" && mc.runes[slotIdx]) return console.error(`${pos} occupied`);

    const cardId = board.cards.unused[cardIdx];
    const cardData = allCardMap[cardId];

    if (zone === "runes" && cardData?.type !== "rune")
        return console.error("Only rune cards can be placed on runes slots");

    if (zone !== "runes" && cardData?.type !== "unit")
        return console.error("Only unit cards can be placed on non-runes slots");

    feedback(`${cardIdx} -> ${pos}`);
    socket.emit("game.card.put", cardId, pos);
}

export function cmdAttack(fromZone: Zone, fromIdx: number, toZone: Zone, toIdx: number) {
    if (!isMyTurn()) return console.error("Not your turn");
    if (!gameState.data.phase) return console.error("Not in attack phase");

    const mi = gameState.myBoardIndex;
    const oi = 1 - mi;

    const fromPos = strToPos(fromZone, fromIdx);
    const toPos = strToPos(toZone, toIdx);

    if (!cardAt(mi, fromZone, fromIdx)) return console.error(`No card at ${fromPos}`);
    if (!cardAt(oi, toZone, toIdx)) return console.error(`No enemy at ${toPos}`);

    if (fromZone === "runes") return console.error("Runes cannot attack");
    if (toZone === "runes") return console.error("Runes cannot be attacked");

    const enemyBoard = gameState.data.boards[oi];
    if (toZone === "castle" && toIdx === 1 && (enemyBoard.cards.castle[0] || enemyBoard.cards.castle[2]))
        return console.error("Cannot attack leader while guard is present");

    const atk = boardsComp[mi].getCardElement(fromPos);
    const def = boardsComp[oi].getCardElement(toPos);
    if (atk && def) boardsComp[mi].animateAttack(atk, def);

    feedback(`${fromPos} -> ${toPos}`);
    socket.emit("game.attack.base", fromPos, toPos);
}

export function cmdEffectUse(cardRef: string, effectId: string, target: string) {
    if (!isMyTurn()) return console.error("Not your turn");
    feedback(`Effect ${effectId} -> ${target || "no target"}`);
    socket.emit("game.effect.use", cardRef, effectId, target);
}

export function cmdEndTurn() {
    if (!isMyTurn()) return console.error("Not your turn");
    feedback("End turn");
    socket.emit("game.turn.end");
}

export function cmdNextPhase() {
    feedback("Next phase");
    socket.emit("game.phase.next");
}

export function execMacro(name: string) {
    const macro = $keyboard.macros[name];
    if (!macro) {
        feedback(`Macro "${name}" not found`);
        return;
    }

    const [eventName, ...args] = macro;
    const fullEventName = `game.${eventName}`;

    feedback(`Macro: ${name}`);
    socket.emit(fullEventName, ...args);
}
