import { ValtheraCreate } from "@wxn0brp/db";
import VQLProcessor from "@wxn0brp/vql";
import { cardDB } from "./cards";
import { User } from "#api/auth";
import { Player } from "#shared/types/mmr";
import { Deck } from "#shared/types/deck";

export const db = ValtheraCreate<{
    users: User;
    google: {
        _id: string;
        g: string;
    },
    rank: Player;
    deck: {
        cards: string[];
        _id: string;
    };
}>("db");

export const VQL = new VQLProcessor({
    db,
    card: cardDB
});
