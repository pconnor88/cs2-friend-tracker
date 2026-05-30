import {
    Brush,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, StatPeriod } from "models";

import "./TrendSection.scss";

interface TrendSectionProps {
    period: StatPeriod;
}

const PLAYER_COLOURS = ["#eda338", "#109856", "#68a3e5"] as const;
const ROLLING_WINDOW = 10;
const RAW_SUFFIX = "-raw";
const AVG_SUFFIX = "-avg";

type SeriesRow = { finishedAt: string } & Record<string, number | string | undefined>;

const computeRollingAverage = (
    trend: { finishedAt: string; rating: number }[],
    window: number
): { finishedAt: string; rating: number }[] =>
    trend.map((point, idx) => {
        const from = Math.max(0, idx - window + 1);
        const slice = trend.slice(from, idx + 1);
        const sum = slice.reduce((acc, p) => acc + p.rating, 0);
        return { finishedAt: point.finishedAt, rating: sum / slice.length };
    });

const buildSeriesData = (allStats: PlayerStats[]): SeriesRow[] => {
    const byDate = new Map<string, SeriesRow>();
    for (const stats of allStats) {
        for (const point of stats.hltvRatingTrend) {
            const dayKey = point.finishedAt.slice(0, 10);
            const row = byDate.get(dayKey) ?? { finishedAt: dayKey };
            row[`${stats.steam64}${RAW_SUFFIX}`] = point.rating;
            byDate.set(dayKey, row);
        }
        const avg = computeRollingAverage(stats.hltvRatingTrend, ROLLING_WINDOW);
        for (const point of avg) {
            const dayKey = point.finishedAt.slice(0, 10);
            const row = byDate.get(dayKey) ?? { finishedAt: dayKey };
            row[`${stats.steam64}${AVG_SUFFIX}`] = point.rating;
            byDate.set(dayKey, row);
        }
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

const playerNameFor = (key: string): string => {
    const steam64 = key.endsWith(AVG_SUFFIX)
        ? key.slice(0, -AVG_SUFFIX.length)
        : key.endsWith(RAW_SUFFIX)
            ? key.slice(0, -RAW_SUFFIX.length)
            : key;
    const player = PLAYERS.find(p => p.steam64 === steam64);
    return player?.displayName ?? key;
};

export const TrendSection = ({ period }: TrendSectionProps) => {
    const { data, isLoading } = useStatsForAllPlayers(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="HLTV rating over time">
                <div className="section-loading">Loading trend…</div>
            </PageSection>
        );
    }

    const seriesData = buildSeriesData(data);
    if (seriesData.length === 0) {
        return (
            <PageSection title="HLTV rating over time">
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="HLTV rating over time"
            description="Per-match HLTV rating across the period. Thick line is the 10-match rolling average."
        >
            <div className="trend-section-chart">
                <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={seriesData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                        <CartesianGrid stroke="#252b38" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="finishedAt"
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            tickFormatter={formatTick}
                        />
                        <YAxis
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            domain={[0.4, 2]}
                            allowDataOverflow
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#1a2030",
                                border: "1px solid #252b38",
                                borderRadius: 8,
                                color: "#e8eaed"
                            }}
                            labelStyle={{ color: "#b8bcc8" }}
                            labelFormatter={formatTick}
                            formatter={(value: number, name: string) => {
                                if (typeof name !== "string" || !name.endsWith(AVG_SUFFIX)) {
                                    return [null, null] as unknown as [string, string];
                                }
                                return [value.toFixed(2), playerNameFor(name)];
                            }}
                        />
                        <Legend
                            formatter={(value: string) => playerNameFor(value)}
                            wrapperStyle={{ color: "#b8bcc8" }}
                            payload={PLAYERS.map(player => ({
                                value: `${player.steam64}${AVG_SUFFIX}`,
                                type: "line",
                                id: player.steam64,
                                color: PLAYER_COLOURS[player.paletteIndex]
                            }))}
                        />
                        {PLAYERS.map(player => (
                            <Line
                                key={`${player.steam64}-raw`}
                                type="monotone"
                                dataKey={`${player.steam64}${RAW_SUFFIX}`}
                                stroke={PLAYER_COLOURS[player.paletteIndex]}
                                strokeWidth={1}
                                strokeOpacity={0.35}
                                dot={false}
                                connectNulls={false}
                                legendType="none"
                                isAnimationActive={false}
                                name={`${player.steam64}${RAW_SUFFIX}`}
                            />
                        ))}
                        {PLAYERS.map(player => (
                            <Line
                                key={`${player.steam64}-avg`}
                                type="monotone"
                                dataKey={`${player.steam64}${AVG_SUFFIX}`}
                                stroke={PLAYER_COLOURS[player.paletteIndex]}
                                strokeWidth={2.5}
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                                name={`${player.steam64}${AVG_SUFFIX}`}
                            />
                        ))}
                        <Brush
                            dataKey="finishedAt"
                            height={28}
                            stroke="#eda338"
                            fill="#1a2030"
                            travellerWidth={12}
                            tickFormatter={formatTick}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </PageSection>
    );
};
