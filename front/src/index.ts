import { BoardUi } from "#ui/board";
import "#ui/board/buttons";
import { renderUnusedCards } from "#ui/board/unused";
import { GameState } from "_types/state";
import "./ui/main";
import "./ws";
import { socket, user } from "./ws";

const boards = document.querySelectorAll<HTMLDivElement>(".board");
boards[0].id = "board_opponent";
boards[1].id = "board_my";

const rows = boards[0].qs(".rows").children;
rows[0].parentNode.insertBefore(rows[1], rows[0]);

export let gameState: GameState;
export let myBoardIndex: number;

socket.on("game.start", (startState: "new" | "join", state: GameState) => {
    console.log("start", startState, state);
    gameState = state;

    myBoardIndex = Number(user._id === state.users[1]);

    boardsComp[0].init(myBoardIndex ^ 1);
    boardsComp[1].init(myBoardIndex);
    renderUnusedCards(state.boards[myBoardIndex].cards.unused.map(id => state.cards[id]));
});

socket.on("game.state", (state: GameState) => {
    Object.assign(gameState, state);
    boardsComp[0].render();
    boardsComp[1].render();
    renderUnusedCards(state.boards[myBoardIndex].cards.unused.map(id => state.cards[id]));
});

export const boardsComp = [
    new BoardUi(boards[0]),
    new BoardUi(boards[1]),
];
boardsComp[1].events();