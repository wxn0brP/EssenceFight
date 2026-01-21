import { loader } from "#loader";
import { Evt_UserInfo } from "_types/socket";
import { GameState } from "_types/state";
import "./ws";
import { socket } from "./ws";

const boards = document.querySelectorAll(".board");
boards[0].id = "board_my";
boards[1].id = "board_opponent";
const searchGameButton = qs<HTMLButtonElement>("#search-game");

function searchGame() {
    searchGameButton.disabled = true;
    socket.emit("game.search", (data: true | string) => {
        if (data === true) {
            loader.increment();
            console.log("[EF-UI-01] Game searching...");
            searchGameButton.innerHTML = "Searching...";
        } else {
            console.error("[EF-UI-02] Game searching error:", data);
            searchGameButton.innerHTML = "Search (err)";
            searchGameButton.disabled = false;
        }
    });
}

socket.on("start", (state: "new", gameState: GameState) => {
    console.log("start", state, gameState);
    qs("#view-main").style.display = "none";
    qs("#view-game").style.display = "";
    loader.decrement();
});

searchGameButton.addEventListener("click", () => searchGame());

function getUserInfo() {
    loader.increment();

    socket.emit("user.info", (data: Evt_UserInfo) => {
        qs("#user-name").innerHTML = data.name;
        qs("#ep-rank").innerHTML = data.rank;
        qs("#ep-bar").title = data.lp.toString() + " / 100";
        qs("#ep-bar-fill").style.setProperty("--ep-percent", `${data.lp / 100 * 100}%`);
        loader.decrement();
    });
}

getUserInfo();