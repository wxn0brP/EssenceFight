import { Engine } from "#engine";
import { CardEffect } from "#shared/types/card/effect";
import { logEffect } from "./log";
import { ops } from "./ops";
import { OperationContext } from "./types";

export async function interpretEffect(ctx: OperationContext) {
    const { effect } = ctx;

    logEffect(`INTERPRET`, `Interpreting effect: ${effect._id}`);

    for (const op of effect.operations) {
        const handler = ops[op.op];
        if (!handler) {
            logEffect(`INTERPRET`, `Unknown operation: ${op.op}`);
            return false;
        }

        const result = await handler(ctx, op);
        if (!result) {
            logEffect(`INTERPRET`, `Operation ${op.op} failed`);
            return false;
        } else {
            logEffect(`INTERPRET`, `Operation ${op.op} succeeded`);
        }
    }

    logEffect(`INTERPRET`, `Effect ${effect._id} interpreted successfully`);
    return true;
}
