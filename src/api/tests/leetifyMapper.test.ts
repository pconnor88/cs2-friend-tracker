import { describe, expect, it } from "vitest";

import { mapLeetifyGameToMatch } from "api";
import { LeetifyGame } from "api/types";
import {
    getAdr,
    getEnemiesFlashed,
    getFlashedDuration,
    getHeadshotPercent,
    getHeDamage,
    getKast,
    getKills,
    getMolotovDamage,
    getMultiKills2,
    getTradeDeaths,
    getTradeKills,
    getUtilityDamage
} from "helpers";

const realPlayerStats = {
    steam64Id: "76561197981513573",
    name: "CerTek",
    leetifyRating: 0.0287,
    totalKills: 18,
    totalDeaths: 18,
    totalAssists: 12,
    dpr: 74.1,
    kast: 0.8,
    hsp: 0.2778,
    mvps: 2,
    ctRoundsWon: 9,
    ctRoundsLost: 6,
    tRoundsWon: 7,
    tRoundsLost: 8,
    tradeKillsSucceeded: 4,
    tradedDeathsSucceeded: 1,
    heFoesDamageAvg: 10.6,
    molotovFoesDamageAvg: 7.5714,
    heThrown: 15,
    molotovThrown: 14,
    smokeThrown: 22,
    flashbangThrown: 14,
    flashbangHitFoe: 7,
    flashbangHitFoeAvgDuration: 2.7298,
    flashAssist: 2,
    preaim: 13.6104,
    sprayAccuracy: 0.3043,
    multi2k: 4,
    multi3k: 0,
    multi4k: 0,
    multi5k: 0
};

const realGame: LeetifyGame = {
    id: "2738c495-e17a-4784-8813-538de3f17970",
    finishedAt: "2026-05-29T21:08:01.000Z",
    mapName: "de_nuke",
    dataSource: "matchmaking",
    teamScores: [14, 16],
    playerStats: [realPlayerStats],
    openingDuelPlayerStats: [
        {
            steam64Id: "76561197981513573",
            openingDuelAttemptsPercentage: 0,
            openingDuelSuccessPercentage: 0
        }
    ]
};

describe("mapLeetifyGameToMatch — real Leetify response shape", () => {
    it("maps non-zero combat stats from real field names", () => {
        const match = mapLeetifyGameToMatch(realGame, ["76561197981513573"]);

        expect(match.players).toHaveLength(1);
        const p = match.players[0];
        expect(getKills(p)).toBe(18);
        expect(getAdr(p)).toBe(74.1);
        expect(getHeadshotPercent(p)).toBeCloseTo(0.2778, 4);
        expect(getKast(p)).toBe(0.8);
        expect(getTradeKills(p)).toBe(4);
        expect(getTradeDeaths(p)).toBe(1);
        expect(getMultiKills2(p)).toBe(4);
    });

    it("derives match scores from tracked player's rounds-won / rounds-lost", () => {
        const match = mapLeetifyGameToMatch(realGame, ["76561197981513573"]);

        expect(match.scoreOwn).toBe(16);
        expect(match.scoreOpponent).toBe(14);
        expect(match.matchResult).toBe("win");
        expect(match.gameId).toBe("2738c495-e17a-4784-8813-538de3f17970");
        expect(match.mapName).toBe("de_nuke");
        expect(match.dataSource).toBe("matchmaking");
    });

    it("computes utility damage from per-round averages and rounds played", () => {
        const match = mapLeetifyGameToMatch(realGame, ["76561197981513573"]);
        const p = match.players[0];
        const roundsPlayed = 9 + 6 + 7 + 8;
        expect(getHeDamage(p)).toBeCloseTo(10.6 * roundsPlayed, 4);
        expect(getMolotovDamage(p)).toBeCloseTo(7.5714 * roundsPlayed, 4);
        expect(getUtilityDamage(p)).toBeCloseTo((10.6 + 7.5714) * roundsPlayed, 4);
        expect(getEnemiesFlashed(p)).toBe(7);
        expect(getFlashedDuration(p)).toBeCloseTo(2.7298 * 7, 4);
    });

    it("ignores players not in the tracked set", () => {
        const match = mapLeetifyGameToMatch(realGame, ["99999999999999999"]);
        expect(match.players).toHaveLength(0);
    });

    it("attaches the raw playerStats object by reference", () => {
        const match = mapLeetifyGameToMatch(realGame, ["76561197981513573"]);
        expect(match.players[0].raw).toBe(realGame.playerStats?.[0]);
    });

    it("attaches the sibling openingDuelPlayerStats entry", () => {
        const match = mapLeetifyGameToMatch(realGame, ["76561197981513573"]);
        expect(match.players[0].openingDuelRaw?.steam64Id).toBe("76561197981513573");
    });
});
