import { MatchPlayer } from "models";

const normalise01 = (v: number | undefined): number => {
    if (v === undefined || v === null) {
        return 0;
    }
    return v > 1 ? v / 100 : v;
};

const numberOrNull = (v: number | undefined | null): number | null => {
    if (v === undefined || v === null || !Number.isFinite(v)) {
        return null;
    }
    return v;
};

const normalise01OrNull = (v: number | undefined | null): number | null => {
    const n = numberOrNull(v);
    if (n === null) {
        return null;
    }
    return n > 1 ? n / 100 : n;
};

export const getKills = (p: MatchPlayer): number => p.raw.totalKills ?? 0;
export const getDeaths = (p: MatchPlayer): number => p.raw.totalDeaths ?? 0;
export const getAssists = (p: MatchPlayer): number => p.raw.totalAssists ?? 0;
export const getRating = (p: MatchPlayer): number => p.raw.leetifyRating ?? 0;
export const getHltvRating = (p: MatchPlayer): number => p.raw.hltvRating ?? 0;
export const getAdr = (p: MatchPlayer): number => p.raw.dpr ?? 0;
export const getKast = (p: MatchPlayer): number => normalise01(p.raw.kast);
export const getKastOrNull = (p: MatchPlayer): number | null => {
    const v = p.raw.kast;
    if (v === undefined || v === null || !Number.isFinite(v)) {
        return null;
    }
    return v > 1 ? v / 100 : v;
};
export const getHeadshotPercent = (p: MatchPlayer): number => p.raw.hsp ?? 0;
export const getMvps = (p: MatchPlayer): number => p.raw.mvps ?? 0;

export const getCtRoundsWon = (p: MatchPlayer): number => p.raw.ctRoundsWon ?? 0;
export const getCtRoundsPlayed = (p: MatchPlayer): number =>
    (p.raw.ctRoundsWon ?? 0) + (p.raw.ctRoundsLost ?? 0);
export const getTRoundsWon = (p: MatchPlayer): number => p.raw.tRoundsWon ?? 0;
export const getTRoundsPlayed = (p: MatchPlayer): number =>
    (p.raw.tRoundsWon ?? 0) + (p.raw.tRoundsLost ?? 0);
export const getRoundsPlayed = (p: MatchPlayer): number =>
    getCtRoundsPlayed(p) + getTRoundsPlayed(p);

export const isPlayed = (p: MatchPlayer): boolean =>
    getRoundsPlayed(p) > 0 && getKills(p) + getDeaths(p) > 0;

export const getTradeKills = (p: MatchPlayer): number => p.raw.tradeKillsSucceeded ?? 0;
export const getTradeDeaths = (p: MatchPlayer): number => p.raw.tradedDeathsSucceeded ?? 0;

export const getHeThrown = (p: MatchPlayer): number => p.raw.heThrown ?? 0;
export const getFlashesThrown = (p: MatchPlayer): number => p.raw.flashbangThrown ?? 0;
export const getSmokesThrown = (p: MatchPlayer): number => p.raw.smokeThrown ?? 0;
export const getMolotovsThrown = (p: MatchPlayer): number => p.raw.molotovThrown ?? 0;

export const getHeDamage = (p: MatchPlayer): number =>
    (p.raw.heFoesDamageAvg ?? 0) * getRoundsPlayed(p);
export const getMolotovDamage = (p: MatchPlayer): number =>
    (p.raw.molotovFoesDamageAvg ?? 0) * getRoundsPlayed(p);
export const getUtilityDamage = (p: MatchPlayer): number =>
    getHeDamage(p) + getMolotovDamage(p);

export const getEnemiesFlashed = (p: MatchPlayer): number => p.raw.flashbangHitFoe ?? 0;
export const getFlashAssists = (p: MatchPlayer): number => p.raw.flashAssist ?? 0;
export const getFlashedDuration = (p: MatchPlayer): number =>
    (p.raw.flashbangHitFoeAvgDuration ?? 0) * getEnemiesFlashed(p);

export const getFlashbangLeadingToKill = (p: MatchPlayer): number =>
    p.raw.flashbangLeadingToKill ?? 0;
export const getUtilityOnDeath = (p: MatchPlayer): number =>
    p.raw.utilityOnDeathAvg ?? 0;
export const getFlashbangHitFriend = (p: MatchPlayer): number =>
    p.raw.flashbangHitFriend ?? 0;
export const getHeFriendsDamage = (p: MatchPlayer): number =>
    (p.raw.heFriendsDamageAvg ?? 0) * getRoundsPlayed(p);
export const getMolotovFriendsDamage = (p: MatchPlayer): number =>
    (p.raw.molotovFriendsDamageAvg ?? 0) * getRoundsPlayed(p);

export const getMultiKills2 = (p: MatchPlayer): number => p.raw.multi2k ?? 0;
export const getMultiKills3 = (p: MatchPlayer): number => p.raw.multi3k ?? 0;
export const getMultiKills4 = (p: MatchPlayer): number => p.raw.multi4k ?? 0;
export const getMultiKills5 = (p: MatchPlayer): number => p.raw.multi5k ?? 0;

export const getPreaim = (p: MatchPlayer): number => p.raw.preaim ?? 0;
export const getSprayAccuracy = (p: MatchPlayer): number => normalise01(p.raw.sprayAccuracy);

export const getOpeningKillRate = (p: MatchPlayer): number =>
    p.openingDuelRaw?.openingDuelSuccessPercentage ?? 0;
export const getOpeningAttemptRate = (p: MatchPlayer): number =>
    p.openingDuelRaw?.openingDuelAttemptsPercentage ?? 0;
export const getOpeningDeathRate = (p: MatchPlayer): number =>
    Math.max(0, getOpeningAttemptRate(p) - getOpeningKillRate(p));

export const getCounterStrafingRatio = (p: MatchPlayer): number => p.raw.counterStrafingShotsGoodRatio ?? 0;
export const getCounterStrafingRatioOrNull = (p: MatchPlayer): number | null =>
    normalise01OrNull(p.raw.counterStrafingShotsGoodRatio);

export const getAccuracyEnemySpotted = (p: MatchPlayer): number => p.raw.accuracyEnemySpotted ?? 0;
export const getAccuracyEnemySpottedOrNull = (p: MatchPlayer): number | null =>
    normalise01OrNull(p.raw.accuracyEnemySpotted);

export const getAccuracyHead = (p: MatchPlayer): number => p.raw.accuracyHead ?? 0;
export const getAccuracyHeadOrNull = (p: MatchPlayer): number | null =>
    normalise01OrNull(p.raw.accuracyHead);

export const getReactionTime = (p: MatchPlayer): number => p.raw.reactionTime ?? 0;
export const getReactionTimeOrNull = (p: MatchPlayer): number | null => numberOrNull(p.raw.reactionTime);

export const getRoundsSurvivedPercent = (p: MatchPlayer): number => p.raw.roundsSurvivedPercentage ?? 0;
export const getRoundsSurvivedPercentOrNull = (p: MatchPlayer): number | null =>
    normalise01OrNull(p.raw.roundsSurvivedPercentage);

export const getPersonalPerformanceRating = (p: MatchPlayer): number => p.raw.personalPerformanceRating ?? 0;
export const getPersonalPerformanceRatingOrNull = (p: MatchPlayer): number | null =>
    numberOrNull(p.raw.personalPerformanceRating);
