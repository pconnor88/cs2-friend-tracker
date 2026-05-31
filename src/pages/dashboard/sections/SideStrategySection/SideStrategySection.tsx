import { FormattedNumber } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import {
    getCtRoundsPlayed,
    getCtRoundsWon,
    getPlayerRowFromMatch,
    getTRoundsPlayed,
    getTRoundsWon
} from "helpers";
import { useAllMatches } from "hooks";
import { Match, StatPeriod } from "models";

import "./SideStrategySection.scss";

interface SideStrategySectionProps {
    period: StatPeriod;
    mapName?: string;
}

interface SideRow {
    mapName: string;
    matches: number;
    ctRoundsWon: number;
    ctRoundsPlayed: number;
    tRoundsWon: number;
    tRoundsPlayed: number;
    ctWinPercent: number;
    tWinPercent: number;
}

const formatMapName = (mapName: string): string =>
    mapName
        .replace(/^de_/, "")
        .replace(/^cs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const pickPrimaryRow = (match: Match) => {
    for (const player of PLAYERS) {
        const row = getPlayerRowFromMatch(match, player.steam64);
        if (row !== undefined) {
            return row;
        }
    }
    return undefined;
};

const aggregateRows = (matches: Match[]): SideRow[] => {
    const byMap = new Map<string, SideRow>();
    for (const match of matches) {
        const row = pickPrimaryRow(match);
        if (row === undefined) {
            continue;
        }
        const existing = byMap.get(match.mapName) ?? {
            mapName: match.mapName,
            matches: 0,
            ctRoundsWon: 0,
            ctRoundsPlayed: 0,
            tRoundsWon: 0,
            tRoundsPlayed: 0,
            ctWinPercent: 0,
            tWinPercent: 0
        };
        existing.matches += 1;
        existing.ctRoundsWon += getCtRoundsWon(row);
        existing.ctRoundsPlayed += getCtRoundsPlayed(row);
        existing.tRoundsWon += getTRoundsWon(row);
        existing.tRoundsPlayed += getTRoundsPlayed(row);
        byMap.set(match.mapName, existing);
    }
    const out: SideRow[] = [];
    for (const row of byMap.values()) {
        row.ctWinPercent = row.ctRoundsPlayed > 0 ? (row.ctRoundsWon / row.ctRoundsPlayed) * 100 : 0;
        row.tWinPercent = row.tRoundsPlayed > 0 ? (row.tRoundsWon / row.tRoundsPlayed) * 100 : 0;
        out.push(row);
    }
    out.sort((a, b) => b.matches - a.matches);
    return out;
};

export const SideStrategySection = ({ period, mapName }: SideStrategySectionProps) => {
    const { data: matches } = useAllMatches(period);

    if (matches === undefined) {
        return (
            <PageSection
                title="Side strategy"
                description="Squad-wide CT vs T win rate per map. Pick the recommended side on knife round."
            >
                <div className="section-loading">Loading…</div>
            </PageSection>
        );
    }

    const filtered = mapName !== undefined ? matches.filter((m) => m.mapName === mapName) : matches;
    const rows = aggregateRows(filtered);

    return (
        <PageSection
            title="Side strategy"
            description="Squad-wide CT vs T win rate per map. Pick the recommended side on knife round."
        >
            {rows.length === 0 ? (
                <div className="section-empty">No matches in this period.</div>
            ) : (
                <div className="side-strategy-list">
                    {rows.map((row) => {
                        const ctBetter = row.ctWinPercent >= row.tWinPercent;
                        const ctClass = ctBetter
                            ? "side-strategy-ct side-strategy-side-winner"
                            : "side-strategy-ct";
                        const tClass = ctBetter
                            ? "side-strategy-t"
                            : "side-strategy-t side-strategy-side-winner";
                        const pickLabel = ctBetter ? "PICK CT" : "PICK T";
                        const pickClass = ctBetter
                            ? "side-strategy-pick side-strategy-pick-ct"
                            : "side-strategy-pick side-strategy-pick-t";
                        return (
                            <div className="side-strategy-row" key={row.mapName}>
                                <div className="side-strategy-map">
                                    <span className="side-strategy-map-name">
                                        {formatMapName(row.mapName)}
                                    </span>
                                    <span className="side-strategy-map-sub">
                                        <FormattedNumber value={row.matches} /> matches
                                    </span>
                                </div>
                                <div className={ctClass}>
                                    <span className="side-strategy-side-label">CT</span>
                                    <span className="side-strategy-side-value">
                                        <FormattedNumber value={row.ctWinPercent} decimals={1} />%
                                    </span>
                                </div>
                                <div className={tClass}>
                                    <span className="side-strategy-side-label">T</span>
                                    <span className="side-strategy-side-value">
                                        <FormattedNumber value={row.tWinPercent} decimals={1} />%
                                    </span>
                                </div>
                                <span className={pickClass}>{pickLabel}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageSection>
    );
};
