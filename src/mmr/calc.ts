import { calculateMMRChange, demote, lpChange, promote } from "./mmr";
import { RankPlayersC } from "./vars";

export async function resolveMatch(
    winnerId: string,
    loserId: string
) {
    const winner = await RankPlayersC.findOne({ _id: winnerId });
    const loser = await RankPlayersC.findOne({ _id: loserId });

    if (!winner || !loser) {
        throw new Error("Player not found");
    }

    const winnerMMRChange = calculateMMRChange(
        winner.mmr,
        loser.mmr,
        true
    );

    const loserMMRChange = calculateMMRChange(
        loser.mmr,
        winner.mmr,
        false
    );

    winner.mmr += winnerMMRChange;
    loser.mmr += loserMMRChange;

    winner.lp += lpChange(winner.mmr, loser.mmr, true);
    loser.lp += lpChange(loser.mmr, winner.mmr, false);

    if (winner.lp >= 100) promote(winner);
    if (loser.lp < 0) demote(loser);

    winner.gamesPlayed += 1;
    loser.gamesPlayed += 1;

    await RankPlayersC.updateOne(
        { _id: winner._id },
        winner
    );

    await RankPlayersC.updateOne(
        { _id: loser._id },
        loser
    );
}
