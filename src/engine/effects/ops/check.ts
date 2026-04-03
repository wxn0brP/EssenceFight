import { logEffect } from "../log";
import { OperationHandler } from "../types";

export const check_cost: OperationHandler = async (ctx, op) => {
    const { engine, userIndex } = ctx;
    const board = engine.state.boards[userIndex];

    const { resource, amount } = op;
    if (!resource || !amount) {
        logEffect(`CHECK_COST`, `Invalid operation: ${op.op}`);
        return false;
    }

    const availableResource = resource === "EP" ? board.essencePoints : board.deploymentPoints;

    if (availableResource < amount) {
        logEffect(`CHECK_COST`, `Insufficient ${resource}: ${availableResource} < ${amount}`);
        return false;
    }

    return true;
}
