import { Engine } from "#engine";
import { EFSocket } from "#ws/game";
import { Id } from "@wxn0brp/db";

export interface ActionBaseData {
    engine: Engine;
    playerId: Id;
    socket: EFSocket;
}