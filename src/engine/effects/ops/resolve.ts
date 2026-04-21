import { OperationHandler } from "../types";

export const resolve_target: OperationHandler = async (ctx, op) => {
    const targets = [];
    ctx.store.targets = targets;

    if (op.target === "enemy") {
        const boardIndex = ctx.userIndex ^ 1;
        const board = ctx.engine.state.boards[boardIndex];


        for (const target of ctx.targets) {
            const card = board.cards.state[target];
            if (!card) continue;
            targets.push(card);
        }

        return true;
    }
    else if (op.target === "self") {
        const board = ctx.engine.state.boards[ctx.userIndex];
        const card = board.cards.state[ctx.cardPos];
        if (!card) return false;
        targets.push(card);
        return true;
    }

    return false;
}
