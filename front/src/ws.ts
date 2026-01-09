import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import { GameState } from "_types/state";

const urlParams = new URLSearchParams(window.location.search);
let reload = false;

if (!urlParams.get("id")) {
    const id = prompt("Enter your id");
    urlParams.set("id", id);
    reload = true;
}

if (!urlParams.get("game")) {
    const id = prompt("Enter game id");
    urlParams.set("game", id);
    reload = true;
}

if (reload) {
    window.location.search = urlParams.toString();
}

document.title += " | " + urlParams.get("id");

export const ws = new GlovesLinkClient("/", {
    connectionData: {
        _id: urlParams.get("id"),
        game: urlParams.get("game"),
    },
    logs: true
});

ws.on("start", (state: "new" | "join", gameState: GameState) => {
    console.log("start", state, gameState);
});

ws.on("wait", () => {
    console.log("wait");
});