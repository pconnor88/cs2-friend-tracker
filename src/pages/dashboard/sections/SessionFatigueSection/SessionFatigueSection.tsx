import {
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
    getHltvRating,
    getMatchesForPlayer,
    getPlayerRowFromMatch,
    groupByMatchIndexInSession,
    groupMatchesIntoSessions,
    isPlayed
} from "helpers";
import { useAllMatches } from "hooks";
import { Match, StatPeriod } from "models";

import "./SessionFatigueSection.scss";

interface SessionFatigueSectionProps {
    period: StatPeriod;
}

const PLAYER_COLOURS = ["#eda338", "#109856", "#68a3e5"] as const;
const SESSION_GAP_HOURS = 3;
const MIN_SESSIONS_AT_INDEX = 5;

type FatigueRow = { matchIndex: number } & Record<string, number>;

const buildFatigueRows = (matches: Match[]): FatigueRow[] => {
    const perPlayerBuckets = PLAYERS.map(player => {
        const playerMatches = getMatchesForPlayer(matches, player.steam64)
            .filter(m => {
                const row = getPlayerRowFromMatch(m, player.steam64);
                return row !== undefined && isPlayed(row);
            });
        const sessions = groupMatchesIntoSessions(playerMatches, SESSION_GAP_HOURS);
        const buckets = groupByMatchIndexInSession(sessions);
        return { player, buckets, sessionCount: sessions.length };
    });

    const maxIndex = perPlayerBuckets.reduce((max, entry) => {
        for (const key of entry.buckets.keys()) {
            if (key > max) {
                max = key;
            }
        }
        return max;
    }, -1);

    const rows: FatigueRow[] = [];
    for (let index = 0; index <= maxIndex; index++) {
        const reachedCount = perPlayerBuckets.reduce((acc, entry) => {
            const bucket = entry.buckets.get(index);
            return acc + (bucket?.length ?? 0);
        }, 0);
        if (reachedCount < MIN_SESSIONS_AT_INDEX) {
            continue;
        }
        const row: FatigueRow = { matchIndex: index };
        for (const entry of perPlayerBuckets) {
            const bucket = entry.buckets.get(index);
            if (bucket === undefined || bucket.length === 0) {
                continue;
            }
            const ratings: number[] = [];
            for (const match of bucket) {
                const playerRow = getPlayerRowFromMatch(match, entry.player.steam64);
                if (playerRow === undefined) {
                    continue;
                }
                const rating = getHltvRating(playerRow);
                if (rating > 0) {
                    ratings.push(rating);
                }
            }
            if (ratings.length > 0) {
                const sum = ratings.reduce((acc, r) => acc + r, 0);
                row[entry.player.steam64] = sum / ratings.length;
            }
        }
        rows.push(row);
    }
    return rows;
};

const formatMatchIndex = (value: number): string => `Game ${value + 1}`;

const playerNameFor = (key: string): string => {
    const player = PLAYERS.find(p => p.steam64 === key);
    return player?.displayName ?? key;
};

export const SessionFatigueSection = ({ period }: SessionFatigueSectionProps) => {
    const { data, isLoading } = useAllMatches(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Session fatigue">
                <div className="section-loading">Loading session fatigue…</div>
            </PageSection>
        );
    }

    const rows = buildFatigueRows(data);
    if (rows.length === 0) {
        return (
            <PageSection title="Session fatigue">
                <div className="section-empty">Not enough sessions in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Session fatigue"
            description="Per-player HLTV rating by match-index in session. Sessions reset after a 3-hour gap. Tells you when to log off."
        >
            <div className="session-fatigue-chart">
                <div className="session-fatigue-legend">
                    {PLAYERS.map(player => (
                        <span key={player.steam64} className="session-fatigue-legend-item">
                            <span
                                className={`session-fatigue-legend-swatch session-fatigue-legend-swatch-${player.paletteIndex + 1}`}
                                aria-hidden="true"
                            />
                            {player.displayName}
                        </span>
                    ))}
                </div>
                <div className="session-fatigue-canvas">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rows} margin={{ top: 12, right: 32, bottom: 32, left: 12 }}>
                        <CartesianGrid stroke="#252b38" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="matchIndex"
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            tickFormatter={formatMatchIndex}
                            height={60}
                        />
                        <YAxis
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            domain={[0.6, 1.4]}
                            width={32}
                            allowDataOverflow
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
                            labelFormatter={(value: number) => formatMatchIndex(value)}
                            formatter={(value: number, name: string) => [value.toFixed(2), playerNameFor(name)]}
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
                    </LineChart>
                </ResponsiveContainer>
                </div>
            </div>
        </PageSection>
    );
};
