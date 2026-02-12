import { Engine } from "#engine";
import { matchSystem } from "#mmr";
import { ConfirmedMatchPlayer } from "#shared/types/mmr";
import { debounce } from "#utils";
import { EFSocket } from "#ws/game";
import { wss } from "#ws/wss";
import { genId } from "@wxn0brp/db";
import { games } from "./games";

export async function startGame(p1Data: ConfirmedMatchPlayer, p2Data: ConfirmedMatchPlayer) {
    const namespace = wss.of("/");
    const player1 = p1Data.player;
    const player2 = p2Data.player;

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

    await engine.load(p1Data.deck, p2Data.deck);

    namespace.room(gameRoomId).emit("game.start", "new", engine.state);
}

async function _startGames() {
    const { confirmed, proposals } = matchSystem.findMatches();
    const namespace = wss.of("/");

    for (const [p1Data, p2Data] of confirmed) {
        await startGame(p1Data, p2Data);
    }

    for (const proposal of proposals) {
        namespace.userRoom(proposal.playerId).emit("match.proposal", proposal);
        console.log("match.proposal", proposal);
    }
}

export const startGames = debounce(_startGames, 1000);
