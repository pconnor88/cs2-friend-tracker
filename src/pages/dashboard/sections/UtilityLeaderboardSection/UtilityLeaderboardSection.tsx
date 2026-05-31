import { ReactNode } from "react";

import { FormattedNumber, FormattedPercent } from "components/formatting";
import { PageSection } from "components/layout";
import { RankBadge } from "components/visualisations";
import { PLAYERS } from "config";
import { rankStats } from "helpers";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, Rank, StatPeriod } from "models";

interface UtilityLeaderboardSectionProps {
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
    { label: "Utility damage / round", extract: s => s.utilityDamagePerRound, higherIsBetter: true, format: { kind: "number", decimals: 1 } },
    { label: "HE damage / round", extract: s => s.heDamagePerRound, higherIsBetter: true, format: { kind: "number", decimals: 1 } },
    { label: "Molotov damage / round", extract: s => s.molotovDamagePerRound, higherIsBetter: true, format: { kind: "number", decimals: 1 } },
    { label: "Flash assists / round", extract: s => s.flashAssistsPerRound, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Enemies flashed per flash", extract: s => s.enemiesFlashedPerFlash, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Flashed duration per flash", extract: s => s.flashedDurationPerFlash, higherIsBetter: true, format: { kind: "number", decimals: 2, suffix: "s" } },
    { label: "Flashes leading to kill / match", extract: s => s.flashesLeadingToKillPerMatch, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "HE thrown / round", extract: s => s.hePerRound, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Flashes thrown / round", extract: s => s.flashesPerRound, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Smokes thrown / round", extract: s => s.smokesPerRound, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Molotovs thrown / round", extract: s => s.molotovsPerRound, higherIsBetter: true, format: { kind: "number", decimals: 2 } },
    { label: "Util $ carried at death", extract: s => s.utilityOnDeathAvg, higherIsBetter: false, format: { kind: "number", decimals: 0, prefix: "$" } },
    { label: "Friendly flashes / match", extract: s => s.friendlyFlashesPerMatch, higherIsBetter: false, format: { kind: "number", decimals: 2 } },
    { label: "Friendly HE dmg / round", extract: s => s.friendlyHeDamagePerRound, higherIsBetter: false, format: { kind: "number", decimals: 2 } },
    { label: "Friendly molly dmg / round", extract: s => s.friendlyMolotovDamagePerRound, higherIsBetter: false, format: { kind: "number", decimals: 2 } }
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

export const UtilityLeaderboardSection = ({ period, mapName }: UtilityLeaderboardSectionProps) => {
    const { data, isLoading } = useStatsForAllPlayers(period, undefined, mapName);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Utility leaderboard" action={legend}>
                <div className="section-loading">Loading leaderboard…</div>
            </PageSection>
        );
    }

    const totalMatches = data.reduce((acc, s) => acc + s.matchesPlayed, 0);
    if (totalMatches === 0) {
        return (
            <PageSection title="Utility leaderboard" action={legend}>
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Utility leaderboard"
            description="Grenade usage, flash effectiveness, and friendly fire ranked across the squad."
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
