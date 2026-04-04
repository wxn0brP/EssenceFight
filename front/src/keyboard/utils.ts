import { gameState } from "#state";
import { $keyboard, Zone } from "./vars";

export function strToPos(zone: Zone, index: number): string {
    return `${zone}-${index}`;
}

export function validSlot(zone: Zone, index: number): boolean {
    if (zone === "ground") return index >= 0 && index <= 4;
    if (zone === "castle") return index >= 0 && index <= 2;
    if (zone === "runes") return index >= 0 && index <= 1;
    return false;
}

export function cardAt(boardIdx: number, zone: Zone, index: number) {
    const cards = gameState.data.boards[boardIdx].cards;
    if (zone === "ground") return cards.ground[index];
    if (zone === "castle") return cards.castle[index];
    if (zone === "runes") return cards.runes[index];
    return null;
}

export function isMyTurn() {
    return gameState.data.aggressive === gameState.myBoardIndex;
}

export function feedback(msg: string) {
    console.log("[Keyboard]", msg);

    clearTimeout($keyboard.feedbackTimeout);
    $keyboard.feedbackDiv.innerHTML = msg;
    $keyboard.feedbackDiv.fadeIn();
    $keyboard.feedbackTimeout = setTimeout(() => $keyboard.feedbackDiv.fadeOut(), 2500);
}

export function showBuf() {
    $keyboard.bufDiv.innerHTML = $keyboard.buffer || "";
    $keyboard.bufDiv.clT("visible", !!$keyboard.buffer);
}

export function clearBuf() {
    $keyboard.buffer = "";
    showBuf();
}
