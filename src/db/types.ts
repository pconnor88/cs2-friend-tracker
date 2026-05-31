export interface PlayerSyncRecord {
    steam64: string;
    displayName: string;
    lastSyncAt: string;
}

export interface MatchPlayerLink {
    id?: number;
    gameId: string;
    steam64: string;
    finishedAt: string;
}

export interface ProfileSnapshotRecord {
    id?: number;
    gameId: string;
    steam64: string;
    finishedAt: string;
    skillLevel?: number;
    rankType?: number;
    partySize?: number;
    hasBannedPlayer?: boolean;
    isCompletedLongMatch?: boolean;
}

export interface PlayerProfileRecord {
    steam64: string;
    updatedAt: string;
    recentGameRatings: {
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
    };
    personalBests: { gameId?: string; skillId: string; value: string }[];
}
