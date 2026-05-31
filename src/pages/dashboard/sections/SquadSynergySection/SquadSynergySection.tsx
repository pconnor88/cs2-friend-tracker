import { ReactNode } from "react";

import { FormattedPercent } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { useAllMatches } from "hooks";
import { Match, StatPeriod } from "models";

import "./SquadSynergySection.scss";

interface SquadSynergySectionProps {
    period: StatPeriod;
    mapName?: string;
}

interface BucketStats {
    matches: number;
    wins: number;
}

interface PairStats extends BucketStats {
    key: string;
    label: string;
}

const PLAYERS_BY_STEAM64 = new Map(PLAYERS.map(p => [p.steam64, p]));

const pairKeyFor = (steam64s: string[]): string => [...steam64s].sort().join(",");

const pairLabelFor = (steam64s: string[]): string => {
    const names = [...steam64s]
        .sort()
        .map(s => PLAYERS_BY_STEAM64.get(s)?.displayName ?? s);
    return names.join(" + ");
};

const winPercent = (stats: BucketStats): number => {
    if (stats.matches === 0) {
        return 0;
    }
    return stats.wins / stats.matches;
};

const winPercentBar = (value: number): ReactNode => {
    const widthPercent = Math.max(0, Math.min(1, value)) * 100;
    return (
        <div className="synergy-row-bar" aria-hidden="true">
            <div className="synergy-row-bar-fill" style={{ width: `${widthPercent}%` }} />
        </div>
    );
};

export const SquadSynergySection = ({ period, mapName }: SquadSynergySectionProps) => {
    const { data, isLoading } = useAllMatches(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Squad synergy">
                <div className="section-loading">Loading synergy…</div>
            </PageSection>
        );
    }

    const matches: Match[] = mapName !== undefined ? data.filter(m => m.mapName === mapName) : data;

    if (matches.length === 0) {
        return (
            <PageSection title="Squad synergy">
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    const solo: BucketStats = { matches: 0, wins: 0 };
    const duo: BucketStats = { matches: 0, wins: 0 };
    const full: BucketStats = { matches: 0, wins: 0 };
    const pairAgg = new Map<string, PairStats>();

    for (const match of matches) {
        const trackedCount = match.players.length;
        const isWin = match.matchResult === "win";
        if (trackedCount === 3) {
            full.matches += 1;
            if (isWin) {
                full.wins += 1;
            }
        } else if (trackedCount === 2) {
            duo.matches += 1;
            if (isWin) {
                duo.wins += 1;
            }
            const steam64s = match.players.map(p => p.steam64);
            const key = pairKeyFor(steam64s);
            const existing = pairAgg.get(key) ?? {
                key,
                label: pairLabelFor(steam64s),
                matches: 0,
                wins: 0
            };
            existing.matches += 1;
            if (isWin) {
                existing.wins += 1;
            }
            pairAgg.set(key, existing);
        } else if (trackedCount === 1) {
            solo.matches += 1;
            if (isWin) {
                solo.wins += 1;
            }
        }
    }

    const stackRows: Array<{ label: string; stats: BucketStats }> = [
        { label: "Full squad", stats: full },
        { label: "Duo", stats: duo },
        { label: "Solo", stats: solo }
    ];

    const pairRows = Array.from(pairAgg.values()).sort(
        (a, b) => winPercent(b) - winPercent(a)
    );

    return (
        <PageSection
            title="Squad synergy"
            description="Win rate by how many of you queued together, and which pair performs best."
        >
            <div className="synergy-grid">
                <div className="synergy-panel">
                    <h3 className="synergy-panel-title">By stack size</h3>
                    <div className="synergy-rows">
                        {stackRows.map(row => {
                            const wp = winPercent(row.stats);
                            return (
                                <div key={row.label} className="synergy-row">
                                    <span className="synergy-row-label">{row.label}</span>
                                    <div className="synergy-row-meta">
                                        <span className="synergy-row-matches">{row.stats.matches} matches</span>
                                        {winPercentBar(wp)}
                                        <span className="synergy-row-winrate">
                                            {row.stats.matches === 0 ? "—" : <FormattedPercent value={wp} decimals={0} />}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="synergy-panel">
                    <h3 className="synergy-panel-title">Best duo</h3>
                    {pairRows.length === 0 ? (
                        <div className="synergy-empty">No duo matches.</div>
                    ) : (
                        <div className="synergy-rows">
                            {pairRows.map(row => {
                                const wp = winPercent(row);
                                return (
                                    <div key={row.key} className="synergy-row">
                                        <span className="synergy-row-label">{row.label}</span>
                                        <div className="synergy-row-meta">
                                            <span className="synergy-row-matches">{row.matches} matches</span>
                                            {winPercentBar(wp)}
                                            <span className="synergy-row-winrate">
                                                <FormattedPercent value={wp} decimals={0} />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageSection>
    );
};
