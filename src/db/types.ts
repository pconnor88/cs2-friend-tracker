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
