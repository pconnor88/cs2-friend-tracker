export interface PlayerStats {
    steam64: string;
    matchesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    winPercent: number;

    rating: number;
    hltvRating: number;
    kd: number;
    adr: number;
    kast: number;
    headshotPercent: number;

    ctWinPercent: number;
    tWinPercent: number;

    openingKillPercent: number;
    openingDeathPercent: number;
    openingAttemptRate: number;

    tradeKillPercent: number;
    tradeDeathPercent: number;

    utilityDamagePerRound: number;
    heDamagePerRound: number;
    molotovDamagePerRound: number;
    flashAssistsPerRound: number;
    enemiesFlashedPerFlash: number;
    flashedDurationPerFlash: number;

    hePerRound: number;
    flashesPerRound: number;
    smokesPerRound: number;
    molotovsPerRound: number;
    flashesLeadingToKillPerMatch: number;
    utilityOnDeathAvg: number;
    friendlyFlashesPerMatch: number;
    friendlyHeDamagePerRound: number;
    friendlyMolotovDamagePerRound: number;

    multiKillsPerMatch: { two: number; three: number; four: number; ace: number };
    multiKills2Total: number;
    multiKills3Total: number;
    multiKills4Total: number;
    multiKills5Total: number;

    preaimDegrees: number;
    sprayAccuracy: number;

    counterStrafingRatio: number;
    accuracyEnemySpotted: number;
    accuracyHead: number;
    reactionTime: number;
    roundsSurvivedPercent: number;
    personalPerformanceRating: number;

    mapBreakdown: {
        mapName: string;
        matches: number;
        kd: number;
        hltvRating: number;
        ctWinPercent: number;
        tWinPercent: number;
        lastPlayedAt: string;
    }[];

    hltvRatingTrend: { finishedAt: string; rating: number }[];
}
