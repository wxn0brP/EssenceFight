import { RuneCard, SpellCard, UnitCard } from "./card";
import { CardEffect } from "./effect";

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

export interface UnitCard_Sniper extends UnitCard {
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
    | UnitCard_Leader

export type AttackCards =
    | UnitCard_Tank
    | UnitCard_Fighter
    | UnitCard_Evoker
    | UnitCard_Assasin

export type DefenseCards =
    | UnitCard_Tank
    | UnitCard_Fighter
    | UnitCard_Evoker

export type AnyCard =
    | UnitCardType
    | SpellCard
    | RuneCard

export type AnyEffect = CardEffect.Effect
export type EffectPreset = CardEffect.Preset
export type EffectCustom = CardEffect.Custom
export type EffectTrigger = CardEffect.Trigger
export type EffectTarget = CardEffect.Target
