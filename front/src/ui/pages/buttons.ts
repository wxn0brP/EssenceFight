import { loader } from "#loader";
import { searchGame } from "#searchGame";
import { socket } from "#ws";

const searchGameContainer = qs("#pg_play__board");
const infoContainerDiv = qs("#pg_play__info");

export const searchGameButtons = {
    normal: searchGameContainer.qs<HTMLButtonElement>("normal", 1),
    ranked: searchGameContainer.qs<HTMLButtonElement>("ranked", 1),
    story: searchGameContainer.qs<HTMLButtonElement>("story", 1),
    training: searchGameContainer.qs<HTMLButtonElement>("training", 1),
}

export function setSearchButtonsDisabled(disabled: boolean) {
    Object.values(searchGameButtons).forEach(btn => btn.disabled = disabled);
}

export const infoContainer = {
    search: infoContainerDiv.qs("search", 1),
    searchName: infoContainerDiv.qs("search-name", 1),
    cancelMatch: infoContainerDiv.qs("cancel-match", 1),
    searchErr: infoContainerDiv.qs("search-err", 1),
}

searchGameButtons.normal.addEventListener("click", () => searchGame("normal"));
searchGameButtons.ranked.addEventListener("click", () => searchGame("ranked"));
infoContainer.cancelMatch.addEventListener("click", () => {
    socket.emit("match.cancel");
    infoContainer.search.style.display = "none";
    loader.decrement();
});
