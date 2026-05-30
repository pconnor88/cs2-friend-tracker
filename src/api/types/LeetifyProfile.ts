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

export interface LeetifyProfile {
    id?: string;
    name?: string;
    steam64Id?: string;
    games?: LeetifyProfileGame[];
    [key: string]: unknown;
}
