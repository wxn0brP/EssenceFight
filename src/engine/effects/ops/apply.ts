import { CardState } from "#shared/types/state";
import { logEffect } from "../log";
import { OperationHandler } from "../types";

export const apply_damage: OperationHandler = async (ctx, op) => {
    const { damage, targets } = ctx.store;

    for (const card of targets as CardState[]) {
        card.hp -= damage.physical;
        card.hp -= damage.arts;
        card.hp -= damage.true;
        logEffect("APPLY_DAMAGE", `Applying damage: ${damage.physical} P, ${damage.arts} A, ${damage.true} T`);
    }

    return true;
}
