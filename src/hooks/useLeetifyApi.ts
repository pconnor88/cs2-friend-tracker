import { useQueryClient } from "@tanstack/react-query";

import { fetchGame, fetchProfile, mapLeetifyGameToMatch } from "api";
import { LeetifyProfileGame } from "api/types";
import { PLAYERS } from "config";
import {
    getAllMatchDays,
    getAllPlayerProfiles,
    getKnownGameIds,
    getMatchesInRange,
    getProfileSnapshotsInRange,
    setPlayerSyncTimestamp,
    upsertMatch,
    upsertPlayerProfile,
    upsertProfileSnapshot
} from "db";
import { PlayerProfileRecord, ProfileSnapshotRecord } from "db/types";
import { aggregatePlayerStats, rangeForPeriod } from "helpers";
import { Match, PlayerConfig, PlayerStats, StatPeriod } from "models";
import { syncStore } from "sync";

import { useApiQuery } from "./useApiQuery";
import { usePeriodAnchor } from "./usePeriodAnchor";

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

    await upsertPlayerProfile({
        steam64: player.steam64,
        updatedAt: new Date().toISOString(),
        recentGameRatings: {
            aim: profile.recentGameRatings?.aim,
            positioning: profile.recentGameRatings?.positioning,
            utility: profile.recentGameRatings?.utility,
            clutch: profile.recentGameRatings?.clutch,
            opening: profile.recentGameRatings?.opening,
            leetify: profile.recentGameRatings?.leetify,
            ctLeetify: profile.recentGameRatings?.ctLeetify,
            tLeetify: profile.recentGameRatings?.tLeetify,
            gamesPlayed: profile.recentGameRatings?.gamesPlayed,
            leetifyRatingRounds: profile.recentGameRatings?.leetifyRatingRounds
        },
        personalBests: (profile.personalBestsCs2 ?? []).map(pb => ({
            gameId: pb.gameId,
            skillId: pb.skillId,
            value: pb.value
        }))
    });

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
    anchor: Date;
}

const readMatchesFromDb = async (query: AllMatchesQuery): Promise<Match[]> => {
    const { from, to } = query.customRange ?? rangeForPeriod(query.period, query.anchor);
    return await getMatchesInRange(TRACKED_STEAM64S, from, to);
};

export const useAllMatches = (period: StatPeriod, customRange?: { from: Date; to: Date }) => {
    const { anchor } = usePeriodAnchor();
    return useApiQuery<Match[]>(
        ["matches", period, anchor.toISOString(), customRange?.from?.toISOString() ?? null, customRange?.to?.toISOString() ?? null],
        () => readMatchesFromDb({ period, customRange, anchor })
    );
};

export const useProfileSnapshots = (period: StatPeriod, customRange?: { from: Date; to: Date }) => {
    const { anchor } = usePeriodAnchor();
    return useApiQuery<ProfileSnapshotRecord[]>(
        ["snapshots", period, anchor.toISOString(), customRange?.from?.toISOString() ?? null, customRange?.to?.toISOString() ?? null],
        async () => {
            const { from, to } = customRange ?? rangeForPeriod(period, anchor);
            return await getProfileSnapshotsInRange(TRACKED_STEAM64S, from, to);
        }
    );
};

export const usePlayerProfiles = () => {
    const { anchor } = usePeriodAnchor();
    return useApiQuery<PlayerProfileRecord[]>(
        ["playerProfiles", anchor.toISOString()],
        () => getAllPlayerProfiles()
    );
};

export const useMatchDays = () =>
    useApiQuery<string[]>(["matchDays"], () => getAllMatchDays(TRACKED_STEAM64S));

export const useStatsForAllPlayers = (
    period: StatPeriod,
    customRange?: { from: Date; to: Date },
    mapName?: string
) => {
    const { data: matches, ...rest } = useAllMatches(period, customRange);
    const filteredMatches =
        matches !== undefined && mapName !== undefined
            ? matches.filter(m => m.mapName === mapName)
            : matches;
    const stats: PlayerStats[] | undefined =
        filteredMatches === undefined
            ? undefined
            : PLAYERS.map(p => aggregatePlayerStats(filteredMatches, p.steam64));
    return { data: stats, matches: filteredMatches, ...rest };
};

export const useSync = () => {
    const queryClient = useQueryClient();
    return async () => {
        await syncAllPlayers();
        await queryClient.invalidateQueries({ queryKey: ["matches"] });
        await queryClient.invalidateQueries({ queryKey: ["snapshots"] });
        await queryClient.invalidateQueries({ queryKey: ["playerProfiles"] });
        await queryClient.invalidateQueries({ queryKey: ["matchDays"] });
    };
};
