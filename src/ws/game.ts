import { User } from "#api/auth";
import { db } from "#db";
import { baseAttack } from "#engine/base/attack";
import { putCard } from "#engine/base/putCard";
import { games } from "#engine/games";
import { checkIsUserInMatch, startGame, startGames } from "#engine/startGames";
import { matchSystems } from "#mmr";
import { Evt_UserInfo } from "#shared/types/socket";
import { GLSocket } from "@wxn0brp/gloves-link-server";
import { AuthFnResult } from "@wxn0brp/gloves-link-server/types";
import { wss } from "./wss";
import { GameType } from "#shared/types/state";

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

    socket.on("game.search", async (cardIds: string[], type: GameType, cb: (data: true | string) => void) => {
        if (type !== "normal" && type !== "ranked") return cb("Invalid game type");

        if (socket.gameId) return cb("You are already in a match");
        if (checkIsUserInMatch(_id)) return cb("You are already in a match");

        if (cardIds.length > 15) return cb("Max 15 cards allowed");

        matchSystems[type].addPlayer(_id, cardIds);
        socket.gameType = type;
        cb(true);
        startGames();
    });

    socket.on("match.proposal.respond", async (accept: boolean) => {
        const players = matchSystems[socket.gameType].handleConsent(_id, accept);
        if (players)
            await startGame(players[0], players[1], socket.gameType);
    });

    socket.on("match.cancel", () => {
        matchSystems[socket.gameType].removePlayer(_id);
        socket.gameType = undefined;
    });

    socket.on("disconnect", () => {
        console.log("disconnected", socket.user._id);

        Object.values(matchSystems).forEach(matchSystem => {
            if (matchSystem._players.has(_id))
                matchSystem.removePlayer(_id);
        });

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

        game.state.boards[game.state.aggressive].deploymentPoints =
            Math.min(10, Math.floor(game.state.turn / 2) + 1);
        game.state.aggressive = 1 - game.state.aggressive as 0 | 1;
        game.state.turn++;
        game.emitChanges();
    });

    socket.on("game.phase.next", () => {
        const game = games.get(socket.gameId);
        if (!game) return;

        if (game.state.phase) return;

        const { phaseMeta } = game.state;

        if (phaseMeta.includes(socket.user._id))
            phaseMeta.splice(phaseMeta.indexOf(socket.user._id), 1);
        else
            phaseMeta.push(socket.user._id);

        if (phaseMeta.length === 2)
            game.state.phase = 1;

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
            socket.emit("game.state", game.state);
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
