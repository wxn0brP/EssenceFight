import { allCardMap } from "#engine/cards";
import { parseCardPosition } from "#engine/utils/cardPosition";
import { CardEffect } from "#shared/types/card/effect";
import { UnitCard } from "#shared/types/card/card";
import { BoardState, CardPosition, GameState, Id } from "#shared/types/state";

export interface DeployMove {
    type: "deploy";
    who: Id;
    to: CardPosition;
    score: number;
}

export interface AttackMove {
    type: "attack";
    who: CardPosition;
    to: CardPosition;
    score: number;
}

export interface EffectMove {
    type: "effect";
    who: string;
    effectId: string;
    targets?: string[];
    score: number;
}

export interface NextPhaseMove {
    type: "next_phase";
    score: number;
}

export interface EndTurnMove {
    type: "end_turn";
    score: number;
}

export type GameMove =
    | DeployMove
    | AttackMove
    | EffectMove
    | NextPhaseMove
    | EndTurnMove;


function calculateDeployScore(cardId: Id, to: CardPosition): number {
    const card = allCardMap[cardId];
    if (!card) return 0;

    let score = 0;

    if (card.type === "unit") {
        const unit = card as UnitCard;
        const totalStats =
            unit.health +
            unit.attack.physical +
            unit.attack.arts +
            unit.attack.true +
            unit.armor.physical +
            unit.armor.arts;
        score = unit.cost > 0 ? totalStats / unit.cost : totalStats;

        if (to.startsWith("ground")) score += 2;
        else if (to.startsWith("castle")) score += 1;
    } else if (card.type === "rune") {
        score = 5;
        if (card.effects?.length) score += card.effects.length * 2;
    }

    return Math.round(score * 10) / 10;
}

function calculateAttackScore(
    aggressiveCardId: Id,
    defensiveCardId: Id,
    defensiveHp: number
): number {
    const aggressiveCard = allCardMap[aggressiveCardId] as UnitCard;
    const defensiveCard = allCardMap[defensiveCardId] as UnitCard;
    if (!aggressiveCard || !defensiveCard) return 0;

    const damage =
        Math.max(aggressiveCard.attack.physical - defensiveCard.armor.physical, 0) +
        Math.max(aggressiveCard.attack.arts - defensiveCard.armor.arts, 0) +
        aggressiveCard.attack.true;

    let score = damage;

    if (damage >= defensiveHp)
        score += defensiveCard.cost * 5 + 10;

    const hpRatio = Math.max(0, (defensiveHp - damage)) / Math.max(1, defensiveHp);
    if (hpRatio < 0.5 && damage > 0) score += 3;

    return Math.round(score * 10) / 10;
}

function calculateEffectScore(effect: CardEffect.Effect): number {
    let score = 0;

    if (effect.operations) {
        for (const op of effect.operations) {
            switch (op.op) {
                case "apply_damage":
                    score += 8;
                    break;
                case "apply_heal":
                    score += 5;
                    break;
                case "apply_buff":
                    score += 4;
                    break;
                case "create_card":
                    score += 7;
                    break;
                case "return_to_hand":
                    score += 3;
                    break;
                case "check_cost":
                    if (op.resource === "EP" && op.amount) score -= op.amount * 0.5;
                    if (op.resource === "DP" && op.amount) score -= op.amount * 2;
                    break;
            }
        }
    }

    if (effect.trigger === "ability") score += 2;
    if (effect.trigger === "passive") score += 1;

    return Math.round(Math.max(0, score) * 10) / 10;
}

function calculateDeployMoves(state: GameState, userIndex: number): DeployMove[] {
    const moves: DeployMove[] = [];
    const board = state.boards[userIndex];

    if (userIndex !== state.aggressive)
        return moves;

    if (board.deploymentPoints <= 0)
        return moves;

    for (const cardId of board.cards.unused) {
        const card = allCardMap[cardId];
        if (!card) continue;

        const zones: Array<"ground" | "castle" | "runes"> = [];
        if (card.type === "unit")
            zones.push("ground", "castle");

        else if (card.type === "rune")
            zones.push("runes");

        else if (card.type === "spell")
            continue;

        for (const zone of zones) {
            const slots = board.cards[zone];
            for (let i = 0; i < slots.length; i++)
                if (!slots[i])
                    moves.push({
                        type: "deploy",
                        who: cardId,
                        to: `${zone}-${i}`,
                        score: calculateDeployScore(cardId, `${zone}-${i}`)
                    });
        }
    }

    return moves;
}

