import { User } from "#api/auth";
import { Player } from "#shared/types/mmr";
import { ValtheraCreate } from "@wxn0brp/db";
import VQLProcessor from "@wxn0brp/vql";
import { cardDB } from "../shared/cards";
import { UserMeta } from "#shared/types/meta";

export const db = ValtheraCreate<{
    users: User;
    google: {
        _id: string;
        g: string;
    },
    rank: Player;
    userMeta: UserMeta;
}>("db");

export const VQL = new VQLProcessor({
    db,
    card: cardDB
});
