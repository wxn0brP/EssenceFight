import { cardDB } from "#shared/cards";
import { ValtheraCreate } from "@wxn0brp/db";
import VQLProcessor from "@wxn0brp/vql";
import { Data } from "@wxn0brp/vql-client/vql";

export const client_db = ValtheraCreate<{
    client: Data;
}>("db");

export const client_VQL = new VQLProcessor({
    client: client_db,
    card: cardDB,
});
