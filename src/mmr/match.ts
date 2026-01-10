import { MatchProposal, PendingMatch, Player, PlayerId } from "#shared/types/mmr";
import { RankPlayersC } from "./vars";

export class MatchmakingQueue {
    _players: Map<string, { player: Player; timestamp: number }> = new Map();
    _pendingProposals: Map<string, PendingMatch> = new Map();

    MMR_MATCH_RANGE = 40;
    MMR_CONSENT_THRESHOLD = 100;

    async addPlayer(id: PlayerId) {
        const player = await RankPlayersC.findOne({ _id: id });
        this._players.set(player._id, { player, timestamp: Date.now() });
    }

    removePlayer(playerId: string): void {
        this._players.delete(playerId);
        this._pendingProposals.delete(playerId);
    }

    findMatches(): {
        confirmed: [Player, Player][];
        proposals: MatchProposal[];
    } {
        const availablePlayers = Array.from(this._players.values())
            .map(p => p.player);

        if (availablePlayers.length < 2)
            return { confirmed: [], proposals: [] };

        const confirmed: [Player, Player][] = [];
        const proposals: MatchProposal[] = [];

        availablePlayers.sort((a, b) => a.mmr - b.mmr);

        const used = new Set<string>();

        for (let i = 0; i < availablePlayers.length - 1; i++) {
            if (used.has(availablePlayers[i]._id)) continue;

            for (let j = i + 1; j < availablePlayers.length; j++) {
                if (used.has(availablePlayers[j]._id)) continue;

                const diff = Math.abs(availablePlayers[i].mmr - availablePlayers[j].mmr);

                if (diff <= this.MMR_MATCH_RANGE) {
                    confirmed.push([availablePlayers[i], availablePlayers[j]]);
                    used.add(availablePlayers[i]._id);
                    used.add(availablePlayers[j]._id);
                    break;
                } else if (diff <= this.MMR_CONSENT_THRESHOLD) {
                    const stronger = availablePlayers[i].mmr > availablePlayers[j].mmr ?
                        availablePlayers[i] : availablePlayers[j];
                    const weaker = availablePlayers[i].mmr > availablePlayers[j].mmr ?
                        availablePlayers[j] : availablePlayers[i];

                    const matchData: PendingMatch = {
                        player1: stronger,
                        player2: weaker,
                        requiresConsent: true,
                        accepted: { player1: true, player2: null }
                    };

                    this._pendingProposals.set(weaker._id, matchData);
                    proposals.push({
                        playerId: weaker._id,
                        opponentId: stronger._id,
                        proposedMatch: true
                    });

                    used.add(stronger._id);
                    used.add(weaker._id);
                    break;
                }
            }
        }

        // Delete used players
        used.forEach(id => this._players.delete(id));

        return { confirmed, proposals };
    }

    handleConsent(playerId: string, accept: boolean): [Player, Player] | null {
        const proposal = this._pendingProposals.get(playerId);

        if (!proposal || proposal.accepted.player2 !== null) return null;

        proposal.accepted.player2 = accept;

        if (accept) {
            this._pendingProposals.delete(playerId);
            return [proposal.player1, proposal.player2];
        } else {
            this._pendingProposals.delete(playerId);
            return null;
        }
    }
}