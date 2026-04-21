import { games } from "#engine/games";
import { EFSocket } from "#ws/game";

export function getBaseData(socket: EFSocket) {
    return {
        engine: games.get(socket.gameId),
        playerId: socket.user._id,
        socket
    }
}