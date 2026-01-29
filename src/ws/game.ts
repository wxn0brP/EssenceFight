import { User } from "#api/auth";
import { db } from "#db";
import { baseAttack } from "#engine/base/attack";
import { putCard } from "#engine/base/putCard";
import { games } from "#engine/games";
import { startGames } from "#engine/startGames";
import { matchSystem } from "#mmr";
import { Player } from "#shared/types/mmr";
import { Evt_UserInfo } from "#shared/types/socket";
import { GLSocket } from "@wxn0brp/gloves-link-server";
import { AuthFnResult } from "@wxn0brp/gloves-link-server/types";
import { wss } from "./wss";

export interface EFSocket extends GLSocket {
    user: User;
    gameId: string;
}

const namespace = wss.of("/");

namespace.auth(async ({ token }): Promise<AuthFnResult> => {
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

namespace.onConnect(async (socket: EFSocket) => {
    const { _id } = socket.user;
    console.log("connected", _id);

    socket.on("game.search", (cb?: Function) => {
        if (socket.gameId) return cb?.("You are already in a match");
        if (matchSystem._players.has(_id)) return cb?.("You are already in a match");
        matchSystem.addPlayer(_id);
        cb?.(true);
        startGames();
    });

    socket.on("disconnect", () => {
        console.log("disconnected", socket.user._id);

        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (!game) return;

            game.triggerUserDisconnect(socket.user._id);
        }
    });

    socket.on("game.card.put", (cardId: string, position: string) => {
        putCard(socket, cardId, position);
    });

    socket.on("game.turn.end", () => {
        const game = games.get(socket.gameId);
        if (!game) return;

        game.state.boards[game.state.aggressive].deploymentPoints++;
        game.state.aggressive = 1 - game.state.aggressive as 0 | 1;
        game.emitChanges();
    });

    socket.on("game.attack.base", (aCardPos: string, dCardPos: string) => {
        baseAttack(socket, aCardPos, dCardPos);
    });

    for (const [gameId, game] of games.entries()) {
        if (game.state.users.includes(_id)) {
            socket.gameId = gameId;
            socket.joinRoom("game-" + gameId);
            socket.emit("game.start", "reconnect", game.state);
            break;
        }
    }

    socket.on("user.info", async (cb: (user: Evt_UserInfo) => void) => {
        const rank = await db.findOne<Player>("rank", { _id });
        cb({
            name: socket.user._id,
            rank: rank.rank,
            lp: rank.lp
        });
    });
});
