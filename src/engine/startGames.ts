import { Engine } from "#engine";
import { matchSystem } from "#mmr";
import { debounce } from "#utils";
import { EFSocket } from "#ws/game";
import { wss } from "#ws/wss";
import { genId } from "@wxn0brp/db";
import { games } from "./games";

async function _startGames() {
    const { confirmed, proposals } = matchSystem.findMatches();
    const namespace = wss.of("/");

    for (const [player1, player2] of confirmed) {
        const id = genId();
        const engine = new Engine([player1._id, player2._id], id);

        const gameRoomId = "game-" + id;

        const sockets = [
            ...namespace.userRoom(player1._id).sockets,
            ...namespace.userRoom(player2._id).sockets
        ] as EFSocket[];

        for (const socket of sockets) {
            socket.gameId = id;
            socket.joinRoom(gameRoomId);
        }

        games.set(id, engine);

        await engine.loadDev();

        namespace.room(gameRoomId).emit("game.start", "new", engine.state);
    }

    for (const proposal of proposals) {
        namespace.userRoom(proposal.playerId).emit("match.proposal", proposal);
        console.log("match.proposal", proposal);
    }
}

export const startGames = debounce(_startGames, 1000);