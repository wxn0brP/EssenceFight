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

    export type OperationType =
        | "check_cost"
        | "pay_cost"
        | "resolve_target"
        | "parse_damage"
        | "apply_damage"
        | "apply_heal"
        | "apply_buff"
        | "apply_status"
        | "create_card"
        | "find_empty_slot"
        | "check_condition"
        | "emit"
        | "log"
        | "return_to_hand"

    export interface Operation {
        op: OperationType;
        resource?: "EP" | "DP";
        amount?: number;
        target?: Target;
        selector?: string;
        assign?: string;
        value?: string;
        targets?: string | any[];
        damage?: string;
        status?: string;
        cardId?: string;
        position?: string;
        zone?: string;
        condition?: string;
        event?: string;
        data?: Record<string, any>;
        message?: string;
        card?: string;
    }

    export interface Effect {
        _id: string;
        name: string;
        operations?: Operation[];
        trigger: Trigger;
        description?: string;
    }
}
