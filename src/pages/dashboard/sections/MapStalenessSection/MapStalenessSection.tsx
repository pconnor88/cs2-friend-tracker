import { FormattedNumber } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, StatPeriod } from "models";

import "./MapStalenessSection.scss";

interface MapStalenessSectionProps {
    period: StatPeriod;
    mapName?: string;
}

interface StalenessRow {
    mapName: string;
    days: number;
    hltvRating: number;
}

const STALE_DAYS = 30;
const POSITIVE_STALE_DAYS = 14;
const POSITIVE_HLTV_MIN = 1.0;

const formatMapName = (mapName: string): string =>
    mapName
        .replace(/^de_/, "")
        .replace(/^cs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const daysSince = (iso: string, now: Date = new Date()): number => {
    const ms = now.getTime() - new Date(iso).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

const buildRows = (stats: PlayerStats | undefined, now: Date): StalenessRow[] => {
    if (stats === undefined) {
        return [];
    }
    const rows: StalenessRow[] = [];
    for (const map of stats.mapBreakdown) {
        if (map.lastPlayedAt === undefined || map.lastPlayedAt === null) {
            continue;
        }
        rows.push({
            mapName: map.mapName,
            days: daysSince(map.lastPlayedAt, now),
            hltvRating: map.hltvRating
        });
    }
    rows.sort((a, b) => b.days - a.days);
    return rows;
};

const rowClass = (row: StalenessRow): string => {
    if (row.days >= POSITIVE_STALE_DAYS && row.hltvRating >= POSITIVE_HLTV_MIN) {
        return "staleness-row staleness-row-positive";
    }
    if (row.days >= STALE_DAYS) {
        return "staleness-row staleness-row-warning";
    }
    return "staleness-row staleness-row-neutral";
};

export const MapStalenessSection = ({ period, mapName }: MapStalenessSectionProps) => {
    const { data } = useStatsForAllPlayers(period, undefined, mapName);
    const now = new Date();

    return (
        <PageSection
            title="Map staleness"
            description="Days since each player last played each map. Stale maps you used to win on are worth re-picking."
        >
            {data === undefined ? (
                <div className="section-loading">Loading…</div>
            ) : (
                <div className="staleness-cards">
                    {PLAYERS.map((player) => {
                        const stats = data.find((s) => s.steam64 === player.steam64);
                        const cardClass = `staleness-card staleness-card-player-${player.paletteIndex + 1}`;
                        const dotClass = `staleness-card-dot staleness-card-dot-${player.paletteIndex + 1}`;
                        const rows = buildRows(stats, now);

                        return (
                            <div className={cardClass} key={player.slug}>
                                <div className="staleness-card-header">
                                    <span className={dotClass} aria-hidden="true" />
                                    <h3 className="staleness-card-name">{player.displayName}</h3>
                                </div>
                                <div className="staleness-card-rows">
                                    {rows.length === 0 ? (
                                        <div className="section-empty">No matches in this period.</div>
                                    ) : (
                                        rows.map((row) => (
                                            <div className={rowClass(row)} key={row.mapName}>
                                                <span className="staleness-row-name">
                                                    {formatMapName(row.mapName)}
                                                </span>
                                                <span className="staleness-row-days">
                                                    <FormattedNumber value={row.days} /> days
                                                </span>
                                                <span className="staleness-row-hltv">
                                                    <FormattedNumber value={row.hltvRating} decimals={2} />
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageSection>
    );
};
