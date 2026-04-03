import { db } from "#db";
import { game_attack_base } from "#engine/base/attack";
import { game_card_put } from "#engine/base/putCard";
import { game_effect_use } from "#engine/base/useEffect";
import { games } from "#engine/games";
import { checkIsUserInMatch, startGame, startGames } from "#engine/startGames";
import { matchSystems } from "#mmr";
import { GameType } from "#shared/types/state";
import { SocketRes } from "@wxn0brp/gls-limit/res";
import { Events, Socket_StandardRes } from "@wxn0brp/gls-limit/types";
import { EFSocket } from "./game";

export const gameEvents: Events[] = [
    ["game.search", 1000, true, game_search],
    ["game.card.put", 1000, false, game_card_put],
    ["game.turn.end", 1000, false, game_turn_end],
    ["game.phase.next", 1000, false, game_phase_next],
    ["game.attack.base", 1000, false, game_attack_base],
    ["game.effect.use", 1000, true, game_effect_use],
];

export const userEvents: Events[] = [
    ["user.info", 1000, true, user_info],
    ["user.meta.name.set", 1000, false, user_meta_name_set],
    ["disconnect", 1000, false, disconnect],
];

export const matchEvents: Events[] = [
    ["match.proposal.respond", 1000, false, match_proposal_respond],
    ["match.cancel", 1000, false, match_cancel],
];

export const events: Events[][] = [
    gameEvents,
    userEvents,
    matchEvents,
];

async function game_search(socket: EFSocket, cardIds: string[], type: GameType): Promise<Socket_StandardRes> {
    const res = new SocketRes("game.search");

    if (type !== "normal" && type !== "ranked") return res.err("Invalid game type");
    const _id = socket.user._id;

    if (socket.gameId) return res.err("You are already in a match");
    if (checkIsUserInMatch(_id)) return res.err("You are already in a match");

    if (cardIds.length > 15) return res.err("Max 15 cards allowed");

    matchSystems[type].addPlayer(_id, cardIds);
    socket.gameType = type;
    startGames();
    return res.data(true);
}

async function match_proposal_respond(socket: EFSocket, accept: boolean): Promise<Socket_StandardRes> {
    const res = new SocketRes("match.proposal.respond");
    const players = matchSystems[socket.gameType].handleConsent(socket.user._id, accept);
    if (players)
        await startGame(players[0], players[1], socket.gameType);
    return res.data();
}

async function match_cancel(socket: EFSocket): Promise<Socket_StandardRes> {
    const res = new SocketRes("match.cancel");
    socket.gameType && matchSystems[socket.gameType].removePlayer(socket.user._id);
    socket.gameType = undefined;
    return res.data();
}

async function disconnect(socket: EFSocket): Promise<Socket_StandardRes> {
    const res = new SocketRes("disconnect");
    console.log("disconnected", socket.user._id);
    const _id = socket.user._id;

    Object.values(matchSystems).forEach(matchSystem => {
        if (matchSystem._players.has(_id))
            matchSystem.removePlayer(_id);
    });

    if (socket.gameId) {
        const game = games.get(socket.gameId);
        if (!game) return;

        game.triggerUserDisconnect(socket.user._id);
    }

    return res.data();
}

async function game_turn_end(socket: EFSocket): Promise<Socket_StandardRes> {
    const res = new SocketRes("game.turn.end");
    const game = games.get(socket.gameId);
    if (!game) return res.err("Game not found");

    game.state.boards[game.state.aggressive].deploymentPoints =
        Math.min(10, Math.floor(game.state.turn / 2) + 1);
    game.state.aggressive = 1 - game.state.aggressive as 0 | 1;
    game.state.turn++;
    game.emitChanges();
    return res.data();
}

async function game_phase_next(socket: EFSocket): Promise<Socket_StandardRes> {
    const res = new SocketRes("game.phase.next");
    const game = games.get(socket.gameId);
    if (!game) return res.err("Game not found");

    if (game.state.phase) return;

    const { phaseMeta } = game.state;

    if (phaseMeta.includes(socket.user._id))
        phaseMeta.splice(phaseMeta.indexOf(socket.user._id), 1);
    else
        phaseMeta.push(socket.user._id);

    if (phaseMeta.length === 2)
        game.state.phase = 1;

    game.emitChanges();
    return res.data();
}

async function user_info(socket: EFSocket): Promise<Socket_StandardRes> {
    const res = new SocketRes("user.info");
    const _id = socket.user._id;
    const rank = await db.rank.findOne({ _id });
    const meta = await db.userMeta.findOne({ _id });
    return res.data({
        name: meta.name,
        rank: rank.rank,
        lp: rank.lp
    });
}

async function user_meta_name_set(socket: EFSocket, name: string): Promise<Socket_StandardRes> {
    const res = new SocketRes("user.meta.name.set");
    if (!name) return res.err("Name is required");
    if (name.length > 32) return res.err("Name too long");
    await db.userMeta.updateOneOrAdd({ _id: socket.user._id }, { name });
    return res.data();
};
