import { CardPosition } from "#shared/types/state";

export function parseCardPosition(position: CardPosition): [string, number] {
    const [pos, idx] = position.split("-");
    return [pos, +idx];
}