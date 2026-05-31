export interface LeetifyProfileGame {
    gameId: string;
    gameFinishedAt?: string;
    mapName?: string;
    matchResult?: "win" | "loss" | "tie";
    scores?: [number, number];
    dataSource?: string;
    isCs2?: boolean;
    ownTeamSteam64Ids?: string[];
    enemyTeamSteam64Ids?: string[];
    ownTeamTotalLeetifyRatings?: Record<string, number>;
    ownTeamTotalLeetifyRatingRounds?: Record<string, number>;
    ctLeetifyRating?: number;
    ctLeetifyRatingRounds?: number;
    tLeetifyRating?: number;
    tLeetifyRatingRounds?: number;
    elo?: number | null;
    rankType?: number;
    skillLevel?: number;
    preaim?: number;
    reactionTime?: number;
    accuracyHead?: number;
    deaths?: number;
    kills?: number;
    hasBannedPlayer?: boolean;
    partySize?: number;
    isCompletedLongMatch?: boolean;
    [key: string]: unknown;
}

export interface LeetifyRecentGameRatings {
    aim?: number;
    positioning?: number;
    utility?: number;
    clutch?: number;
    opening?: number;
    leetify?: number;
    ctLeetify?: number;
    tLeetify?: number;
    gamesPlayed?: number;
    leetifyRatingRounds?: number;
}

export interface LeetifyPersonalBest {
    gameId?: string;
    skillId: string;
    value: string;
}

export interface LeetifyProfile {
    id?: string;
    name?: string;
    steam64Id?: string;
    games?: LeetifyProfileGame[];
    recentGameRatings?: LeetifyRecentGameRatings;
    personalBestsCs2?: LeetifyPersonalBest[];
    [key: string]: unknown;
}