function calculateAttackMoves(state: GameState, userIndex: number): AttackMove[] {
    const moves: AttackMove[] = [];

    if (!state.phase)
        return moves;

    if (state.aggressive !== userIndex)
        return moves;

    const aggressiveBoard = state.boards[state.aggressive];
    const defensiveBoard = state.boards[state.aggressive ^ 1];

    const attackerPositions: CardPosition[] = [];

    for (let i = 0; i < aggressiveBoard.cards.ground.length; i++)
        if (aggressiveBoard.cards.ground[i])
            attackerPositions.push(`ground-${i}`);

    for (let i = 0; i < aggressiveBoard.cards.castle.length; i++)
        if (aggressiveBoard.cards.castle[i])
            attackerPositions.push(`castle-${i}`);

    const hasEnemyGround = defensiveBoard.cards.ground.some(Boolean);

    for (const from of attackerPositions) {
        const [zone, index] = parseCardPosition(from);

        if (zone === "runes") continue;

        const aggressiveCardId = aggressiveBoard.cards[zone][index];
        if (!aggressiveCardId) continue;

        const actionRecord = aggressiveBoard.actionHistory[from];
        if (actionRecord?.attacked) continue;

        if (hasEnemyGround) {
            for (let i = 0; i < defensiveBoard.cards.ground.length; i++) {
                if (defensiveBoard.cards.ground[i]) {
                    const defCardId = defensiveBoard.cards.ground[i];
                    const defState = defensiveBoard.cards.state[`ground-${i}`];
                    moves.push({
                        type: "attack",
                        who: from,
                        to: `ground-${i}`,
                        score: calculateAttackScore(aggressiveCardId, defCardId, defState?.hp ?? 0)
                    });
                }
            }
        } else {
            const hasLeftCastle = !!defensiveBoard.cards.castle[0];
            const hasRightCastle = !!defensiveBoard.cards.castle[2];

            for (let i = 0; i < defensiveBoard.cards.castle.length; i++) {
                if (!defensiveBoard.cards.castle[i]) continue;

                if (i === 1 && (hasLeftCastle || hasRightCastle))
                    continue;

                const defCardId = defensiveBoard.cards.castle[i];
                const defState = defensiveBoard.cards.state[`castle-${i}`];
                moves.push({
                    type: "attack",
                    who: from,
                    to: `castle-${i}`,
                    score: calculateAttackScore(aggressiveCardId, defCardId, defState?.hp ?? 0)
                });
            }
        }
    }

    return moves;
}

function calculateEffectMoves(state: GameState, userIndex: number): EffectMove[] {
    const moves: EffectMove[] = [];
    const board = state.boards[userIndex];

    const boardZones: Array<"ground" | "castle" | "runes"> = ["ground", "castle", "runes"];

    for (const zone of boardZones) {
        const slots = board.cards[zone];
        for (let i = 0; i < slots.length; i++) {
            const cardId = slots[i];
            if (!cardId) continue;

            const card = allCardMap[cardId];
            if (!card || !card.effects) continue;

            for (const effect of card.effects) {
                if (effect.trigger !== "ability" && effect.trigger !== "passive") continue;

                const boardPos = `${zone}-${i}`;
                const actionRecord = board.actionHistory[boardPos];
                if (actionRecord?.effects.includes(effect._id)) continue;

                const targets = resolveEffectTargets(state, effect, board, userIndex);

                moves.push({
                    type: "effect",
                    who: `board:${boardPos}`,
                    effectId: effect._id,
                    targets,
                    score: calculateEffectScore(effect)
                });
            }
        }
    }

    for (const cardId of board.cards.unused) {
        const card = allCardMap[cardId];
        if (!card || !card.effects) continue;

        for (const effect of card.effects) {
            if (effect.trigger !== "ability" && effect.trigger !== "passive") continue;

            const actionRecord = board.actionHistory[cardId];
            if (actionRecord?.effects.includes(effect._id)) continue;

            const targets = resolveEffectTargets(state, effect, board, userIndex);

            moves.push({
                type: "effect",
                who: `deck:${cardId}`,
                effectId: effect._id,
                targets,
                score: calculateEffectScore(effect)
            });
        }
    }

    return moves;
}

function resolveEffectTargets(
    state: GameState,
    effect: CardEffect.Effect,
    board: BoardState,
    boardIndex: number
): string[] | undefined {
    const targets: string[] = [];

    const resolveOp = effect.operations?.find(op => op.op === "resolve_target");
    if (!resolveOp)
        return [];

    const target = resolveOp.target;

    switch (target) {
        case "self":
            targets.push("self");
            break;

        case "ally":
            for (const zone of ["ground", "castle", "runes"] as const) {
                const slots = board.cards[zone];
                for (let i = 0; i < slots.length; i++) {
                    if (slots[i]) {
                        targets.push(`board:${zone}-${i}`);
                    }
                }
            }
            break;

        case "enemy": {
            const enemyBoard = state.boards[boardIndex === 0 ? 1 : 0];
            for (const zone of ["ground", "castle", "runes"] as const) {
                const slots = enemyBoard.cards[zone];
                for (let i = 0; i < slots.length; i++)
                    if (slots[i])
                        targets.push(`board:${zone}-${i}`);
            }
            break;
        }

        case "ground":
            for (let i = 0; i < board.cards.ground.length; i++)
                if (!board.cards.ground[i])
                    targets.push(`board:ground-${i}`);
            for (let i = 0; i < board.cards.castle.length; i++)
                if (!board.cards.castle[i])
                    targets.push(`board:castle-${i}`);
            break;

        case "all":
            targets.push("all");
            break;

        case "choose":
            for (let b = 0; b < 2; b++) {
                const bState = state.boards[b];
                for (const zone of ["ground", "castle", "runes"] as const) {
                    const slots = bState.cards[zone];
                    for (let i = 0; i < slots.length; i++)
                        targets.push(`board:${zone}-${i}`);
                }
            }
            break;
    }

    return targets;
}

function calculateControlMoves(state: GameState, userIndex: number): GameMove[] {
    const moves: GameMove[] = [];
    const isAggressive = state.aggressive === userIndex;

    if (isAggressive)
        moves.push({ type: "end_turn", score: 0 });

    if (!state.phaseMeta.includes(state.users[userIndex]))
        moves.push({ type: "next_phase", score: 0 });

    return moves;
}

export function getPossibleMoves(state: GameState, userIndex: number): GameMove[] {
    const moves: GameMove[] = [];

    moves.push(...calculateDeployMoves(state, userIndex));
    moves.push(...calculateAttackMoves(state, userIndex));
    moves.push(...calculateEffectMoves(state, userIndex));
    moves.push(...calculateControlMoves(state, userIndex));

    return moves;
}

export function getPossibleMovesSorted(state: GameState, userIndex: number): GameMove[] {
    return getPossibleMoves(state, userIndex).sort((a, b) => b.score - a.score);
}
