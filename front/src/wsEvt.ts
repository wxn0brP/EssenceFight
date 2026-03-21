import { allCardMap, waitToLoadCards } from "#cards";
import { loader } from "#loader";
import { searchGame } from "#searchGame";
import { boardsComp, gameState } from "#state";
import { renderUnusedCards } from "#ui/board/unused";
import { showNotification } from "#ui/notifications";
import { setSearchButtonsDisabled } from "#ui/pages/buttons";
import { socket, user } from "#ws";
import { CardPosition, GameState } from "_types/state";

socket.on("game.start", () => {
    qs("#view-main").style.display = "none";
    qs("#view-game").style.display = "";
    loader.decrement();
    setSearchButtonsDisabled(false);
});

socket.on("game.win", (winner: number) => {
    const isWin = gameState.myBoardIndex === winner;
    showNotification(
        isWin ? "VICTORY" : "DEFEAT",
        isWin ? "You have defeated your opponent!" : "You have been defeated!",
        isWin ? "victory" : "defeat",
        () => {
            qs("#view-main").style.display = "";
            qs("#view-game").style.display = "none";
        }
    );
});

socket.on("game.attack", (attackerIndex: number, aPos: CardPosition, dPos: CardPosition) => {
    const isMeAttacker = attackerIndex === gameState.myBoardIndex;
    if (isMeAttacker) return;

    // Determine boards
    // boardsComp[0] is opponent, boardsComp[1] is me
    const attackerBoard = isMeAttacker ? boardsComp[1] : boardsComp[0];
    const defenderBoard = isMeAttacker ? boardsComp[0] : boardsComp[1];

    // Find elements
    const attEl = attackerBoard.getCardElement(aPos);
    const defEl = defenderBoard.getCardElement(dPos);

    if (attEl && defEl) {
        attackerBoard.animateAttack(attEl, defEl);
    }
});

socket.on("game.start", async (startState: "new" | "join", state: GameState) => {
    console.log("start", startState, state);
    gameState.data = state;
    (window as any).state = gameState.data;

    gameState.myBoardIndex = Number(user._id === state.users[1]);

    await waitToLoadCards();
    boardsComp[0].init(gameState.myBoardIndex ^ 1);
    boardsComp[1].init(gameState.myBoardIndex);
});

socket.on("game.state", async (state: GameState) => {
    await waitToLoadCards();
    Object.assign(gameState.data, state);
    boardsComp[0].render();
    boardsComp[1].render();
    renderUnusedCards(state.boards[gameState.myBoardIndex].cards.unused.map(id => allCardMap[id]));
    qs(`#game-controls-buttons`).qs("next-phase-count", 1).innerHTML = state.phaseMeta.length.toString();
});

if (localStorage.getItem("dev") === "true") {
    socket.on("disconnect", () => {
        if (qs("#view-game").style.display === "none") return;
        setTimeout(() => {
            searchGame("normal");
        }, 1000);
    });

    socket.on("error.valid", (msg: string) => {
        console.error(msg);
    });
}
