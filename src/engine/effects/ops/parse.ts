import { UnitCard } from "#shared/types/card/card";
import { OperationHandler } from "../types";

export const parse_damage: OperationHandler = async (ctx, op) => {
    const damage: UnitCard["attack"] = {
        arts: 0,
        physical: 0,
        true: 0
    };

    const values = op.value.split(",");
    for (const value of values) {
        const last = value[value.length - 1];
        const val = +value.slice(0, value.length - 1);
        if (last === "P") damage.physical += val;
        if (last === "A") damage.arts += val;
        if (last === "T") damage.true += val;
    }

    ctx.store.damage = damage;
    return true;
}
