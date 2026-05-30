import { Match, MatchPlayer } from "models";

import { getRoundsPlayed } from "./MatchPlayerView";

export const dedupeMatches = (matches: Match[]): Match[] => {
    const seen = new Map<string, Match>();
    for (const match of matches) {
        if (!seen.has(match.gameId)) {
            seen.set(match.gameId, match);
        }
    }
    return Array.from(seen.values());
};

export const filterMatchesByDateRange = (matches: Match[], from: Date, to: Date): Match[] => {
    const fromMs = from.getTime();
    const toMs = to.getTime();
    return matches.filter(m => {
        const t = new Date(m.finishedAt).getTime();
        return t >= fromMs && t <= toMs;
    });
};

export const getMatchesForPlayer = (matches: Match[], steam64: string): Match[] =>
    matches.filter(m => m.players.some(p => p.steam64 === steam64));

export const getPlayerRowFromMatch = (match: Match, steam64: string): MatchPlayer | undefined =>
    match.players.find(p => p.steam64 === steam64);

export const getRoundsPlayedByPlayer = (matches: Match[], steam64: string): number => {
    let total = 0;
    for (const m of matches) {
        const row = getPlayerRowFromMatch(m, steam64);
        if (row !== undefined) {
            total += getRoundsPlayed(row);
        }
    }
    return total;
};
