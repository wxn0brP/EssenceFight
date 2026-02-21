import { User } from "#api/auth";
import { Player } from "#shared/types/mmr";
import { ValtheraCreate } from "@wxn0brp/db";
import VQLProcessor from "@wxn0brp/vql";
import { cardDB } from "../shared/cards";

export const db = ValtheraCreate<{
    users: User;
    google: {
        _id: string;
        g: string;
    },
    rank: Player;
}>("db");

export const VQL = new VQLProcessor({
    db,
    card: cardDB
});
