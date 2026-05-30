import { Match, MatchPlayer, PlayerStats, Rank, RankResult } from "models";

import { getMatchesForPlayer, getPlayerRowFromMatch } from "./MatchHelper";
import {
    getAdr,
    getCtRoundsPlayed,
    getCtRoundsWon,
    getDeaths,
    getEnemiesFlashed,
    getFlashAssists,
    getFlashbangHitFriend,
    getFlashbangLeadingToKill,
    getFlashedDuration,
    getFlashesThrown,
    getHeadshotPercent,
    getHeDamage,
    getHeFriendsDamage,
    getHeThrown,
    getHltvRating,
    getKastOrNull,
    getKills,
    getMolotovDamage,
    getMolotovFriendsDamage,
    getMolotovsThrown,
    getMultiKills2,
    getMultiKills3,
    getMultiKills4,
    getMultiKills5,
    getOpeningAttemptRate,
    getOpeningDeathRate,
    getOpeningKillRate,
    getPreaim,
    getRating,
    getRoundsPlayed,
    getSmokesThrown,
    getSprayAccuracy,
    getTRoundsPlayed,
    getTRoundsWon,
    getTradeDeaths,
    getTradeKills,
    getUtilityDamage,
    getUtilityOnDeath,
    isPlayed
} from "./MatchPlayerView";

