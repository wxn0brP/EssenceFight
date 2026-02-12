import { ConfirmedMatchPlayer, MatchProposal, PendingMatch, PlayerId } from "#shared/types/mmr";
import { RankPlayersC } from "./vars";

export class MatchmakingQueue {
    _players: Map<string, ConfirmedMatchPlayer & { timestamp: number }> = new Map();
    _pendingProposals: Map<string, PendingMatch> = new Map();

    MMR_MATCH_RANGE = 40;
    MMR_CONSENT_THRESHOLD = 200;

    async addPlayer(id: PlayerId, deck: string[]) {
        const player = await RankPlayersC.findOne({ _id: id });
        this._players.set(player._id, { player, timestamp: Date.now(), deck });
    }

    removePlayer(playerId: string): void {
        this._players.delete(playerId);
        this._pendingProposals.delete(playerId);
    }

    findMatches(): {
        confirmed: [ConfirmedMatchPlayer, ConfirmedMatchPlayer][];
        proposals: MatchProposal[];
    } {
        const availablePlayers = Array.from(this._players.values());

        if (availablePlayers.length < 2)
            return { confirmed: [], proposals: [] };

        const confirmed: [ConfirmedMatchPlayer, ConfirmedMatchPlayer][] = [];
        const proposals: MatchProposal[] = [];

        availablePlayers.sort((a, b) => a.player.mmr - b.player.mmr);

        const used = new Set<string>();

        for (let i = 0; i < availablePlayers.length - 1; i++) {
            if (used.has(availablePlayers[i].player._id)) continue;

            for (let j = i + 1; j < availablePlayers.length; j++) {
                if (used.has(availablePlayers[j].player._id)) continue;

                const diff = Math.abs(availablePlayers[i].player.mmr - availablePlayers[j].player.mmr);

                if (diff <= this.MMR_MATCH_RANGE) {
                    confirmed.push([
                        { player: availablePlayers[i].player, deck: availablePlayers[i].deck },
                        { player: availablePlayers[j].player, deck: availablePlayers[j].deck }
                    ]);
                    used.add(availablePlayers[i].player._id);
                    used.add(availablePlayers[j].player._id);
                    break;
                } else if (diff <= this.MMR_CONSENT_THRESHOLD) {
                    const stronger = availablePlayers[i].player.mmr > availablePlayers[j].player.mmr ?
                        availablePlayers[i] : availablePlayers[j];
                    const weaker = availablePlayers[i].player.mmr > availablePlayers[j].player.mmr ?
                        availablePlayers[j] : availablePlayers[i];

                    const matchData: PendingMatch = {
                        player1: stronger,
                        player2: weaker,
                        requiresConsent: true,
                        accepted: { player1: true, player2: null }
                    };

                    this._pendingProposals.set(weaker.player._id, matchData);
                    proposals.push({
                        playerId: weaker.player._id,
                        opponentId: stronger.player._id,
                        proposedMatch: true
                    });

                    used.add(stronger.player._id);
                    used.add(weaker.player._id);
                    break;
                }
            }
        }

        // Delete used players
        used.forEach(id => this._players.delete(id));

        return { confirmed, proposals };
    }

    handleConsent(playerId: string, accept: boolean): [ConfirmedMatchPlayer, ConfirmedMatchPlayer] | null {
        const proposal = this._pendingProposals.get(playerId);

        if (!proposal || proposal.accepted.player2 !== null) return null;

        proposal.accepted.player2 = accept;

        if (accept) {
            this._pendingProposals.delete(playerId);
            this._players.delete(proposal.player1.player._id);
            this._players.delete(proposal.player2.player._id);
            return [proposal.player1, proposal.player2];
        } else {
            this._pendingProposals.delete(playerId);
            this._players.set(proposal.player1.player._id, { ...proposal.player1, timestamp: Date.now() });
            this._players.set(proposal.player2.player._id, { ...proposal.player2, timestamp: Date.now() });
            return null;
        }
    }
}
