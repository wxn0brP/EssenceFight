import { Engine } from "#engine";
import { GlovesLinkServer, GLSocket } from "@wxn0brp/gloves-link-server";
import { AuthFnResult } from "@wxn0brp/gloves-link-server/types";

export const wss = new GlovesLinkServer({});

export interface EFSocket extends GLSocket {
    user: {
        _id: string;
        game: string;
    }
}

const games = new Map<string, Engine>();

wss.of("/").auth(async ({ data }): Promise<AuthFnResult> => {
    const { _id, game } = data;

    if (!_id || !game) {
        return {
            status: 401,
            msg: "Unauthorized"
        }
    }

    if (games.has(game)) {
        const room = wss.room("game-" + game);
        if (room.size === 2) {
            return {
                status: 401,
                msg: "Game already started"
            }
        }
        // if else = reconnect
    }

    const isUserTaken = wss.room("user-" + _id)?.clients?.size;
    if (isUserTaken) {
        return {
            status: 401,
            msg: "User taken"
        }
    }

    return {
        status: 200,
        user: {
            _id,
            game
        },
    }
});

wss.of("/").onConnect((socket: EFSocket) => {
    const { _id, game } = socket.user;
    console.log("connected", _id, game);

    socket.joinRoom("user-" + _id);

    const gameRoomId = "game-" + game;
    socket.joinRoom(gameRoomId);
    const gameRoom = wss.room(gameRoomId);

    if (gameRoom.size === 2) {
        if (!games.has(game)) {
            const engine = new Engine([
                _id,
                gameRoom.sockets[0].user._id
            ]);

            games.set(game, engine);
            gameRoom.emit("start", "new", engine.state);
        } else {
            const engine = games.get(game);
            socket.emit("start", "rejoin", engine.state);
        }
    } else {
        gameRoom.emit("wait");
    }

    socket.on("disconnect", () => {
        console.log("disconnected", socket.user._id);
        socket.leaveRoom("user-" + socket.user._id);
        socket.leaveRoom("game-" + socket.user.game);

        if (gameRoom.size === 0) {
            games.delete(socket.user.game);
        }
    });
});