import { FormattedNumber } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, StatPeriod } from "models";

import "./MapSection.scss";

interface MapSectionProps {
    period: StatPeriod;
    customRange?: { from: Date; to: Date };
}

interface MapRow {
    mapName: string;
    matches: number;
    kd: number;
    hltvRating: number;
}

const MIN_MATCHES_FOR_HIGHLIGHT = 5;

const formatMapName = (mapName: string): string =>
    mapName
        .replace(/^de_/, "")
        .replace(/^cs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

interface MapHighlights {
    bestName?: string;
    worstName?: string;
}

const computeHighlights = (rows: MapRow[]): MapHighlights => {
    const eligible = rows.filter((r) => r.matches >= MIN_MATCHES_FOR_HIGHLIGHT && r.hltvRating > 0);
    if (eligible.length === 0) {
        return {};
    }
    let best = eligible[0];
    let worst = eligible[0];
    for (const row of eligible) {
        if (row.hltvRating > best.hltvRating) {
            best = row;
        }
        if (row.hltvRating < worst.hltvRating) {
            worst = row;
        }
    }
    if (best.mapName === worst.mapName) {
        return { bestName: best.mapName };
    }
    return { bestName: best.mapName, worstName: worst.mapName };
};

const rowClass = (row: MapRow, highlights: MapHighlights): string => {
    if (row.mapName === highlights.bestName) {
        return "map-row map-row-positive";
    }
    if (row.mapName === highlights.worstName) {
        return "map-row map-row-negative";
    }
    return "map-row map-row-neutral";
};

export const MapSection = ({ period, customRange }: MapSectionProps) => {
    const { data } = useStatsForAllPlayers(period, customRange);

    return (
        <PageSection title="Maps" description="Per-map K/D and HLTV rating, with best and worst highlighted per player.">
            {data === undefined ? (
                <div className="section-loading">Loading…</div>
            ) : (
                <div className="map-cards">
                    {PLAYERS.map((player) => {
                        const stats: PlayerStats | undefined = data.find(
                            (s) => s.steam64 === player.steam64
                        );
                        const cardClass = `map-card map-card-player-${player.paletteIndex + 1}`;
                        const dotClass = `map-card-dot map-card-dot-${player.paletteIndex + 1}`;
                        const maps: MapRow[] = stats?.mapBreakdown ?? [];
                        const totalMatches = stats?.matchesPlayed ?? 0;
                        const highlights = computeHighlights(maps);

                        return (
                            <div className={cardClass} key={player.slug}>
                                <div className="map-card-header">
                                    <div className="map-card-heading">
                                        <span className={dotClass} aria-hidden="true" />
                                        <h3 className="map-card-name">{player.displayName}</h3>
                                    </div>
                                    <div className="map-card-sub">
                                        <FormattedNumber value={totalMatches} /> matches
                                    </div>
                                </div>
                                <div className="map-card-grid map-card-grid-head">
                                    <span className="map-card-head-label">Map</span>
                                    <span className="map-card-head-value">Games</span>
                                    <span className="map-card-head-value">K/D</span>
                                    <span className="map-card-head-value">HLTV</span>
                                </div>
                                <div className="map-card-rows">
                                    {maps.length === 0 ? (
                                        <div className="map-row map-row-empty">No matches</div>
                                    ) : (
                                        maps.map((row) => (
                                            <div className={rowClass(row, highlights)} key={row.mapName}>
                                                <span className="map-row-name">
                                                    {formatMapName(row.mapName)}
                                                </span>
                                                <span className="map-row-value">
                                                    <FormattedNumber value={row.matches} />
                                                </span>
                                                <span className="map-row-value">
                                                    <FormattedNumber value={row.kd} decimals={2} />
                                                </span>
                                                <span className="map-row-value">
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
