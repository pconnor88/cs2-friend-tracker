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
import { getMatchesForPlayer, getPlayerRowFromMatch, getRating, isPlayed } from "helpers";
import { useIsMobile, useStatsForAllPlayers } from "hooks";
import { Match, StatPeriod } from "models";

import "./LeetifyProgressionSection.scss";

interface LeetifyProgressionSectionProps {
    period: StatPeriod;
}

const PLAYER_COLOURS = ["#eda338", "#109856", "#68a3e5"] as const;

type SeriesRow = { finishedAt: string } & Record<string, number | string | undefined>;

const buildSeriesData = (matches: Match[]): SeriesRow[] => {
    const byDate = new Map<string, SeriesRow>();
    for (const player of PLAYERS) {
        const playerMatches = getMatchesForPlayer(matches, player.steam64);
        const sorted = [...playerMatches].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
        let running = 0;
        for (const match of sorted) {
            const row = getPlayerRowFromMatch(match, player.steam64);
            if (row === undefined || !isPlayed(row)) {
                continue;
            }
            running += getRating(row);
            const dayKey = match.finishedAt.slice(0, 10);
            const seriesRow = byDate.get(dayKey) ?? { finishedAt: dayKey };
            seriesRow[player.steam64] = running;
            byDate.set(dayKey, seriesRow);
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

const formatRating = (value: number): string => value.toFixed(2);

export const LeetifyProgressionSection = ({ period }: LeetifyProgressionSectionProps) => {
    const { matches, isLoading } = useStatsForAllPlayers(period);
    const isMobile = useIsMobile();
    const chartMargin = isMobile
        ? { top: 8, right: 32, bottom: 8, left: 8 }
        : { top: 8, right: 80, bottom: 8, left: 40 };

    if (isLoading || matches === undefined) {
        return (
            <PageSection title="Leetify rating progression">
                <div className="section-loading">Loading progression…</div>
            </PageSection>
        );
    }

    const seriesData = buildSeriesData(matches);
    if (seriesData.length === 0) {
        return (
            <PageSection title="Leetify rating progression">
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Leetify rating progression"
            description="Cumulative Leetify rating change per player over the selected period. Each player starts at 0 and accumulates per-match deltas. Shape and slope matter more than absolute value."
        >
            <div className="leetify-progression-chart">
                <div className="leetify-progression-legend">
                    {PLAYERS.map(player => (
                        <span key={player.steam64} className="leetify-progression-legend-item">
                            <span
                                className={`leetify-progression-legend-swatch leetify-progression-legend-swatch-${player.paletteIndex + 1}`}
                                aria-hidden="true"
                            />
                            {player.displayName}
                        </span>
                    ))}
                </div>
                <div className="leetify-progression-canvas">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={seriesData} margin={chartMargin}>
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
                            width={36}
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
                                return [formatRating(value), player?.displayName ?? name];
                            }}
                        />
                        {PLAYERS.map(player => (
                            <Line
                                key={player.steam64}
                                type="monotone"
                                dataKey={player.steam64}
                                stroke={PLAYER_COLOURS[player.paletteIndex]}
                                strokeWidth={2.5}
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
            </div>
        </PageSection>
    );
};
