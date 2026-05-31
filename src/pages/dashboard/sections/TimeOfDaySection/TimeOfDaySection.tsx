import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { PageSection } from "components/layout";
import { groupByHourOfDay } from "helpers";
import { useAllMatches } from "hooks";
import { Match, StatPeriod } from "models";

import "./TimeOfDaySection.scss";

interface TimeOfDaySectionProps {
    period: StatPeriod;
}

const BAR_COLOUR = "#eda338";
const MIN_MATCHES_PER_HOUR = 3;

interface HourRow {
    hour: number;
    winRate: number;
    matchCount: number;
}

const buildHourRows = (matches: Match[]): HourRow[] => {
    const buckets = groupByHourOfDay(matches);
    const rows: HourRow[] = [];
    for (let hour = 0; hour < 24; hour++) {
        const bucket = buckets.get(hour);
        if (bucket === undefined || bucket.length < MIN_MATCHES_PER_HOUR) {
            continue;
        }
        const wins = bucket.filter(m => m.matchResult === "win").length;
        rows.push({
            hour,
            winRate: wins / bucket.length,
            matchCount: bucket.length
        });
    }
    return rows;
};

const formatHour = (hour: number): string => `${hour.toString().padStart(2, "0")}:00`;

const formatWinRate = (value: number): string => `${Math.round(value * 100)}%`;

export const TimeOfDaySection = ({ period }: TimeOfDaySectionProps) => {
    const { data, isLoading } = useAllMatches(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Time of day">
                <div className="section-loading">Loading time-of-day stats…</div>
            </PageSection>
        );
    }

    const rows = buildHourRows(data);
    if (rows.length === 0) {
        return (
            <PageSection title="Time of day">
                <div className="section-empty">Not enough matches in this period.</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Time of day"
            description="Squad win rate bucketed by the hour each match finished. Highlights peak hours."
        >
            <div className="time-of-day-chart">
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={rows} margin={{ top: 12, right: 32, bottom: 32, left: 12 }}>
                        <CartesianGrid stroke="#252b38" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="hour"
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            tickFormatter={formatHour}
                            height={60}
                            interval={0}
                        />
                        <YAxis
                            stroke="#8a8f9b"
                            tick={{ fill: "#8a8f9b", fontSize: 12 }}
                            domain={[0, 1]}
                            tickFormatter={formatWinRate}
                        />
                        <Tooltip
                            cursor={{ fill: "#252b38", opacity: 0.3 }}
                            wrapperStyle={{ pointerEvents: "none", zIndex: 50 }}
                            contentStyle={{
                                background: "#1a2030",
                                border: "1px solid #252b38",
                                borderRadius: 8,
                                color: "#e8eaed"
                            }}
                            labelStyle={{ color: "#b8bcc8" }}
                            labelFormatter={(value: number) => formatHour(value)}
                            formatter={(_value: number, _name: string, item) => {
                                const payload = item.payload as HourRow;
                                return [
                                    `${formatWinRate(payload.winRate)} win (${payload.matchCount} match${payload.matchCount === 1 ? "" : "es"})`,
                                    "Win rate"
                                ];
                            }}
                        />
                        <Bar
                            dataKey="winRate"
                            fill={BAR_COLOUR}
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </PageSection>
    );
};