export const medianOf = (values: number[]): number => {
    if (values.length === 0) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

export interface RankStatsInput {
    steam64: string;
    value: number;
}

export const rankStats = (
    inputs: RankStatsInput[],
    opts?: { higherIsBetter?: boolean }
): RankResult[] => {
    const higherIsBetter = opts?.higherIsBetter ?? true;
    if (inputs.length === 0) {
        return [];
    }
    const median = medianOf(inputs.map(i => i.value));
    const sorted = [...inputs].sort((a, b) =>
        higherIsBetter ? b.value - a.value : a.value - b.value
    );

    const rankByOrder: Rank[] = [Rank.Gold, Rank.Silver, Rank.Bronze];
    const rankFor = new Map<string, Rank>();
    sorted.forEach((entry, index) => {
        rankFor.set(entry.steam64, rankByOrder[Math.min(index, rankByOrder.length - 1)]);
    });

    const bestValue = sorted[0].value;
    const worstValue = sorted[sorted.length - 1].value;

    return inputs.map(input => ({
        steam64: input.steam64,
        value: input.value,
        rank: rankFor.get(input.steam64) ?? Rank.Silver,
        deltaToMedian: input.value - median,
        isBest: input.value === bestValue,
        isWorst: input.value === worstValue && bestValue !== worstValue
    }));
};

const safeDivide = (numerator: number, denominator: number): number =>
    denominator === 0 ? 0 : numerator / denominator;

const sumPlayerRows = (matches: Match[], steam64: string): MatchPlayer[] => {
    const rows: MatchPlayer[] = [];
    for (const match of matches) {
        const row = getPlayerRowFromMatch(match, steam64);
        if (row !== undefined) {
            rows.push(row);
        }
    }
    return rows;
};

export const aggregatePlayerStats = (allMatches: Match[], steam64: string): PlayerStats => {
    const playerMatches = getMatchesForPlayer(allMatches, steam64).filter(m => {
        const row = getPlayerRowFromMatch(m, steam64);
        return row !== undefined && isPlayed(row);
    });
    const rows = sumPlayerRows(playerMatches, steam64);

    const matchesPlayed = playerMatches.length;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    for (const m of playerMatches) {
        if (m.matchResult === "win") {
            wins++;
        } else if (m.matchResult === "loss") {
            losses++;
        } else {
            ties++;
        }
    }

    let kills = 0;
    let deaths = 0;
    let adrSum = 0;
    let kastSum = 0;
    let kastCount = 0;
    let hsSum = 0;
    let ratingSum = 0;
    let hltvRatingSum = 0;
    let ctWon = 0;
    let ctPlayed = 0;
    let tWon = 0;
    let tPlayed = 0;
    let openingKillRateSum = 0;
    let openingDeathRateSum = 0;
    let openingAttemptRateSum = 0;
    let openingWeightSum = 0;
    let tradeKills = 0;
    let tradeDeaths = 0;
    let utilityDamage = 0;
    let heDamage = 0;
    let molotovDamage = 0;
    let heThrown = 0;
    let flashesThrown = 0;
    let smokesThrown = 0;
    let molotovsThrown = 0;
    let enemiesFlashed = 0;
    let flashAssists = 0;
    let flashedDuration = 0;
    let heFriendsDamage = 0;
    let molotovFriendsDamage = 0;
    let friendlyFlashes = 0;
    let flashesLeadingToKill = 0;
    let utilityOnDeathSum = 0;
    let preaimSum = 0;
    let sprayAccuracySum = 0;
    let multi2 = 0;
    let multi3 = 0;
    let multi4 = 0;
    let multi5 = 0;

    for (const row of rows) {
        const rounds = getRoundsPlayed(row);
        kills += getKills(row);
        deaths += getDeaths(row);
        adrSum += getAdr(row);
        const kastValue = getKastOrNull(row);
        if (kastValue !== null) {
            kastSum += kastValue;
            kastCount += 1;
        }
        hsSum += getHeadshotPercent(row);
        ratingSum += getRating(row);
        hltvRatingSum += getHltvRating(row);
        ctWon += getCtRoundsWon(row);
        ctPlayed += getCtRoundsPlayed(row);
        tWon += getTRoundsWon(row);
        tPlayed += getTRoundsPlayed(row);
        openingKillRateSum += getOpeningKillRate(row) * rounds;
        openingDeathRateSum += getOpeningDeathRate(row) * rounds;
        openingAttemptRateSum += getOpeningAttemptRate(row) * rounds;
        openingWeightSum += rounds;
        tradeKills += getTradeKills(row);
        tradeDeaths += getTradeDeaths(row);
        utilityDamage += getUtilityDamage(row);
        heDamage += getHeDamage(row);
        molotovDamage += getMolotovDamage(row);
        heThrown += getHeThrown(row);
        flashesThrown += getFlashesThrown(row);
        smokesThrown += getSmokesThrown(row);
        molotovsThrown += getMolotovsThrown(row);
        enemiesFlashed += getEnemiesFlashed(row);
        flashAssists += getFlashAssists(row);
        flashedDuration += getFlashedDuration(row);
        heFriendsDamage += getHeFriendsDamage(row);
        molotovFriendsDamage += getMolotovFriendsDamage(row);
        friendlyFlashes += getFlashbangHitFriend(row);
        flashesLeadingToKill += getFlashbangLeadingToKill(row);
        utilityOnDeathSum += getUtilityOnDeath(row);
        preaimSum += getPreaim(row);
        sprayAccuracySum += getSprayAccuracy(row);
        multi2 += getMultiKills2(row);
        multi3 += getMultiKills3(row);
        multi4 += getMultiKills4(row);
        multi5 += getMultiKills5(row);
    }

    const totalRounds = ctPlayed + tPlayed;

    const mapAgg = new Map<string, {
        matches: number;
        kills: number;
        deaths: number;
        hltvSum: number;
        hltvCount: number;
    }>();
    for (const m of playerMatches) {
        const entry = mapAgg.get(m.mapName) ?? {
            matches: 0, kills: 0, deaths: 0, hltvSum: 0, hltvCount: 0
        };
        entry.matches += 1;
        const row = getPlayerRowFromMatch(m, steam64);
        if (row !== undefined) {
            entry.kills += getKills(row);
            entry.deaths += getDeaths(row);
            const hltv = row.raw.hltvRating;
            if (typeof hltv === "number" && Number.isFinite(hltv) && hltv > 0) {
                entry.hltvSum += hltv;
                entry.hltvCount += 1;
            }
        }
        mapAgg.set(m.mapName, entry);
    }

    const mapBreakdown = Array.from(mapAgg.entries())
        .map(([mapName, e]) => ({
            mapName,
            matches: e.matches,
            kd: safeDivide(e.kills, e.deaths),
            hltvRating: safeDivide(e.hltvSum, e.hltvCount)
        }))
        .sort((a, b) => a.mapName.localeCompare(b.mapName));

    const hltvRatingTrend = playerMatches
        .map(m => {
            const row = getPlayerRowFromMatch(m, steam64);
            if (row === undefined) {
                return undefined;
            }
            const rating = getHltvRating(row);
            if (rating <= 0) {
                return undefined;
            }
            return { finishedAt: m.finishedAt, rating };
        })
        .filter((x): x is { finishedAt: string; rating: number } => x !== undefined)
        .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime());

    return {
        steam64,
        matchesPlayed,
        wins,
        losses,
        ties,
        winPercent: safeDivide(wins, matchesPlayed),
        rating: safeDivide(ratingSum, rows.length),
        hltvRating: safeDivide(hltvRatingSum, rows.length),
        kd: safeDivide(kills, deaths),
        adr: safeDivide(adrSum, rows.length),
        kast: safeDivide(kastSum, kastCount),
        headshotPercent: safeDivide(hsSum, rows.length),
        ctWinPercent: safeDivide(ctWon, ctPlayed),
        tWinPercent: safeDivide(tWon, tPlayed),
        openingKillPercent: safeDivide(openingKillRateSum, openingWeightSum),
        openingDeathPercent: safeDivide(openingDeathRateSum, openingWeightSum),
        openingAttemptRate: safeDivide(openingAttemptRateSum, openingWeightSum),
        tradeKillPercent: safeDivide(tradeKills, totalRounds),
        tradeDeathPercent: safeDivide(tradeDeaths, totalRounds),
        utilityDamagePerRound: safeDivide(utilityDamage, totalRounds),
        heDamagePerRound: safeDivide(heDamage, totalRounds),
        molotovDamagePerRound: safeDivide(molotovDamage, totalRounds),
        flashAssistsPerRound: safeDivide(flashAssists, totalRounds),
        enemiesFlashedPerFlash: safeDivide(enemiesFlashed, flashesThrown),
        flashedDurationPerFlash: safeDivide(flashedDuration, flashesThrown),
        hePerRound: safeDivide(heThrown, totalRounds),
        flashesPerRound: safeDivide(flashesThrown, totalRounds),
        smokesPerRound: safeDivide(smokesThrown, totalRounds),
        molotovsPerRound: safeDivide(molotovsThrown, totalRounds),
        flashesLeadingToKillPerMatch: safeDivide(flashesLeadingToKill, matchesPlayed),
        utilityOnDeathAvg: safeDivide(utilityOnDeathSum, rows.length),
        friendlyFlashesPerMatch: safeDivide(friendlyFlashes, matchesPlayed),
        friendlyHeDamagePerRound: safeDivide(heFriendsDamage, totalRounds),
        friendlyMolotovDamagePerRound: safeDivide(molotovFriendsDamage, totalRounds),
        multiKillsPerMatch: {
            two: safeDivide(multi2, matchesPlayed),
            three: safeDivide(multi3, matchesPlayed),
            four: safeDivide(multi4, matchesPlayed),
            ace: safeDivide(multi5, matchesPlayed)
        },
        multiKills2Total: multi2,
        multiKills3Total: multi3,
        multiKills4Total: multi4,
        multiKills5Total: multi5,
        preaimDegrees: safeDivide(preaimSum, rows.length),
        sprayAccuracy: safeDivide(sprayAccuracySum, rows.length),
        mapBreakdown,
        hltvRatingTrend
    };
};
