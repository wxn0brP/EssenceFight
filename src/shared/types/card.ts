export type CardType = "unit" | "spell" | "rune";

export interface Card {
    id: string;
    name: string;
    type: CardType;
}

export interface UnitCard extends Card {
    type: "unit";
    health: number;
    attack: {
        physical: number;
        arts: number;
        true: number;
    };
    armor: {
        physical: number;
        arts: number;
    };
}

export interface SpellCard extends Card {
    type: "spell";
    cost: number;
    effect: string;
}

export interface RuneCard extends Card {
    type: "rune";
    cost: number;
    effect: string;
}

export interface UnitCard_Fighter extends UnitCard {
    unitType: "fighter";
}

export interface UnitCard_Tank extends UnitCard {
    unitType: "tank";
}

export interface UnitCard_Assasin extends UnitCard {
    unitType: "assasin";
}

export interface UnitCard_Caster extends UnitCard {
    unitType: "caster";
}

export interface UnitCard_Sniper {
    unitType: "sniper";
}

export interface UnitCard_Evoker extends UnitCard {
    unitType: "evoker";
}

export interface UnitCard_Leader extends UnitCard {
    unitType: "leader";
}

export type UnitCardType =
    | UnitCard_Fighter
    | UnitCard_Tank
    | UnitCard_Assasin
    | UnitCard_Caster
    | UnitCard_Sniper
    | UnitCard_Evoker
    | UnitCard_Leader;


export type AttackCards =
    | UnitCard_Tank
    | UnitCard_Fighter
    | UnitCard_Evoker
    | UnitCard_Assasin;

export type DefenseCards =
    | UnitCard_Tank
    | UnitCard_Fighter
    | UnitCard_Evoker;