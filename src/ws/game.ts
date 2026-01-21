import { User } from "#api/auth";
import { db } from "#db";
import { Engine } from "#engine";
import { matchSystem } from "#mmr";
import { debounce } from "#utils";
import { genId } from "@wxn0brp/db";
import { GLSocket } from "@wxn0brp/gloves-link-server";
import { AuthFnResult } from "@wxn0brp/gloves-link-server/types";
import { wss } from "./wss";
import { putCard } from "#engine/putCard";

export interface EFSocket extends GLSocket {
    user: User;
    gameId: string;
}

const games = new Map<string, Engine>();

wss.of("/").auth(async ({ token }): Promise<AuthFnResult> => {
    if (!token) {
        return {
            status: 401,
            msg: "Unauthorized"
        }
    }

    const user = await db.findOne<User>("users", { sessionToken: token });
    if (!user) {
        return {
            status: 401,
            msg: "Unauthorized"
        }
    }

    return {
        status: 200,
        user,
    }
});

wss.of("/").onConnect(async (socket: EFSocket) => {
    const { _id } = socket.user;
    console.log("connected", _id);

    socket.joinRoom("user-" + _id);

    socket.on("game.search", (cb?: Function) => {
        if (matchSystem._players.has(_id)) return cb?.("You are already in a match");
        matchSystem.addPlayer(_id);
        cb?.(true);
        startGames();
    });

    socket.on("disconnect", () => {
        console.log("disconnected", socket.user._id);
        socket.leaveRoom("user-" + socket.user._id);
        if (socket.gameId) {
            socket.leaveRoom("game-" + socket.gameId);
            const game = games.get(socket.gameId);
            if (!game) return;

            game.triggerUserDisconnect(socket.user._id);
        }
    });

    socket.on("game.put", (cardId: string) => {
        putCard(games.get(socket.gameId), cardId, socket.user._id);
    });
});

async function _startGames() {
    const { confirmed, proposals } = matchSystem.findMatches();

    for (const [player1, player2] of confirmed) {
        const engine = new Engine([player1._id, player2._id]);
        const id = genId();

        const gameRoomId = "game-" + id;

        const userSocket1 = wss.room("user-" + player1._id).sockets[0] as EFSocket;
        const userSocket2 = wss.room("user-" + player2._id).sockets[0] as EFSocket;

        userSocket1.gameId = id;
        userSocket1.joinRoom(gameRoomId);
        userSocket2.gameId = id;
        userSocket2.joinRoom(gameRoomId);
        games.set(id, engine);

        wss.room(gameRoomId).emit("start", "new", engine.state);
    }

    for (const proposal of proposals) {
        wss.room("user-" + proposal.playerId).emit("match.proposal", proposal);
        console.log("match.proposal", proposal);
    }
}

const startGames = debounce(_startGames, 1000);