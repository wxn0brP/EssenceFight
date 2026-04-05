import { mgl } from "#mgl";
import { BoardUi } from "#ui/board";
import { GameState } from "_types/state";

export const gameState: {
    data: GameState;
    myBoardIndex: number;
} = {
    data: null,
    myBoardIndex: null
}

export const boards = document.querySelectorAll<HTMLDivElement>(".board");

export const boardsComp = [
    new BoardUi(boards[0]),
    new BoardUi(boards[1]),
];

mgl.state = gameState;
