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

export const groupMatchesIntoSessions = (
    matches: Match[],
    gapHours: number = 3
): Match[][] => {
    if (matches.length === 0) {
        return [];
    }
    const sorted = [...matches].sort(
        (a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
    );
    const sessions: Match[][] = [];
    let current: Match[] = [sorted[0]];
    const gapMs = gapHours * 60 * 60 * 1000;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].finishedAt).getTime();
        const next = new Date(sorted[i].finishedAt).getTime();
        if (next - prev > gapMs) {
            sessions.push(current);
            current = [];
        }
        current.push(sorted[i]);
    }
    if (current.length > 0) {
        sessions.push(current);
    }
    return sessions;
};

export const groupByHourOfDay = (matches: Match[]): Map<number, Match[]> => {
    const buckets = new Map<number, Match[]>();
    for (const match of matches) {
        const hour = new Date(match.finishedAt).getHours();
        const bucket = buckets.get(hour) ?? [];
        bucket.push(match);
        buckets.set(hour, bucket);
    }
    return buckets;
};

export const groupByMatchIndexInSession = (sessions: Match[][]): Map<number, Match[]> => {
    const buckets = new Map<number, Match[]>();
    for (const session of sessions) {
        session.forEach((match, index) => {
            const bucket = buckets.get(index) ?? [];
            bucket.push(match);
            buckets.set(index, bucket);
        });
    }
    return buckets;
};
