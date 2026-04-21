import { Player } from "#shared/types/mmr";
import { K_FACTOR, RANKS } from "./vars";

export function expectedWinChance(mmrA: number, mmrB: number): number {
    return 1 / (1 + Math.pow(10, (mmrB - mmrA) / 400));
}

export function calculateMMRChange(
    playerMMR: number,
    opponentMMR: number,
    didWin: boolean
): number {
    const expected = expectedWinChance(playerMMR, opponentMMR);
    const result = didWin ? 1 : 0;
    return Math.round(K_FACTOR * (result - expected));
}

export function lpChange(playerMMR: number, opponentMMR: number, didWin: boolean): number {
    if (didWin) {
        return playerMMR < opponentMMR ? 30 : 20;
    } else {
        return playerMMR < opponentMMR ? -10 : -20;
    }
}

export function promote(player: Player) {
    const index = RANKS.indexOf(player.rank);
    if (index < RANKS.length - 1) {
        player.rank = RANKS[index + 1];
        player.lp = 0;
    }
}

export function demote(player: Player) {
    const index = RANKS.indexOf(player.rank);
    if (index > 0) {
        player.rank = RANKS[index - 1];
        player.lp = 75;
    } else {
        player.lp = 0;
    }
}
