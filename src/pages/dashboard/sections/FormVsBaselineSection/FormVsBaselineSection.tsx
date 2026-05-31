import { ReactNode } from "react";

import { FormattedNumber, FormattedPercent, StatDelta } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { usePeriodAnchor, useStatsForAllPlayers } from "hooks";
import { PlayerStats, StatPeriod } from "models";

import "./FormVsBaselineSection.scss";

interface FormVsBaselineSectionProps {
    period: StatPeriod;
    mapName?: string;
}

type MetricFormat = "number2" | "percent" | "number1";

interface MetricDef {
    label: string;
    extract: (s: PlayerStats) => number;
    format: MetricFormat;
}

const METRICS: MetricDef[] = [
    { label: "HLTV", extract: s => s.hltvRating, format: "number2" },
    { label: "K/D", extract: s => s.kd, format: "number2" },
    { label: "Win %", extract: s => s.winPercent, format: "percent" },
    { label: "ADR", extract: s => s.adr, format: "number1" }
];

const daysAgo = (n: number, from: Date): Date => {
    const d = new Date(from);
    d.setDate(from.getDate() - n);
    return d;
};

const renderMetricValue = (value: number, format: MetricFormat): ReactNode => {
    if (format === "percent") {
        return <FormattedPercent value={value} decimals={1} />;
    }
    if (format === "number1") {
        return <FormattedNumber value={value} decimals={1} />;
    }
    return <FormattedNumber value={value} decimals={2} />;
};

const deltaDecimalsFor = (format: MetricFormat): number => {
    if (format === "number1") {
        return 1;
    }
    return 2;
};

export const FormVsBaselineSection = ({ period, mapName }: FormVsBaselineSectionProps) => {
    const { anchor } = usePeriodAnchor();
    const baselineRange = { from: daysAgo(90, anchor), to: anchor };

    const { data: currentData, isLoading: currentLoading } = useStatsForAllPlayers(period, undefined, mapName);
    const { data: baselineData, isLoading: baselineLoading } = useStatsForAllPlayers(
        StatPeriod.AllTime,
        baselineRange,
        mapName
    );

    if (currentLoading || baselineLoading || currentData === undefined || baselineData === undefined) {
        return (
            <PageSection title="Form vs baseline">
                <div className="section-loading">Loading form…</div>
            </PageSection>
        );
    }

    return (
        <PageSection
            title="Form vs baseline"
            description="Each player's current-period stats compared to their 90-day baseline. Up arrow = in form, down arrow = slump."
        >
            <div className="form-baseline-grid">
                {PLAYERS.map(player => {
                    const current = currentData.find(s => s.steam64 === player.steam64);
                    const baseline = baselineData.find(s => s.steam64 === player.steam64);
                    const hasCurrent = current !== undefined && current.matchesPlayed > 0;
                    const hasBaseline = baseline !== undefined && baseline.matchesPlayed > 0;
                    const dotClass = `form-baseline-card-dot form-baseline-card-dot-${player.paletteIndex + 1}`;

                    return (
                        <div key={player.steam64} className="form-baseline-card">
                            <div className="form-baseline-card-header">
                                <span className={dotClass} aria-hidden="true" />
                                <h3 className="form-baseline-card-name">{player.displayName}</h3>
                            </div>
                            {!hasCurrent ? (
                                <div className="form-baseline-empty">No matches</div>
                            ) : (
                                <div className="form-baseline-rows">
                                    {METRICS.map(metric => {
                                        const currentValue = metric.extract(current);
                                        return (
                                            <div key={metric.label} className="form-baseline-row">
                                                <span className="form-baseline-row-label">{metric.label}</span>
                                                <span className="form-baseline-row-value">
                                                    {renderMetricValue(currentValue, metric.format)}
                                                </span>
                                                {hasBaseline ? (
                                                    <StatDelta
                                                        delta={currentValue - metric.extract(baseline)}
                                                        decimals={deltaDecimalsFor(metric.format)}
                                                        positiveIsGood
                                                    />
                                                ) : (
                                                    <span className="form-baseline-row-delta-empty">—</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </PageSection>
    );
};
