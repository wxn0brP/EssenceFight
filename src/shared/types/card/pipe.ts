export namespace CardPipe {
    export type Type =
        | "unit"
        | "spell"
        | "rune"

    export type Nature =
        | "Fire"
        | "Water"
        | "Earth"
        | "Lightning"
        | "Flora"
        | "Wind"
        | "Darkness"
        | "None"
        | "-"

    export type Class =
        | "Sniper"
        | "Fighter"
        | "Evoker"
        | "Tank"
        | "Leader"
        | "Assasin"
        | "Caster"

    export type CastingType =
        | "slow"
        | "fast"
        | "instant"

    export type DamageType =
        | "physical"
        | "arts"
        | "true"
}
