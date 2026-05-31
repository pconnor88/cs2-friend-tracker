import { describe, expect, it } from "vitest";

import { LeetifyGamePlayerStats, LeetifyOpeningDuel } from "api/types";
import { aggregatePlayerStats, medianOf, rankStats } from "helpers";
import { Match, MatchPlayer, Rank } from "models";

interface PlayerInput {
    steam64?: string;
    rating?: number;
    hltvRating?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    adr?: number;
    kast?: number;
    headshotPercent?: number;
    mvps?: number;
    ctRoundsWon?: number;
    ctRoundsLost?: number;
    tRoundsWon?: number;
    tRoundsLost?: number;
    tradeKills?: number;
    tradeDeaths?: number;
    heGrenadesThrown?: number;
    flashesThrown?: number;
    smokesThrown?: number;
    molotovsThrown?: number;
    heDamage?: number;
    molotovDamage?: number;
    enemiesFlashed?: number;
    flashAssists?: number;
    flashedEnemyDurationSeconds?: number;
    multiKills2?: number;
    multiKills3?: number;
    multiKills4?: number;
    multiKills5?: number;
    preaimDegrees?: number;
    sprayAccuracy?: number;
    openingKillRate?: number;
    openingAttemptRate?: number;
}

const buildPlayer = (input: PlayerInput = {}): MatchPlayer => {
    const ctRoundsWon = input.ctRoundsWon ?? 0;
    const ctRoundsLost = input.ctRoundsLost ?? 0;
    const tRoundsWon = input.tRoundsWon ?? 0;
    const tRoundsLost = input.tRoundsLost ?? 0;
    const roundsPlayed = ctRoundsWon + ctRoundsLost + tRoundsWon + tRoundsLost;
    const enemiesFlashed = input.enemiesFlashed ?? 0;

    const raw: LeetifyGamePlayerStats = {
        steam64Id: input.steam64 ?? "alice",
        leetifyRating: input.rating ?? 1,
        hltvRating: input.hltvRating ?? 1,
        totalKills: input.kills ?? 0,
        totalDeaths: input.deaths ?? 0,
        totalAssists: input.assists ?? 0,
        dpr: input.adr ?? 0,
        kast: input.kast ?? 0,
        hsp: input.headshotPercent ?? 0,
        mvps: input.mvps ?? 0,
        ctRoundsWon,
        ctRoundsLost,
        tRoundsWon,
        tRoundsLost,
        tradeKillsSucceeded: input.tradeKills ?? 0,
        tradedDeathsSucceeded: input.tradeDeaths ?? 0,
        heThrown: input.heGrenadesThrown ?? 0,
        flashbangThrown: input.flashesThrown ?? 0,
        smokeThrown: input.smokesThrown ?? 0,
        molotovThrown: input.molotovsThrown ?? 0,
        heFoesDamageAvg: roundsPlayed === 0 ? 0 : (input.heDamage ?? 0) / roundsPlayed,
        molotovFoesDamageAvg: roundsPlayed === 0 ? 0 : (input.molotovDamage ?? 0) / roundsPlayed,
        flashbangHitFoe: enemiesFlashed,
        flashAssist: input.flashAssists ?? 0,
        flashbangHitFoeAvgDuration:
            enemiesFlashed === 0 ? 0 : (input.flashedEnemyDurationSeconds ?? 0) / enemiesFlashed,
        multi2k: input.multiKills2 ?? 0,
        multi3k: input.multiKills3 ?? 0,
        multi4k: input.multiKills4 ?? 0,
        multi5k: input.multiKills5 ?? 0,
        preaim: input.preaimDegrees ?? 0,
        sprayAccuracy: input.sprayAccuracy ?? 0
    };

    const openingDuelRaw: LeetifyOpeningDuel | undefined =
        input.openingKillRate !== undefined || input.openingAttemptRate !== undefined
            ? {
                  steam64Id: input.steam64 ?? "alice",
                  openingDuelSuccessPercentage: input.openingKillRate ?? 0,
                  openingDuelAttemptsPercentage: input.openingAttemptRate ?? 0
              }
            : undefined;

    return {
        steam64: input.steam64 ?? "alice",
        raw,
        openingDuelRaw
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

describe("medianOf", () => {
    it("returns 0 for an empty list", () => {
        expect(medianOf([])).toBe(0);
    });

    it("returns the middle for an odd-length list", () => {
        expect(medianOf([3, 1, 2])).toBe(2);
    });

    it("returns the average of the two middle values for an even-length list", () => {
        expect(medianOf([1, 2, 3, 4])).toBe(2.5);
    });
});

describe("rankStats", () => {
    it("returns an empty array for empty input", () => {
        expect(rankStats([])).toEqual([]);
    });

    it("ranks 3 distinct values higher-is-better", () => {
        const result = rankStats([
            { steam64: "a", value: 10 },
            { steam64: "b", value: 20 },
            { steam64: "c", value: 30 }
        ]);
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("c")?.rank).toBe(Rank.Gold);
        expect(byId.get("b")?.rank).toBe(Rank.Silver);
        expect(byId.get("a")?.rank).toBe(Rank.Bronze);
        expect(byId.get("c")?.isBest).toBe(true);
        expect(byId.get("a")?.isWorst).toBe(true);
        expect(byId.get("b")?.isBest).toBe(false);
        expect(byId.get("b")?.isWorst).toBe(false);
    });

    it("ranks 3 distinct values higher-is-worse", () => {
        const result = rankStats(
            [
                { steam64: "a", value: 10 },
                { steam64: "b", value: 20 },
                { steam64: "c", value: 30 }
            ],
            { higherIsBetter: false }
        );
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.rank).toBe(Rank.Gold);
        expect(byId.get("c")?.rank).toBe(Rank.Bronze);
        expect(byId.get("a")?.isBest).toBe(true);
        expect(byId.get("c")?.isWorst).toBe(true);
    });

    it("marks all tied-best entries as best", () => {
        const result = rankStats([
            { steam64: "a", value: 30 },
            { steam64: "b", value: 30 },
            { steam64: "c", value: 10 }
        ]);
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.isBest).toBe(true);
        expect(byId.get("b")?.isBest).toBe(true);
        expect(byId.get("c")?.isWorst).toBe(true);
    });

    it("marks all tied-worst entries as worst", () => {
        const result = rankStats([
            { steam64: "a", value: 30 },
            { steam64: "b", value: 10 },
            { steam64: "c", value: 10 }
        ]);
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.isBest).toBe(true);
        expect(byId.get("b")?.isWorst).toBe(true);
        expect(byId.get("c")?.isWorst).toBe(true);
    });

    it("awards two golds and one bronze when first place is tied", () => {
        const result = rankStats([
            { steam64: "a", value: 30 },
            { steam64: "b", value: 30 },
            { steam64: "c", value: 10 }
        ]);
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.rank).toBe(Rank.Gold);
        expect(byId.get("b")?.rank).toBe(Rank.Gold);
        expect(byId.get("c")?.rank).toBe(Rank.Bronze);
    });

    it("awards one gold and two silvers when second place is tied", () => {
        const result = rankStats([
            { steam64: "a", value: 30 },
            { steam64: "b", value: 10 },
            { steam64: "c", value: 10 }
        ]);
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.rank).toBe(Rank.Gold);
        expect(byId.get("b")?.rank).toBe(Rank.Silver);
        expect(byId.get("c")?.rank).toBe(Rank.Silver);
    });

    it("awards three golds when all values are tied", () => {
        const result = rankStats([
            { steam64: "a", value: 10 },
            { steam64: "b", value: 10 },
            { steam64: "c", value: 10 }
        ]);
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.rank).toBe(Rank.Gold);
        expect(byId.get("b")?.rank).toBe(Rank.Gold);
        expect(byId.get("c")?.rank).toBe(Rank.Gold);
    });

    it("applies tie-aware ranking with higher-is-worse", () => {
        const result = rankStats(
            [
                { steam64: "a", value: 10 },
                { steam64: "b", value: 10 },
                { steam64: "c", value: 30 }
            ],
            { higherIsBetter: false }
        );
        const byId = new Map(result.map(r => [r.steam64, r]));
        expect(byId.get("a")?.rank).toBe(Rank.Gold);
        expect(byId.get("b")?.rank).toBe(Rank.Gold);
        expect(byId.get("c")?.rank).toBe(Rank.Bronze);
    });

    it("handles a single-entry list — best is true, worst is false (no spread)", () => {
        const result = rankStats([{ steam64: "a", value: 5 }]);
        expect(result).toHaveLength(1);
        expect(result[0].isBest).toBe(true);
        expect(result[0].isWorst).toBe(false);
        expect(result[0].rank).toBe(Rank.Gold);
    });
});

