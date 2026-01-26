import { EFSocket } from "#ws/game";

export function socket400(socket: EFSocket, base: string, index: string, msg: string) {
    const content = `[EF-SRV-ENG-${base}-${index}] ${msg}`;
    console.error(content);
    socket.emit("error.valid", content);
}