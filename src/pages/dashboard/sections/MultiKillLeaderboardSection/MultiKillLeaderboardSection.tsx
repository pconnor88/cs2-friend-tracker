import { ReactNode } from "react";

import { FormattedNumber } from "components/formatting";
import { PageSection } from "components/layout";
import { RankBadge } from "components/visualisations";
import { PLAYERS } from "config";
import { rankStats } from "helpers";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, Rank, StatPeriod } from "models";

interface MultiKillLeaderboardSectionProps {
    period: StatPeriod;
}

type FormatKind = { kind: "number"; decimals: number };

interface LeaderboardRowDef {
    label: string;
    extract: (s: PlayerStats) => number;
    higherIsBetter: boolean;
    format: FormatKind;
}

const ROWS: LeaderboardRowDef[] = [
    { label: "2k total", extract: s => s.multiKills2Total, higherIsBetter: true, format: { kind: "number", decimals: 0 } },
    { label: "2k per match", extract: s => s.multiKillsPerMatch.two, higherIsBetter: true, format: { kind: "number", decimals: 3 } },
    { label: "3k total", extract: s => s.multiKills3Total, higherIsBetter: true, format: { kind: "number", decimals: 0 } },
    { label: "3k per match", extract: s => s.multiKillsPerMatch.three, higherIsBetter: true, format: { kind: "number", decimals: 3 } },
    { label: "4k total", extract: s => s.multiKills4Total, higherIsBetter: true, format: { kind: "number", decimals: 0 } },
    { label: "4k per match", extract: s => s.multiKillsPerMatch.four, higherIsBetter: true, format: { kind: "number", decimals: 3 } },
    { label: "Ace total", extract: s => s.multiKills5Total, higherIsBetter: true, format: { kind: "number", decimals: 0 } },
    { label: "Ace per match", extract: s => s.multiKillsPerMatch.ace, higherIsBetter: true, format: { kind: "number", decimals: 3 } }
];

const renderValue = (value: number, format: FormatKind): ReactNode => (
    <FormattedNumber value={value} decimals={format.decimals} />
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

export const MultiKillLeaderboardSection = ({ period }: MultiKillLeaderboardSectionProps) => {
    const { data, isLoading } = useStatsForAllPlayers(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Multi-kill leaderboard" action={legend}>
                <div className="section-loading">Loading leaderboard…</div>
            </PageSection>
        );
    }

    const totalMatches = data.reduce((acc, s) => acc + s.matchesPlayed, 0);
    if (totalMatches === 0) {
        return (
            <PageSection title="Multi-kill leaderboard" action={legend}>
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Multi-kill leaderboard"
            description="Totals and per-match averages for 2k, 3k, 4k, and ace rounds."
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
                    const ranked = rankStats(
                        data.map(s => ({ steam64: s.steam64, value: row.extract(s) })),
                        { higherIsBetter: row.higherIsBetter }
                    );
                    const rankByPlayer = new Map(ranked.map(r => [r.steam64, r.rank]));
                    return (
                        <div key={row.label} className="leaderboard-row">
                            <div className="leaderboard-cell leaderboard-cell-label">{row.label}</div>
                            {PLAYERS.map(player => {
                                const stats = data.find(s => s.steam64 === player.steam64);
                                const value = stats !== undefined ? row.extract(stats) : 0;
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
