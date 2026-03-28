import { User } from "#api/auth";
import { db } from "#db";
import { games } from "#engine/games";
import { GLSocket } from "@wxn0brp/gloves-link-server";
import { AuthFnResult } from "@wxn0brp/gloves-link-server/types";
import { setupSocket } from "@wxn0brp/gls-limit";
import { events } from "./game.events";
import { wss } from "./wss";

export interface EFSocket extends GLSocket {
    user: User;
    gameId: string;
    gameType: "normal" | "ranked";
}

const namespace = wss.of("/");

namespace.auth(async ({ token }): Promise<AuthFnResult> => {
    if (!token) {
        return {
            status: 401,
            msg: "Unauthorized"
        }
    }

    const user = await db.users.findOne({ sessionToken: token });
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

namespace.onConnect(async (socket: EFSocket) => {
    const { _id } = socket.user;
    console.log("connected", _id);

    setupSocket(socket, events);

    for (const [gameId, game] of games.entries()) {
        if (game.state.users.includes(_id)) {
            socket.gameId = gameId;
            socket.joinRoom("game-" + gameId);
            socket.emit("game.start", "reconnect", game.state);
            socket.emit("game.state", game.state);
            break;
        }
    }
});
