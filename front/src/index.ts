import "@wxn0brp/flanker-ui/html";
import "./ws";
import { socket } from "./ws";
import { GameState } from "_types/state";

const boards = document.querySelectorAll(".board");
boards[0].id = "board_my";
boards[1].id = "board_opponent";
const searchGameButton = qs<HTMLButtonElement>("#search-game");

function searchGame() {
    socket.emit("game.search", (data: true | string) => {
        if (data === true) {
            console.log("[EF-UI-01] Game searching...");
            searchGameButton.disabled = true;
            searchGameButton.innerHTML = "Searching...";
        } else {
            console.error("[EF-UI-02] Game searching error:", data);
            searchGameButton.innerHTML = "Search (err)";
            searchGameButton.disabled = false;
        }
    })
}

socket.on("start", (state: "new", gameState: GameState) => {
    console.log("start", state, gameState);
    qs("#main").style.display = "none";
    qs("#game").style.display = "";
});

searchGameButton.addEventListener("click", () => searchGame());