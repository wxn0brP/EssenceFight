import { loader } from "#loader";
import { boardsComp, gameState } from "#state";
import { renderUnusedCards } from "#ui/board/unused";
import { searchGame, searchGameButton } from "#ui/main";
import { socket, user } from "#ws";
import { GameState } from "_types/state";

socket.on("game.start", () => {
    qs("#view-main").style.display = "none";
    qs("#view-game").style.display = "";
    loader.decrement();
    searchGameButton.innerHTML = "Search";
    searchGameButton.disabled = false;
});

socket.on("game.win", (winner: number) => {
    const isWin = gameState.myBoardIndex === winner;
    alert(isWin ? "You win!" : "You lose!");
    qs("#view-main").style.display = "";
    qs("#view-game").style.display = "none";
})

socket.on("game.start", (startState: "new" | "join", state: GameState) => {
    console.log("start", startState, state);
    gameState.data = state;
    (window as any).state = gameState.data;

    gameState.myBoardIndex = Number(user._id === state.users[1]);

    boardsComp[0].init(gameState.myBoardIndex ^ 1);
    boardsComp[1].init(gameState.myBoardIndex);
    renderUnusedCards(state.boards[gameState.myBoardIndex].cards.unused.map(id => state.cards[id]));
});

socket.on("game.state", (state: GameState) => {
    Object.assign(gameState.data, state);
    boardsComp[0].render();
    boardsComp[1].render();
    renderUnusedCards(state.boards[gameState.myBoardIndex].cards.unused.map(id => state.cards[id]));
});

if (localStorage.getItem("dev") === "true") {
    socket.on("disconnect", () => {
        if (qs("#view-game").style.display === "none") return;
        setTimeout(() => {
            searchGame();
        }, 1000);
    });

    socket.on("error.valid", (msg: string) => {
        console.error(msg);
    });
}