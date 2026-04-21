import { Engine } from "#engine";
import { matchSystems } from "#mmr";
import { MatchmakingQueue } from "#mmr/match";
import { ConfirmedMatchPlayer } from "#shared/types/mmr";
import { GameType } from "#shared/types/state";
import { debounce } from "#utils";
import { EFSocket } from "#ws/game";
import { wss } from "#ws/wss";
import { genId } from "@wxn0brp/db";
import { games } from "./games";

export async function startGame(p1Data: ConfirmedMatchPlayer, p2Data: ConfirmedMatchPlayer, gameType: GameType) {
    const namespace = wss.of("/");
    const player1 = p1Data.player;
    const player2 = p2Data.player;

    const id = genId();
    const engine = new Engine([player1._id, player2._id], id, gameType);

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
    namespace.room(gameRoomId).emit("game.state", engine.state);
}

async function startGamesViaSystem(type: GameType) {
    const { confirmed, proposals } = matchSystems[type].findMatches();
    const namespace = wss.of("/");

    for (const [p1Data, p2Data] of confirmed) {
        console.log("match.start", p1Data.player._id, p2Data.player._id);
        await startGame(p1Data, p2Data, type);
    }

    for (const proposal of proposals) {
        namespace.userRoom(proposal.playerId).emit("match.proposal", proposal);
        console.log("match.proposal", proposal);
    }
}

function startGamesFn() {
    startGamesViaSystem("ranked");
    startGamesViaSystem("normal");
}

export const startGames = debounce(startGamesFn, 1000);

export function checkIsUserInMatch(userId: string) {
    return Object.values(matchSystems).some(game => game._players.has(userId));
}
