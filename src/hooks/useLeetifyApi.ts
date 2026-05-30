import { useQueryClient } from "@tanstack/react-query";

import { fetchGame, fetchProfile, mapLeetifyGameToMatch } from "api";
import { LeetifyProfileGame } from "api/types";
import { PLAYERS } from "config";
import {
    getKnownGameIds,
    getMatchesInRange,
    getProfileSnapshotsInRange,
    setPlayerSyncTimestamp,
    upsertMatch,
    upsertProfileSnapshot
} from "db";
import { ProfileSnapshotRecord } from "db/types";
import { aggregatePlayerStats, rangeForPeriod } from "helpers";
import { Match, PlayerConfig, PlayerStats, StatPeriod } from "models";
import { syncStore } from "sync";

import { useApiQuery } from "./useApiQuery";

const TRACKED_STEAM64S = PLAYERS.map(p => p.steam64);

const isPremierEntry = (g: LeetifyProfileGame): boolean =>
    g.dataSource === "matchmaking" && g.isCs2 === true;

const syncPlayer = async (player: PlayerConfig): Promise<void> => {
    let profile;
    try {
        profile = await fetchProfile(player.steam64);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        syncStore.startPlayerSync(player.steam64, 0);
        syncStore.completePlayerSync(player.steam64, { errorMessage: msg });
        return;
    }
    const profileGames = (profile.games ?? []).filter(isPremierEntry);

    for (const pg of profileGames) {
        if (pg.gameId === undefined || pg.gameFinishedAt === undefined) {
            continue;
        }
        await upsertProfileSnapshot({
            gameId: pg.gameId,
            steam64: player.steam64,
            finishedAt: pg.gameFinishedAt,
            skillLevel: pg.skillLevel,
            rankType: pg.rankType,
            partySize: pg.partySize,
            hasBannedPlayer: pg.hasBannedPlayer,
            isCompletedLongMatch: pg.isCompletedLongMatch
        });
    }

    const known = await getKnownGameIds(player.steam64);
    const newGameIds = profileGames
        .filter(g => g.gameId !== undefined && !known.has(g.gameId))
        .map(g => g.gameId);
    syncStore.startPlayerSync(player.steam64, newGameIds.length);

    await Promise.all(newGameIds.map(async id => {
        try {
            const game = await fetchGame(id);
            const match = mapLeetifyGameToMatch(game, TRACKED_STEAM64S);
            await upsertMatch(match);
        } catch (err) {
            console.warn(`Leetify game fetch failed for ${id}:`, err);
        } finally {
            syncStore.advancePlayerSync(player.steam64);
        }
    }));

    await setPlayerSyncTimestamp(player.steam64, player.displayName, new Date().toISOString());
    syncStore.completePlayerSync(player.steam64);
};

const syncAllPlayers = async (): Promise<void> => {
    syncStore.beginSync(PLAYERS);
    try {
        for (const player of PLAYERS) {
            await syncPlayer(player);
        }
    } finally {
        syncStore.endSync();
    }
};

interface AllMatchesQuery {
    period: StatPeriod;
    customRange?: { from: Date; to: Date };
}

const readMatchesFromDb = async (query: AllMatchesQuery): Promise<Match[]> => {
    const { from, to } = query.customRange ?? rangeForPeriod(query.period);
    return await getMatchesInRange(TRACKED_STEAM64S, from, to);
};

export const useAllMatches = (period: StatPeriod, customRange?: { from: Date; to: Date }) =>
    useApiQuery<Match[]>(
        ["matches", period, customRange?.from?.toISOString() ?? null, customRange?.to?.toISOString() ?? null],
        () => readMatchesFromDb({ period, customRange })
    );

export const useProfileSnapshots = (period: StatPeriod, customRange?: { from: Date; to: Date }) =>
    useApiQuery<ProfileSnapshotRecord[]>(
        ["snapshots", period, customRange?.from?.toISOString() ?? null, customRange?.to?.toISOString() ?? null],
        async () => {
            const { from, to } = customRange ?? rangeForPeriod(period);
            return await getProfileSnapshotsInRange(TRACKED_STEAM64S, from, to);
        }
    );

export const useStatsForAllPlayers = (period: StatPeriod, customRange?: { from: Date; to: Date }) => {
    const { data: matches, ...rest } = useAllMatches(period, customRange);
    const stats: PlayerStats[] | undefined =
        matches === undefined
            ? undefined
            : PLAYERS.map(p => aggregatePlayerStats(matches, p.steam64));
    return { data: stats, matches, ...rest };
};

export const useSync = () => {
    const queryClient = useQueryClient();
    return async () => {
        await syncAllPlayers();
        await queryClient.invalidateQueries({ queryKey: ["matches"] });
        await queryClient.invalidateQueries({ queryKey: ["snapshots"] });
    };
};
