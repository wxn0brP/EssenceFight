import { V } from "@wxn0brp/vql-client";
import { AnyCard } from "_types/card/sub";

export const allCardMap: Record<string, AnyCard> = {};
let loadPromise: Promise<void> | null = null;

export async function waitToLoadCards() {
    if (loadPromise) return await loadPromise;
    loadPromise = loadCards();
    await loadPromise;
}

async function loadCards() {
    const cards = await V<AnyCard[]>`card card`;
    cards.forEach(card => {
        allCardMap[card._id] = card;
    });
}
