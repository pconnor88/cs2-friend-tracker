import Dexie, { Table } from "dexie";

import { MatchPlayerLink, PlayerSyncRecord, ProfileSnapshotRecord } from "db/types";
import { Match } from "models";

class MatchDb extends Dexie {
    matches!: Table<Match, string>;
    players!: Table<PlayerSyncRecord, string>;
    matchPlayers!: Table<MatchPlayerLink, number>;
    profileSnapshots!: Table<ProfileSnapshotRecord, number>;

    constructor() {
        super("cs2-friend-tracker");
        this.version(1).stores({
            matches: "gameId, finishedAt, mapName",
            players: "steam64",
            matchPlayers: "++id, gameId, steam64, finishedAt, [gameId+steam64]"
        });
        this.version(2).stores({
            matches: "gameId, finishedAt, mapName",
            players: "steam64",
            matchPlayers: "++id, gameId, steam64, finishedAt, [gameId+steam64]",
            profileSnapshots: "++id, [gameId+steam64], steam64, finishedAt, gameId"
        });
    }
}

const db = new MatchDb();

export const getKnownGameIds = async (steam64: string): Promise<Set<string>> => {
    const links = await db.matchPlayers.where("steam64").equals(steam64).toArray();
    return new Set(links.map(l => l.gameId));
};

export const upsertMatch = async (match: Match): Promise<void> => {
    await db.transaction("rw", db.matches, db.matchPlayers, async () => {
        await db.matches.put(match);
        for (const player of match.players) {
            const exists = await db.matchPlayers
                .where("[gameId+steam64]")
                .equals([match.gameId, player.steam64])
                .first();
            if (exists === undefined) {
                await db.matchPlayers.add({
                    gameId: match.gameId,
                    steam64: player.steam64,
                    finishedAt: match.finishedAt
                });
            }
        }
    });
};

export const upsertProfileSnapshot = async (snap: ProfileSnapshotRecord): Promise<void> => {
    await db.transaction("rw", db.profileSnapshots, async () => {
        const existing = await db.profileSnapshots
            .where("[gameId+steam64]")
            .equals([snap.gameId, snap.steam64])
            .first();
        if (existing === undefined) {
            await db.profileSnapshots.add(snap);
        } else {
            await db.profileSnapshots.update(existing.id as number, snap);
        }
    });
};

export const getProfileSnapshotsInRange = async (
    steam64s: readonly string[],
    from: Date,
    to: Date
): Promise<ProfileSnapshotRecord[]> => {
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const all = await db.profileSnapshots
        .where("finishedAt")
        .between(fromIso, toIso, true, true)
        .toArray();
    const wanted = new Set(steam64s);
    return all.filter(s => wanted.has(s.steam64));
};

export const getMatchesInRange = async (
    steam64s: readonly string[],
    from: Date,
    to: Date
): Promise<Match[]> => {
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const links = await db.matchPlayers
        .where("finishedAt")
        .between(fromIso, toIso, true, true)
        .toArray();
    const wantedSteam64s = new Set(steam64s);
    const gameIds = new Set(links.filter(l => wantedSteam64s.has(l.steam64)).map(l => l.gameId));
    if (gameIds.size === 0) {
        return [];
    }
    const matches = await db.matches.bulkGet(Array.from(gameIds));
    return matches.filter((m): m is Match => m !== undefined);
};

export const setPlayerSyncTimestamp = async (
    steam64: string,
    displayName: string,
    isoNow: string
): Promise<void> => {
    await db.players.put({ steam64, displayName, lastSyncAt: isoNow });
};

export const getPlayerSync = (steam64: string): Promise<PlayerSyncRecord | undefined> =>
    db.players.get(steam64);

export interface DbExport {
    version: number;
    exportedAt: string;
    matches: Match[];
    players: PlayerSyncRecord[];
    matchPlayers: MatchPlayerLink[];
    profileSnapshots: ProfileSnapshotRecord[];
}

const EXPORT_VERSION = 1;

export const exportAll = async (): Promise<DbExport> => {
    const [matches, players, matchPlayers, profileSnapshots] = await Promise.all([
        db.matches.toArray(),
        db.players.toArray(),
        db.matchPlayers.toArray(),
        db.profileSnapshots.toArray()
    ]);
    return {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        matches,
        players,
        matchPlayers,
        profileSnapshots
    };
};

export const importAll = async (payload: DbExport): Promise<void> => {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid import payload: expected an object.");
    }
    if (payload.version !== EXPORT_VERSION) {
        throw new Error(`Unsupported export version ${payload.version}; expected ${EXPORT_VERSION}.`);
    }
    if (!Array.isArray(payload.matches)
        || !Array.isArray(payload.players)
        || !Array.isArray(payload.matchPlayers)
        || !Array.isArray(payload.profileSnapshots)) {
        throw new Error("Invalid import payload: missing one of matches / players / matchPlayers / profileSnapshots.");
    }
    await db.transaction(
        "rw",
        db.matches,
        db.players,
        db.matchPlayers,
        db.profileSnapshots,
        async () => {
            await db.matches.clear();
            await db.players.clear();
            await db.matchPlayers.clear();
            await db.profileSnapshots.clear();
            await db.matches.bulkPut(payload.matches);
            await db.players.bulkPut(payload.players);
            await db.matchPlayers.bulkPut(payload.matchPlayers);
            await db.profileSnapshots.bulkPut(payload.profileSnapshots);
        }
    );
};

export const clearAll = async (): Promise<void> => {
    await db.transaction(
        "rw",
        db.matches,
        db.players,
        db.matchPlayers,
        db.profileSnapshots,
        async () => {
            await db.matches.clear();
            await db.players.clear();
            await db.matchPlayers.clear();
            await db.profileSnapshots.clear();
        }
    );
};

export const purgeNonPremier = async (): Promise<number> => {
    const all = await db.matches.toArray();
    const nonPremier = all.filter(m => m.dataSource !== "matchmaking");
    if (nonPremier.length === 0) {
        return 0;
    }
    const ids = nonPremier.map(m => m.gameId);
    await db.transaction("rw", db.matches, db.matchPlayers, async () => {
        await db.matches.bulkDelete(ids);
        const links = await db.matchPlayers.where("gameId").anyOf(ids).toArray();
        const linkIds = links
            .map(l => l.id)
            .filter((id): id is number => id !== undefined);
        if (linkIds.length > 0) {
            await db.matchPlayers.bulkDelete(linkIds);
        }
    });
    return nonPremier.length;
};
