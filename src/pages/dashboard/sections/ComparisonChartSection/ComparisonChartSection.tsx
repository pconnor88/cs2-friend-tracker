import { ChangeEvent, useState } from "react";
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
import {
    getAccuracyEnemySpottedOrNull,
    getAccuracyHeadOrNull,
    getAdr,
    getCounterStrafingRatioOrNull,
    getDeaths,
    getFlashAssists,
    getHeadshotPercent,
    getHltvRating,
    getKastOrNull,
    getKills,
    getMatchesForPlayer,
    getMultiKills2,
    getMultiKills3,
    getMultiKills4,
    getPersonalPerformanceRatingOrNull,
    getPlayerRowFromMatch,
    getPreaim,
    getRating,
    getReactionTimeOrNull,
    getRoundsPlayed,
    getRoundsSurvivedPercentOrNull,
    getSprayAccuracy,
    getUtilityDamage,
    isPlayed
} from "helpers";
import { useIsMobile, useStatsForAllPlayers } from "hooks";
import { Match, MatchPlayer, StatPeriod } from "models";

import "./ComparisonChartSection.scss";

interface ComparisonChartSectionProps {
    period: StatPeriod;
}

interface StatDef {
    key: string;
    label: string;
    extract: (p: MatchPlayer) => number | null;
    format: (v: number) => string;
}

const safeKd = (p: MatchPlayer): number | null => {
    const d = getDeaths(p);
    if (d <= 0) {
        return null;
    }
    return getKills(p) / d;
};

const hltvOrNull = (p: MatchPlayer): number | null => {
    const v = getHltvRating(p);
    return v > 0 ? v : null;
};

const utilityPerRound = (p: MatchPlayer): number | null => {
    const r = getRoundsPlayed(p);
    if (r <= 0) {
        return null;
    }
    return getUtilityDamage(p) / r;
};

const STATS: StatDef[] = [
    { key: "hltv", label: "HLTV rating", extract: hltvOrNull, format: v => v.toFixed(2) },
    { key: "leetify", label: "Leetify rating", extract: p => getRating(p), format: v => v.toFixed(3) },
    { key: "personal", label: "Personal perf", extract: getPersonalPerformanceRatingOrNull, format: v => v.toFixed(2) },
    { key: "kd", label: "K/D", extract: safeKd, format: v => v.toFixed(2) },
    { key: "adr", label: "ADR", extract: p => getAdr(p), format: v => v.toFixed(1) },
    { key: "kast", label: "KAST", extract: getKastOrNull, format: v => (v * 100).toFixed(1) + "%" },
    { key: "hs", label: "Headshot %", extract: p => getHeadshotPercent(p), format: v => (v * 100).toFixed(1) + "%" },
    { key: "headAccuracy", label: "Head accuracy", extract: getAccuracyHeadOrNull, format: v => (v * 100).toFixed(1) + "%" },
    { key: "spotted", label: "Acc when spotted", extract: getAccuracyEnemySpottedOrNull, format: v => (v * 100).toFixed(1) + "%" },
    { key: "counterStrafe", label: "Counter-strafe %", extract: getCounterStrafingRatioOrNull, format: v => (v * 100).toFixed(1) + "%" },
    { key: "spray", label: "Spray accuracy", extract: p => getSprayAccuracy(p), format: v => (v * 100).toFixed(1) + "%" },
    { key: "preaim", label: "Pre-aim °", extract: p => getPreaim(p), format: v => v.toFixed(1) + "°" },
    { key: "reaction", label: "Reaction time", extract: getReactionTimeOrNull, format: v => v.toFixed(3) + "s" },
    { key: "utility", label: "Utility dmg / round", extract: utilityPerRound, format: v => v.toFixed(1) },
    { key: "flashAssist", label: "Flash assists", extract: p => getFlashAssists(p), format: v => v.toFixed(0) },
    { key: "multi2", label: "2k count", extract: p => getMultiKills2(p), format: v => v.toFixed(0) },
    { key: "multi3", label: "3k count", extract: p => getMultiKills3(p), format: v => v.toFixed(0) },
    { key: "multi4", label: "4k count", extract: p => getMultiKills4(p), format: v => v.toFixed(0) },
    { key: "roundsSurvived", label: "Rounds survived %", extract: getRoundsSurvivedPercentOrNull, format: v => (v * 100).toFixed(1) + "%" }
];

