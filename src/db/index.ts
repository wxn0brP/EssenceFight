import { Valthera } from "@wxn0brp/db";
import VQLProcessor from "@wxn0brp/vql";
import { cardDB } from "./cards";

export const db = new Valthera("db");

export const VQL = new VQLProcessor({
    db,
    card: cardDB
});