import { GameType } from "#shared/types/state";
import { MatchmakingQueue } from "./match";

export const matchSystems: Record<GameType, MatchmakingQueue> = {
    ranked: new MatchmakingQueue({
        matchRange: 40,
        consentThreshold: 200,
        mmrFactor: 1,
    }),
    normal: new MatchmakingQueue({
        matchRange: 80,
        consentThreshold: 400,
        mmrFactor: 0,
    }),
}