const PLAYER_SHADES: Record<number, [string, string, string]> = {
    0: ["#eda338", "#ffd9a8", "#804018"],
    1: ["#109856", "#a8f0c6", "#0a5234"],
    2: ["#68a3e5", "#cce5ff", "#1f4570"]
};

interface SeriesPick {
    steam64?: string;
    statKey?: string;
}

interface ResolvedSeries {
    slot: number;
    steam64: string;
    statKey: string;
    statDef: StatDef;
    color: string;
    label: string;
}

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

const dayBucket = (iso: string): string => iso.slice(0, 10);

const buildSeriesPerDay = (
    matches: Match[],
    steam64: string,
    stat: StatDef
): { date: string; value: number }[] => {
    const buckets = new Map<string, { sum: number; count: number }>();
    for (const match of matches) {
        const row = getPlayerRowFromMatch(match, steam64);
        if (row === undefined || !isPlayed(row)) {
            continue;
        }
        const raw = stat.extract(row);
        if (raw === null) {
            continue;
        }
        const key = dayBucket(match.finishedAt);
        const entry = buckets.get(key) ?? { sum: 0, count: 0 };
        entry.sum += raw;
        entry.count += 1;
        buckets.set(key, entry);
    }
    return Array.from(buckets.entries())
        .map(([date, e]) => ({ date, value: e.sum / e.count }))
        .sort((a, b) => a.date.localeCompare(b.date));
};

const computeMinMax = (values: number[]): { min: number; max: number } => {
    if (values.length === 0) {
        return { min: 0, max: 1 };
    }
    let min = values[0];
    let max = values[0];
    for (const v of values) {
        if (v < min) {
            min = v;
        }
        if (v > max) {
            max = v;
        }
    }
    return { min, max };
};

const normalise = (value: number, min: number, max: number): number => {
    if (max === min) {
        return 50;
    }
    return ((value - min) / (max - min)) * 100;
};

const resolvePicks = (picks: SeriesPick[]): ResolvedSeries[] => {
    const resolved: ResolvedSeries[] = [];
    const shadeIndexByPlayer = new Map<string, number>();
    picks.forEach((pick, slot) => {
        if (pick.steam64 === undefined || pick.statKey === undefined) {
            return;
        }
        const statDef = STATS.find(s => s.key === pick.statKey);
        const player = PLAYERS.find(p => p.steam64 === pick.steam64);
        if (statDef === undefined || player === undefined) {
            return;
        }
        const shadeIdx = shadeIndexByPlayer.get(pick.steam64) ?? 0;
        shadeIndexByPlayer.set(pick.steam64, shadeIdx + 1);
        const palette = PLAYER_SHADES[player.paletteIndex];
        resolved.push({
            slot,
            steam64: pick.steam64,
            statKey: pick.statKey,
            statDef,
            color: palette[shadeIdx] ?? palette[2],
            label: `${player.displayName} · ${statDef.label}`
        });
    });
    return resolved;
};

type SeriesRow = { date: string } & Record<string, number | string | undefined>;

