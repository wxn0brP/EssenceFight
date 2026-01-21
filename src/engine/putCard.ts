import { Engine } from "#engine";
import { GameState } from "#shared/types/state";
import { Id } from "@wxn0brp/db";
import { getBoards } from "./utils/board";

export async function putCard(engine: Engine, cardId: Id, playerId: Id) {
    const { aggressiveBoard, defensiveBoard } = getBoards(engine.state);
}