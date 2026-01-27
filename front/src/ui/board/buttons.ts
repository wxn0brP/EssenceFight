import { gameState } from "#state";
import { socket } from "#ws";

const buttons = qs("#game-controls-buttons");

buttons.qs("end-turn", 1).addEventListener("click", async () => {
    if (gameState.myBoardIndex !== gameState.data.aggressive) return console.error("Not your turn");
    socket.emit("game.turn.end");
});