const buildChartData = (
    matchesByPlayer: Map<string, Match[]>,
    resolved: ResolvedSeries[]
): SeriesRow[] => {
    const byDate = new Map<string, SeriesRow>();
    for (const series of resolved) {
        const matches = matchesByPlayer.get(series.steam64) ?? [];
        const dailyValues = buildSeriesPerDay(matches, series.steam64, series.statDef);
        const { min, max } = computeMinMax(dailyValues.map(d => d.value));
        for (const point of dailyValues) {
            const row = byDate.get(point.date) ?? { date: point.date };
            row[`series${series.slot}Norm`] = normalise(point.value, min, max);
            row[`series${series.slot}Raw`] = point.value;
            byDate.set(point.date, row);
        }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const ComparisonChartSection = ({ period }: ComparisonChartSectionProps) => {
    const { matches } = useStatsForAllPlayers(period);
    const isMobile = useIsMobile();
    const [picks, setPicks] = useState<SeriesPick[]>([{}, {}, {}]);

    const setPickField = (slot: number, field: "steam64" | "statKey", value: string) => {
        setPicks(current => current.map((p, i) => {
            if (i !== slot) {
                return p;
            }
            return { ...p, [field]: value === "" ? undefined : value };
        }));
    };

    const matchesByPlayer = new Map<string, Match[]>();
    if (matches !== undefined) {
        for (const player of PLAYERS) {
            matchesByPlayer.set(player.steam64, getMatchesForPlayer(matches, player.steam64));
        }
    }

    const resolved = resolvePicks(picks);
    const chartData = buildChartData(matchesByPlayer, resolved);
    const chartMargin = isMobile
        ? { top: 8, right: 32, bottom: 8, left: 8 }
        : { top: 8, right: 80, bottom: 8, left: 40 };

    return (
        <PageSection
            title="Compare trends"
            description="Pick up to 3 player-and-stat pairs. Each series is normalised to 0–100 over its own range so trends are comparable across units. Hover for raw values."
        >
            <div className="comparison-chart">
                <div className="comparison-picker">
                    {picks.map((pick, slot) => (
                        <div className="comparison-pick-row" key={slot}>
                            <label className="comparison-pick-label">
                                <span className="comparison-pick-caption">Player</span>
                                <select
                                    className="comparison-pick-select"
                                    value={pick.steam64 ?? ""}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                        setPickField(slot, "steam64", e.target.value)}
                                >
                                    <option value="">—</option>
                                    {PLAYERS.map(p => (
                                        <option key={p.steam64} value={p.steam64}>{p.displayName}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="comparison-pick-label">
                                <span className="comparison-pick-caption">Stat</span>
                                <select
                                    className="comparison-pick-select"
                                    value={pick.statKey ?? ""}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                        setPickField(slot, "statKey", e.target.value)}
                                >
                                    <option value="">—</option>
                                    {STATS.map(s => (
                                        <option key={s.key} value={s.key}>{s.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    ))}
                </div>
                {resolved.length > 0 && (
                    <div className="comparison-legend">
                        {resolved.map(series => (
                            <span key={series.slot} className="comparison-legend-item">
                                <span
                                    className="comparison-legend-swatch"
                                    aria-hidden="true"
                                    style={{ background: series.color }}
                                />
                                {series.label}
                            </span>
                        ))}
                    </div>
                )}
                <div className="comparison-canvas">
                    {chartData.length === 0 ? (
                        <div className="comparison-empty">
                            Pick a player and a stat above to plot a series.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={chartMargin}>
                                <CartesianGrid stroke="#252b38" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#8a8f9b"
                                    tick={{ fill: "#8a8f9b", fontSize: 12 }}
                                    tickFormatter={formatTick}
                                    height={60}
                                />
                                <YAxis
                                    stroke="#8a8f9b"
                                    tick={{ fill: "#8a8f9b", fontSize: 12 }}
                                    domain={[0, 100]}
                                    width={36}
                                    tickFormatter={v => `${v}`}
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
                                    formatter={(_value: number, name: string, item) => {
                                        if (!name.endsWith("Norm")) {
                                            return [null, null] as unknown as [string, string];
                                        }
                                        const slot = Number(name.replace("series", "").replace("Norm", ""));
                                        const series = resolved.find(s => s.slot === slot);
                                        if (series === undefined) {
                                            return [null, null] as unknown as [string, string];
                                        }
                                        const payload = item.payload as SeriesRow;
                                        const raw = payload[`series${slot}Raw`];
                                        if (typeof raw !== "number") {
                                            return [null, null] as unknown as [string, string];
                                        }
                                        return [series.statDef.format(raw), series.label];
                                    }}
                                />
                                {resolved.map(series => (
                                    <Line
                                        key={series.slot}
                                        type="monotone"
                                        dataKey={`series${series.slot}Norm`}
                                        stroke={series.color}
                                        strokeWidth={2.5}
                                        dot={false}
                                        connectNulls
                                        isAnimationActive={false}
                                        name={`series${series.slot}Norm`}
                                    />
                                ))}
                                <Brush
                                    dataKey="date"
                                    height={28}
                                    stroke="#eda338"
                                    fill="#1a2030"
                                    travellerWidth={12}
                                    tickFormatter={formatBrushTick}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </PageSection>
    );
};
