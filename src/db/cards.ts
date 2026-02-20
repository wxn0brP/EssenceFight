import { AdapterBuilder } from "@wxn0brp/vql/helpers/apiAbstract";
import { YAML } from "bun";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { Data, FindQuery } from "@wxn0brp/vql-client/vql";

const cardAdapter = new AdapterBuilder();
export const cardDB = cardAdapter.getAdapter(true);
const cardsDir = "./cards";

export async function getCardById(id: string) {
    const path = join(cardsDir, `${id}.yml`);

    if (!existsSync(path))
        return null;

    return YAML.parse(await readFile(path, "utf-8"));
}

function findCards(search: FindQuery, one: false): Promise<any>;
function findCards(search: FindQuery, one: true): Promise<[any]>;
async function findCards(search: FindQuery, one = false) {
    const cardsFiles = await readdir(cardsDir);
    const cards = [];

    for (const cardFile of cardsFiles) {
        const card = await getCardById(cardFile.split(".")[0]);
        if (hasFieldsAdvanced(card, search.search)) {
            if (one === true) return card;
            else cards.push(card);
        }
    }

    return cards;
}

cardAdapter.findOne("card", async (query) => {
    return findCards(query, true);
});

cardAdapter.find("card", async (query) => {
    return findCards(query, false);
});

cardAdapter.findOne("card_id", async (query) => {
    const search = query.search as Data;
    if (!search._id) return null;
    return await getCardById(search._id);
});
