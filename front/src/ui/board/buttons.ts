import { gameState, myBoardIndex } from "#index";
import { socket } from "#ws";

const buttons = qs("#game-controls-buttons");

buttons.qs("end-turn", 1).addEventListener("click", async () => {
    if (myBoardIndex !== gameState.aggressive) return console.error("Not your turn");
    socket.emit("game.turn.end");
});