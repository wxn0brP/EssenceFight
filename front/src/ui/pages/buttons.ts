import { searchGame } from "#searchGame";

const searchGameContainer = qs("#pg_play__board");

export const searchGameButtons = {
    normal: searchGameContainer.qs("normal", 1),
    ranked: searchGameContainer.qs("ranked", 1),
    story: searchGameContainer.qs("story", 1),
    training: searchGameContainer.qs("training", 1),
}

searchGameButtons.ranked.addEventListener("click", () => searchGame("ranked"));
