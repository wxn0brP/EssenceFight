export namespace CardEffect {
    export type Trigger =
        | "attack"
        | "deploy"
        | "defend"
        | "death"
        | "kill"
        | "round_start"
        | "round_end"
        | "passive"
        | "ability"

    export type Type =
        | "custom"
        | "buff"
        | "debuff"
        | "damage"
        | "heal"
        | "summon"
        | "transform"
        | "status"

    export type Target =
        | "self"
        | "ally"
        | "enemy"
        | "ground"
        | "all"
        | "choose"

    export interface Preset {
        type: Exclude<Type, "custom">;
        value: string | number;
        target?: Target;
        duration?: number;
        condition?: string;
    }

    export interface Custom {
        type: "custom";
        script: string;
        params?: Record<string, any>;
    }

    export interface Effect {
        _id: string;
        name: string;
        effect: Preset | Custom;
        trigger: Trigger;
        cost?: number;
        costDP?: number;
        description?: string;
    }
}
