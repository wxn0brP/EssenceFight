import { User } from "#api/auth";
import { db } from "#db";
import { baseAttack } from "#engine/base/attack";
import { putCard } from "#engine/base/putCard";
import { games } from "#engine/games";
import { startGame, startGames } from "#engine/startGames";
import { matchSystem } from "#mmr";
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

    socket.on("game.search", async (cardIds: string[], type: "normal" | "ranked", cb: (data: true | string) => void) => {
        if (socket.gameId) return cb("You are already in a match");
        if (matchSystem._players.has(_id)) return cb("You are already in a match");

        if (cardIds.length > 15) return cb("Max 15 cards allowed");

        matchSystem.addPlayer(_id, cardIds);
        cb(true);
        startGames();
    });

    socket.on("match.proposal.respond", async (accept: boolean) => {
        const players = matchSystem.handleConsent(_id, accept);
        if (players) {
            await startGame(players[0], players[1]);
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected", socket.user._id);

        if (matchSystem._players.has(_id))
            matchSystem.removePlayer(_id);

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
        const rank = await db.rank.findOne({ _id });
        const meta = await db.userMeta.findOne({ _id });
        cb({
            name: meta.name,
            rank: rank.rank,
            lp: rank.lp
        });
    });

    socket.on("user.meta.name.set", async (name: string) => {
        if (!name) return;
        if (name.length > 32) return socket.emit("error", "Name too long");
        await db.userMeta.updateOneOrAdd({ _id }, { name });
    });
});
