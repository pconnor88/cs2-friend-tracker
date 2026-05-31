import { ReactNode } from "react";

import { FormattedNumber, FormattedPercent } from "components/formatting";
import { PageSection } from "components/layout";
import { RankBadge } from "components/visualisations";
import { PLAYERS } from "config";
import { rankStats } from "helpers";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, Rank, StatPeriod } from "models";

interface AimMechanicsSectionProps {
    period: StatPeriod;
    mapName?: string;
}

type FormatKind =
    | { kind: "number"; decimals: number; prefix?: string; suffix?: string }
    | { kind: "percent"; decimals: number };

interface LeaderboardRowDef {
    label: string;
    extract: (s: PlayerStats) => number;
    higherIsBetter: boolean;
    format: FormatKind;
}

const ROWS: LeaderboardRowDef[] = [
    { label: "HLTV rating", extract: s => s.hltvRating, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Personal perf rating", extract: s => s.personalPerformanceRating, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Pre-aim degrees", extract: s => s.preaimDegrees, higherIsBetter: false, format: { kind: "number", decimals: 1, suffix: "°" } },
    { label: "Reaction time (s)", extract: s => s.reactionTime, higherIsBetter: false, format: { kind: "number", decimals: 3 } },
    { label: "Spray accuracy", extract: s => s.sprayAccuracy, higherIsBetter: true, format: { kind: "percent", decimals: 1 } },
    { label: "Counter-strafe %", extract: s => s.counterStrafingRatio, higherIsBetter: true, format: { kind: "percent", decimals: 1 } },
    { label: "Accuracy when spotted", extract: s => s.accuracyEnemySpotted, higherIsBetter: true, format: { kind: "percent", decimals: 1 } },
    { label: "Head accuracy", extract: s => s.accuracyHead, higherIsBetter: true, format: { kind: "percent", decimals: 1 } },
    { label: "Headshot kill %", extract: s => s.headshotPercent, higherIsBetter: true, format: { kind: "percent", decimals: 1 } },
    { label: "Rounds survived", extract: s => s.roundsSurvivedPercent, higherIsBetter: true, format: { kind: "percent", decimals: 1 } }
];

const renderValue = (value: number, format: FormatKind): ReactNode => {
    if (format.kind === "percent") {
        return <FormattedPercent value={value} decimals={format.decimals} />;
    }
    return (
        <FormattedNumber
            value={value}
            decimals={format.decimals}
            prefix={format.prefix}
            suffix={format.suffix}
        />
    );
};

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

export const AimMechanicsSection = ({ period, mapName }: AimMechanicsSectionProps) => {
    const { data, isLoading } = useStatsForAllPlayers(period, undefined, mapName);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Aim mechanics" action={legend}>
                <div className="section-loading">Loading leaderboard…</div>
            </PageSection>
        );
    }

    const totalMatches = data.reduce((acc, s) => acc + s.matchesPlayed, 0);
    if (totalMatches === 0) {
        return (
            <PageSection title="Aim mechanics" action={legend}>
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Aim mechanics"
            description="Diagnostic metrics — these are coachable. Lower is better for pre-aim and reaction time."
            action={legend}
        >
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
                    const eligible = data.filter(s => s.matchesPlayed > 0);
                    const ranked = rankStats(
                        eligible.map(s => ({ steam64: s.steam64, value: row.extract(s) })),
                        { higherIsBetter: row.higherIsBetter }
                    );
                    const rankByPlayer = new Map(ranked.map(r => [r.steam64, r.rank]));
                    return (
                        <div key={row.label} className="leaderboard-row">
                            <div className="leaderboard-cell leaderboard-cell-label">{row.label}</div>
                            {PLAYERS.map(player => {
                                const stats = data.find(s => s.steam64 === player.steam64);
                                const hasMatches = stats !== undefined && stats.matchesPlayed > 0;
                                if (!hasMatches) {
                                    return (
                                        <div
                                            key={player.steam64}
                                            className="leaderboard-cell leaderboard-cell-numeric leaderboard-cell-empty"
                                        >
                                            —
                                        </div>
                                    );
                                }
                                const value = row.extract(stats);
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
        </PageSection>
    );
};
