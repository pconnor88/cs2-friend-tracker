export interface LeetifyGamePlayerStats {
    id?: string;
    gameId?: string;
    gameFinishedAt?: string;
    steam64Id?: string;
    name?: string;

    preaim?: number;
    reactionTime?: number;
    accuracy?: number;
    accuracyEnemySpotted?: number;
    accuracyHead?: number;

    shotsFired?: number;
    shotsFiredEnemySpotted?: number;
    shotsHitFoe?: number;
    shotsHitFoeHead?: number;
    shotsHitFriend?: number;
    shotsHitFriendHead?: number;

    utilityOnDeathAvg?: number;

    heFoesDamageAvg?: number;
    heFriendsDamageAvg?: number;
    heThrown?: number;
    molotovThrown?: number;
    smokeThrown?: number;
    smokeThrownCT?: number;
    smokeThrownCTGood?: number;
    smokeThrownCTGoodRatio?: number;
    smokeThrownCTFoes?: number;

    counterStrafingShotsAll?: number;
    counterStrafingShotsBad?: number;
    counterStrafingShotsGood?: number;
    counterStrafingShotsGoodRatio?: number;

    flashbangHitFoe?: number;
    flashbangHitFoeAvgDuration?: number;
    flashbangHitFriend?: number;
    flashbangLeadingToKill?: number;
    flashbangThrown?: number;
    flashAssist?: number;

    score?: number;
    initialTeamNumber?: number;
    mvps?: number;

    ctRoundsWon?: number;
    ctRoundsLost?: number;
    tRoundsWon?: number;
    tRoundsLost?: number;

    sprayAccuracy?: number;
    kast?: number;

    multi2k?: number;
    multi3k?: number;
    multi4k?: number;
    multi5k?: number;

    hltvRating?: number;
    hsp?: number;
    roundsSurvived?: number;
    roundsSurvivedPercentage?: number;
    dpr?: number;
    totalAssists?: number;
    totalDamage?: number;
    totalKills?: number;
    totalDeaths?: number;
    kdRatio?: number;

    tradeKillsSucceeded?: number;
    tradeKillAttempts?: number;
    tradeKillsSuccessPercentage?: number;
    tradeKillOpportunities?: number;
    tradeKillOpportunitiesPerRound?: number;

    tradedDeathsSucceeded?: number;
    tradedDeathAttempts?: number;
    tradedDeathsSuccessPercentage?: number;
    tradedDeathOpportunities?: number;
    tradedDeathsOpportunitiesPerRound?: number;

    leetifyRating?: number;
    personalPerformanceRating?: number;
    ctLeetifyRating?: number;
    tLeetifyRating?: number;

    molotovFoesDamageAvg?: number;
    molotovFriendsDamageAvg?: number;

    isLeaver?: boolean;
    leetifyUserId?: string;
    color?: number;

    [key: string]: unknown;
}

export interface LeetifyOpeningDuel {
    steam64Id?: string;
    openingDuelAttemptsPercentage?: number;
    openingDuelSuccessPercentage?: number;
    openingDuelTradePercentage?: number;
    openingAggressionSuccessRate?: number;
    ctOpeningDuelAttemptsPercentage?: number;
    ctOpeningDuelSuccessPercentage?: number;
    ctOpeningDuelTradePercentage?: number;
    ctOpeningAggressionSuccessRate?: number;
    tOpeningDuelAttemptsPercentage?: number;
    tOpeningDuelSuccessPercentage?: number;
    tOpeningDuelTradePercentage?: number;
    tOpeningAggressionSuccessRate?: number;
    [key: string]: unknown;
}

export interface LeetifyGame {
    id: string;
    finishedAt?: string;
    mapName?: string;
    dataSource?: string;
    isCs2?: boolean;
    status?: string;
    teamScores?: [number, number];
    playerStats?: LeetifyGamePlayerStats[];
    openingDuelPlayerStats?: LeetifyOpeningDuel[];
    hasBannedPlayer?: boolean;
    hasSkeletonStats?: boolean;
    createdAt?: string;
    [key: string]: unknown;
}
