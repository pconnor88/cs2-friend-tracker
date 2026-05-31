import {
    Brush,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { useProfileSnapshots } from "hooks";
import { StatPeriod } from "models";

import { ProfileSnapshotRecord } from "db/types";

import "./RankTrendSection.scss";

interface RankTrendSectionProps {
    period: StatPeriod;
}

const PLAYER_COLOURS = ["#eda338", "#109856", "#68a3e5"] as const;

type SeriesRow = { finishedAt: string } & Record<string, number | string | undefined>;

const buildSeriesData = (snapshots: ProfileSnapshotRecord[]): SeriesRow[] => {
    const byDate = new Map<string, SeriesRow>();
    for (const snap of snapshots) {
        if (snap.skillLevel === undefined || snap.skillLevel < 300) {
            continue;
        }
        const dayKey = snap.finishedAt.slice(0, 10);
        const row = byDate.get(dayKey) ?? { finishedAt: dayKey };
        row[snap.steam64] = snap.skillLevel;
        byDate.set(dayKey, row);
    }
    return Array.from(byDate.values()).sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
};

const formatTick = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatBrushTick = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    const dd = date.getDate().toString().padStart(2, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const yy = (date.getFullYear() % 100).toString().padStart(2, "0");
    return `${dd}/${mm}/${yy}`;
};

const formatRank = (value: number): string => value.toLocaleString();

export const RankTrendSection = ({ period }: RankTrendSectionProps) => {
    const { data, isLoading } = useProfileSnapshots(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Premier rank over time">
                <div className="section-loading">Loading rank trend…</div>
            </PageSection>
        );
    }

    const seriesData = buildSeriesData(data);
    if (seriesData.length === 0) {
        return (
            <PageSection title="Premier rank over time">
                <div className="section-empty">No Premier rank data in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Premier rank over time"
            description="Leetify-reported CS2 Premier rating per match."
        >
            <div className="rank-trend-section-chart">
                <div className="rank-trend-section-legend">
                    {PLAYERS.map(player => (
                        <span key={player.steam64} className="rank-trend-section-legend-item">
                            <span
                                className={`rank-trend-section-legend-swatch rank-trend-section-legend-swatch-${player.paletteIndex + 1}`}
                                aria-hidden="true"
                            />
                            {player.displayName}
                        </span>
                    ))}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={seriesData} margin={{ top: 8, right: 80, bottom: 8, left: 40 }}>
                        <CartesianGrid stroke="#252b38" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="finishedAt"
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            tickFormatter={formatTick}
                            height={60}
                        />
                        <YAxis
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            domain={["auto", "auto"]}
                            tickFormatter={formatRank}
                        />
                        <Tooltip
                            allowEscapeViewBox={{ x: true, y: true }}
                            wrapperStyle={{ pointerEvents: "none", zIndex: 50 }}
                            contentStyle={{
                                background: "#1a2030",
                                border: "1px solid #252b38",
                                borderRadius: 8,
                                color: "#e8eaed"
                            }}
                            labelStyle={{ color: "#b8bcc8" }}
                            labelFormatter={formatTick}
                            formatter={(value: number, name: string) => {
                                const player = PLAYERS.find(p => p.steam64 === name);
                                return [formatRank(value), player?.displayName ?? name];
                            }}
                        />
                        {PLAYERS.map(player => (
                            <Line
                                key={player.steam64}
                                type="monotone"
                                dataKey={player.steam64}
                                stroke={PLAYER_COLOURS[player.paletteIndex]}
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                                name={player.steam64}
                            />
                        ))}
                        <Brush
                            dataKey="finishedAt"
                            height={28}
                            stroke="#eda338"
                            fill="#1a2030"
                            travellerWidth={12}
                            tickFormatter={formatBrushTick}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </PageSection>
    );
};
