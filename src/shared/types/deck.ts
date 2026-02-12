import { AnyCard } from "./card";

export interface Deck {
    cards: AnyCard[];
    savedDeck: string[];
}