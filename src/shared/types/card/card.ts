import { CardEffect } from "./effect";
import { CardPipe } from "./pipe";

export interface Card {
    _id: string;
    name: string;
    type: CardPipe.Type;
    region: string;
    frameLvl: number;
    nature: CardPipe.Nature;
    description?: string;
}

export interface UnitCard extends Card {
    type: "unit";
    class: CardPipe.Class[];
    health: number;
    cost: number;

    attack: {
        physical: number;
        arts: number;
        true: number;
    };

    armor: {
        physical: number;
        arts: number;
    };

    effects?: CardEffect.Effect[];
    potencial?: UnitCardPotencial;
}

export interface UnitCardPotencial {
    requirements: string;
    effects: CardEffect.Effect[];
    description?: string;
}

export interface SpellCard extends Card {
    type: "spell";
    cost: number;
    castingType: CardPipe.CastingType;
    effects: CardEffect.Effect[];
    targetScope?: "enemy" | "ally" | "self" | "ground" | "all" | "choose";
}

export interface RuneCard extends Card {
    type: "rune";
    cost: number;
    effects: CardEffect.Effect[];
}
