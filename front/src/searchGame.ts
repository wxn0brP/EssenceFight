import { loader } from "#loader";
import { selectedCards } from "#ui/pages/cards";
import { socket } from "#ws";
import { fetchVQL } from "@wxn0brp/vql-client";

export function searchGame(type: "normal" | "ranked") {
    if (selectedCards.size === 0)
        if (!confirm("You haven't selected any cards. A random deck will be used. Do you want to proceed?"))
            return;

    // searchGameButton.disabled = true;
    const deck = Array.from(selectedCards);

    socket.emit("game.search", deck, type, (data: true | string) => {
        if (data === true) {
            loader.increment();
            console.log("[EF-UI-01] Game searching...");
            // searchGameButton.innerHTML = "Searching...";
        } else {
            console.error("[EF-UI-02] Game searching error:", data);
            // searchGameButton.innerHTML = "Search (err)";
            // searchGameButton.disabled = false;
            if (typeof data === "string") alert(data);
        }
    });

    fetchVQL({
        db: "client",
        d: {
            updateOneOrAdd: {
                collection: "deck",
                search: {},
                updater: {
                    cards: deck
                }
            }
        }
    });
}
