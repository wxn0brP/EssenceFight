import { Engine } from "#engine";
import { games } from "#engine/games";
import { resolveMatch } from "#mmr/calc";
import { BoardState } from "#shared/types/state";
import { EFSocket } from "#ws/game";

function checkLeaderAlive(board: BoardState) {
    return !!board.cards.castle[1];
}

export function checkWin(engine: Engine) {
    const { boards } = engine.state;
    const isAlive0 = checkLeaderAlive(boards[0]);
    const isAlive1 = checkLeaderAlive(boards[1]);

    if (isAlive0 && isAlive1) return;

    const winner = isAlive0 ? 0 : 1;
    const { gameId, socketRoom: room } = engine;

    room.emit("game.win", winner);
    room.sockets.forEach((client: EFSocket) => {
        client.gameId = null;
    });
    room.leaveAll();

    resolveMatch(engine.state.users[winner], engine.state.users[winner ^ 1]);

    games.delete(gameId);
    return true;
}
