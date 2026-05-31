import { ReactNode } from "react";

import { FormattedNumber } from "components/formatting";
import { PageSection } from "components/layout";
import { RankBadge } from "components/visualisations";
import { PLAYERS } from "config";
import { PlayerProfileRecord } from "db/types";
import { rankStats } from "helpers";
import { usePlayerProfiles } from "hooks";
import { Rank, StatPeriod } from "models";

interface LeetifyRatingsSectionProps {
    period: StatPeriod;
    mapName?: string;
}

type FormatKind =
    | { kind: "number"; decimals: number; prefix?: string; suffix?: string };

interface LeaderboardRowDef {
    label: string;
    extract: (r: PlayerProfileRecord["recentGameRatings"]) => number | undefined;
    higherIsBetter: boolean;
    format: FormatKind;
}

const ROWS: LeaderboardRowDef[] = [
    { label: "Aim rating", extract: r => r.aim, higherIsBetter: true, format: { kind: "number", decimals: 1 } },
    { label: "Positioning rating", extract: r => r.positioning, higherIsBetter: true, format: { kind: "number", decimals: 1 } },
    { label: "Utility rating", extract: r => r.utility, higherIsBetter: true, format: { kind: "number", decimals: 1 } },
    { label: "Recent Leetify Δ", extract: r => r.leetify, higherIsBetter: true, format: { kind: "number", decimals: 4 } },
    { label: "Recent CT Δ", extract: r => r.ctLeetify, higherIsBetter: true, format: { kind: "number", decimals: 4 } },
    { label: "Recent T Δ", extract: r => r.tLeetify, higherIsBetter: true, format: { kind: "number", decimals: 4 } },
    { label: "Recent clutch Δ", extract: r => r.clutch, higherIsBetter: true, format: { kind: "number", decimals: 4 } },
    { label: "Recent opening Δ", extract: r => r.opening, higherIsBetter: true, format: { kind: "number", decimals: 4 } },
    { label: "Games sample size", extract: r => r.gamesPlayed, higherIsBetter: true, format: { kind: "number", decimals: 0 } }
];

const renderValue = (value: number, format: FormatKind): ReactNode => (
    <FormattedNumber
        value={value}
        decimals={format.decimals}
        prefix={format.prefix}
        suffix={format.suffix}
    />
);

const legend = (
    <div className="leaderboard-legend">
        <span className="leaderboard-legend-item">
            <RankBadge rank={Rank.Gold} size="sm" /> Best
        </span>
        <span className="leaderboard-legend-item">
            <RankBadge rank={Rank.Silver} size="sm" /> Mid
        </span>
        <span className="leaderboard-legend-item">
            <RankBadge rank={Rank.Bronze} size="sm" /> Worst
        </span>
    </div>
);

const hasAnyRating = (r: PlayerProfileRecord["recentGameRatings"]): boolean => {
    if (r.aim !== undefined) {
        return true;
    }
    if (r.positioning !== undefined) {
        return true;
    }
    if (r.utility !== undefined) {
        return true;
    }
    if (r.clutch !== undefined) {
        return true;
    }
    if (r.opening !== undefined) {
        return true;
    }
    if (r.leetify !== undefined) {
        return true;
    }
    if (r.ctLeetify !== undefined) {
        return true;
    }
    if (r.tLeetify !== undefined) {
        return true;
    }
    if (r.gamesPlayed !== undefined) {
        return true;
    }
    if (r.leetifyRatingRounds !== undefined) {
        return true;
    }
    return false;
};

export const LeetifyRatingsSection = ({ period: _period, mapName: _mapName }: LeetifyRatingsSectionProps) => {
    const { data, isLoading } = usePlayerProfiles();

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Leetify ratings" action={legend}>
                <div className="section-loading">Loading leaderboard…</div>
            </PageSection>
        );
    }

    const profileByPlayer = new Map<string, PlayerProfileRecord>();
    for (const profile of data) {
        profileByPlayer.set(profile.steam64, profile);
    }

    const anyEligible = PLAYERS.some(player => {
        const profile = profileByPlayer.get(player.steam64);
        return profile !== undefined && hasAnyRating(profile.recentGameRatings);
    });

    if (!anyEligible) {
        return (
            <PageSection title="Leetify ratings" action={legend}>
                <div className="section-empty">No profile ratings synced yet.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Leetify ratings"
            description="Profile-level running averages. 0–100 scale, refreshed on each sync."
        >
            {legend}
            <div className="leaderboard-grid-wrapper">
                <div className="leaderboard-grid">
                <div className="leaderboard-header leaderboard-cell leaderboard-cell-label">Stat</div>
                {PLAYERS.map(player => (
                    <div
                        key={player.steam64}
                        className={`leaderboard-header leaderboard-cell leaderboard-cell-numeric leaderboard-header-player-${player.paletteIndex + 1}`}
                    >
                        {player.displayName}
                    </div>
                ))}
                {ROWS.map(row => {
                    const inputs: { steam64: string; value: number }[] = [];
                    for (const player of PLAYERS) {
                        const profile = profileByPlayer.get(player.steam64);
                        if (profile === undefined) {
                            continue;
                        }
                        const value = row.extract(profile.recentGameRatings);
                        if (value === undefined) {
                            continue;
                        }
                        inputs.push({ steam64: player.steam64, value });
                    }
                    const ranked = rankStats(inputs, { higherIsBetter: row.higherIsBetter });
                    const rankByPlayer = new Map(ranked.map(r => [r.steam64, r.rank]));
                    return (
                        <div key={row.label} className="leaderboard-row">
                            <div className="leaderboard-cell leaderboard-cell-label">{row.label}</div>
                            {PLAYERS.map(player => {
                                const profile = profileByPlayer.get(player.steam64);
                                const value = profile === undefined
                                    ? undefined
                                    : row.extract(profile.recentGameRatings);
                                if (value === undefined) {
                                    return (
                                        <div
                                            key={player.steam64}
                                            className="leaderboard-cell leaderboard-cell-numeric leaderboard-cell-empty"
                                        >
                                            —
                                        </div>
                                    );
                                }
                                const rank = rankByPlayer.get(player.steam64) ?? Rank.Silver;
                                const classes = [
                                    "leaderboard-cell",
                                    "leaderboard-cell-numeric",
                                    `leaderboard-cell-${rank}`
                                ].join(" ");
                                return (
                                    <div key={player.steam64} className={classes}>
                                        {renderValue(value, row.format)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
                </div>
            </div>
        </PageSection>
    );
};
