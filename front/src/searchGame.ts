import { loader } from "#loader";
import { infoContainer, setSearchButtonsDisabled } from "#ui/pages/buttons";
import { selectedCards } from "#ui/pages/cards";
import { socket } from "#ws";
import { fetchVQL } from "@wxn0brp/vql-client";
import { GameType } from "_types/state";

export function searchGame(type: GameType) {
    if (selectedCards.size === 0)
        if (!confirm("You haven't selected any cards. A random deck will be used. Do you want to proceed?"))
            return;

    setSearchButtonsDisabled(true);
    const deck = Array.from(selectedCards);

    socket.emit("game.search", deck, type, (data: true | string) => {
        if (data === true) {
            loader.increment();
            console.log("[EF-UI-01] Game searching...");
            infoContainer.search.style.display = "";
            infoContainer.searchName.innerHTML = type;
            infoContainer.searchErr.innerHTML = "";
        } else {
            console.error("[EF-UI-02] Game searching error:", data);
            infoContainer.searchErr.innerHTML = "Something went wrong...";
            if (typeof data === "string") alert(data);
        }
        setSearchButtonsDisabled(false);
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
