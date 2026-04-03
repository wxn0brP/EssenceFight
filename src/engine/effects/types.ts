import { Engine } from "#engine";
import { CardEffect } from "#shared/types/card/effect";

export interface OperationContext {
    store: Record<string, any>;
    targets: string[];
    effect: CardEffect.Effect;
    engine: Engine;
    userIndex: number;
    sourceCardId: string;
    cardPos: string;
}

export type OperationHandler = (ctx: OperationContext, op: CardEffect.Operation) => Promise<boolean> | boolean;
