import { describe, expect, it } from "vitest";

import { LeetifyGamePlayerStats } from "api/types";
import {
    dedupeMatches,
    filterMatchesByDateRange,
    getMatchesForPlayer,
    getRoundsPlayedByPlayer
} from "helpers";
import { Match, MatchPlayer } from "models";

interface PlayerInput {
    steam64?: string;
    ctRoundsPlayed?: number;
    tRoundsPlayed?: number;
}

const buildPlayer = (input: PlayerInput = {}): MatchPlayer => {
    const raw: LeetifyGamePlayerStats = {
        steam64Id: input.steam64 ?? "76561198000000001",
        ctRoundsWon: 0,
        ctRoundsLost: input.ctRoundsPlayed ?? 0,
        tRoundsWon: 0,
        tRoundsLost: input.tRoundsPlayed ?? 0
    };
    return {
        steam64: input.steam64 ?? "76561198000000001",
        raw
    };
};

const buildMatch = (overrides: Partial<Match> = {}): Match => ({
    gameId: "g1",
    mapName: "de_mirage",
    finishedAt: "2026-05-20T12:00:00.000Z",
    durationSeconds: 1800,
    matchResult: "win",
    scoreOwn: 13,
    scoreOpponent: 7,
    dataSource: "matchmaking",
    players: [buildPlayer()],
    ...overrides
});

describe("dedupeMatches", () => {
    it("keeps the first occurrence by gameId", () => {
        const a = buildMatch({ gameId: "g1", mapName: "de_mirage" });
        const b = buildMatch({ gameId: "g1", mapName: "de_dust2" });
        const c = buildMatch({ gameId: "g2" });
        const result = dedupeMatches([a, b, c]);
        expect(result).toHaveLength(2);
        expect(result[0].mapName).toBe("de_mirage");
        expect(result[1].gameId).toBe("g2");
    });

    it("handles an empty list", () => {
        expect(dedupeMatches([])).toEqual([]);
    });
});

describe("filterMatchesByDateRange", () => {
    it("includes matches inside the range and excludes the rest", () => {
        const inside = buildMatch({ gameId: "g-in", finishedAt: "2026-05-15T00:00:00.000Z" });
        const before = buildMatch({ gameId: "g-before", finishedAt: "2026-04-01T00:00:00.000Z" });
        const after = buildMatch({ gameId: "g-after", finishedAt: "2026-06-01T00:00:00.000Z" });
        const result = filterMatchesByDateRange(
            [inside, before, after],
            new Date("2026-05-01T00:00:00.000Z"),
            new Date("2026-05-31T23:59:59.000Z")
        );
        expect(result.map(m => m.gameId)).toEqual(["g-in"]);
    });
});

describe("getMatchesForPlayer", () => {
    it("returns only matches containing the player", () => {
        const a = buildMatch({ gameId: "g1", players: [buildPlayer({ steam64: "alice" })] });
        const b = buildMatch({ gameId: "g2", players: [buildPlayer({ steam64: "bob" })] });
        const c = buildMatch({
            gameId: "g3",
            players: [buildPlayer({ steam64: "alice" }), buildPlayer({ steam64: "bob" })]
        });
        const result = getMatchesForPlayer([a, b, c], "alice");
        expect(result.map(m => m.gameId)).toEqual(["g1", "g3"]);
    });
});

describe("getRoundsPlayedByPlayer", () => {
    it("sums CT and T rounds across matches", () => {
        const a = buildMatch({
            gameId: "g1",
            players: [buildPlayer({ steam64: "alice", ctRoundsPlayed: 10, tRoundsPlayed: 10 })]
        });
        const b = buildMatch({
            gameId: "g2",
            players: [buildPlayer({ steam64: "alice", ctRoundsPlayed: 8, tRoundsPlayed: 12 })]
        });
        const c = buildMatch({ gameId: "g3", players: [buildPlayer({ steam64: "bob" })] });
        expect(getRoundsPlayedByPlayer([a, b, c], "alice")).toBe(40);
    });
});