describe("aggregatePlayerStats — smoke test", () => {
    it("aggregates a win and a loss across two matches", () => {
        const win = buildMatch({
            gameId: "win",
            matchResult: "win",
            mapName: "de_mirage",
            players: [
                buildPlayer({
                    steam64: "alice",
                    rating: 1.2,
                    kills: 20,
                    deaths: 10,
                    adr: 90,
                    kast: 0.75,
                    headshotPercent: 0.5,
                    ctRoundsWon: 7,
                    ctRoundsLost: 5,
                    tRoundsWon: 6,
                    tRoundsLost: 2
                })
            ]
        });
        const loss = buildMatch({
            gameId: "loss",
            matchResult: "loss",
            mapName: "de_dust2",
            players: [
                buildPlayer({
                    steam64: "alice",
                    rating: 0.8,
                    kills: 10,
                    deaths: 10,
                    adr: 60,
                    kast: 0.55,
                    headshotPercent: 0.3,
                    ctRoundsWon: 3,
                    ctRoundsLost: 9,
                    tRoundsWon: 4,
                    tRoundsLost: 8
                })
            ]
        });

        const stats = aggregatePlayerStats([win, loss], "alice");

        expect(stats.matchesPlayed).toBe(2);
        expect(stats.wins).toBe(1);
        expect(stats.losses).toBe(1);
        expect(stats.winPercent).toBe(0.5);
        expect(stats.kd).toBe(30 / 20);
        expect(stats.rating).toBeCloseTo(1.0, 5);
        expect(stats.mapBreakdown).toHaveLength(2);
        expect(stats.hltvRatingTrend).toHaveLength(2);
    });

    it("returns safe zeros when the player has no matches", () => {
        const stats = aggregatePlayerStats([], "alice");
        expect(stats.matchesPlayed).toBe(0);
        expect(stats.winPercent).toBe(0);
        expect(stats.kd).toBe(0);
        expect(stats.rating).toBe(0);
        expect(stats.mapBreakdown).toEqual([]);
        expect(stats.hltvRatingTrend).toEqual([]);
    });
});
