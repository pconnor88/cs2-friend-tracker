import { LeetifyGame } from "api/types";
import { getCtRoundsPlayed, getCtRoundsWon, getTRoundsPlayed, getTRoundsWon } from "helpers";
import { Match, MatchPlayer } from "models";

export const mapLeetifyGameToMatch = (
    game: LeetifyGame,
    trackedSteam64s: readonly string[]
): Match => {
    const tracked = new Set(trackedSteam64s);
    const openingDuelByPlayer = new Map(
        (game.openingDuelPlayerStats ?? [])
            .filter(o => o.steam64Id !== undefined)
            .map(o => [o.steam64Id as string, o])
    );

    const players: MatchPlayer[] = (game.playerStats ?? [])
        .filter(raw => raw.steam64Id !== undefined && tracked.has(raw.steam64Id))
        .map(raw => ({
            steam64: raw.steam64Id as string,
            raw,
            openingDuelRaw: openingDuelByPlayer.get(raw.steam64Id as string)
        }));

    let scoreOwn = 0;
    let scoreOpponent = 0;
    let matchResult: Match["matchResult"] = "tie";
    if (players.length > 0) {
        const primary = players[0];
        const own = getCtRoundsWon(primary) + getTRoundsWon(primary);
        const opp =
            (getCtRoundsPlayed(primary) - getCtRoundsWon(primary)) +
            (getTRoundsPlayed(primary) - getTRoundsWon(primary));
        scoreOwn = own;
        scoreOpponent = opp;
        if (own > opp) {
            matchResult = "win";
        } else if (own < opp) {
            matchResult = "loss";
        } else {
            matchResult = "tie";
        }
    } else {
        scoreOwn = game.teamScores?.[0] ?? 0;
        scoreOpponent = game.teamScores?.[1] ?? 0;
    }

    return {
        gameId: game.id,
        mapName: game.mapName ?? "Unknown",
        finishedAt: game.finishedAt ?? new Date(0).toISOString(),
        durationSeconds: 0,
        matchResult,
        scoreOwn,
        scoreOpponent,
        dataSource: game.dataSource ?? "unknown",
        players
    };
};
