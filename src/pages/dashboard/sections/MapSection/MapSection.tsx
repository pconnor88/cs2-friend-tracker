import { useState } from "react";

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

type SortKey = "mapName" | "matches" | "kd" | "hltvRating";
type SortDir = "asc" | "desc";

interface SortState {
    key: SortKey;
    dir: SortDir;
}

const MIN_MATCHES_FOR_HIGHLIGHT = 5;

const DEFAULT_SORT: SortState = { key: "hltvRating", dir: "desc" };

const DEFAULT_DIR_BY_KEY: Record<SortKey, SortDir> = {
    mapName: "asc",
    matches: "desc",
    kd: "desc",
    hltvRating: "desc"
};

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

const sortRows = (rows: MapRow[], sort: SortState): MapRow[] => {
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
        if (sort.key === "mapName") {
            return a.mapName.localeCompare(b.mapName) * sign;
        }
        return (a[sort.key] - b[sort.key]) * sign;
    });
};

const sortIndicator = (active: boolean, dir: SortDir): string => {
    if (!active) {
        return "";
    }
    return dir === "asc" ? " ↑" : " ↓";
};

export const MapSection = ({ period, customRange }: MapSectionProps) => {
    const { data } = useStatsForAllPlayers(period, customRange);
    const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

    const handleHeaderClick = (key: SortKey) => {
        if (sort.key === key) {
            setSort({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
            return;
        }
        setSort({ key, dir: DEFAULT_DIR_BY_KEY[key] });
    };

    const headerButton = (label: string, key: SortKey, alignClass: string) => {
        const active = sort.key === key;
        const className = active
            ? `map-card-head-button ${alignClass} map-card-head-button-active`
            : `map-card-head-button ${alignClass}`;
        return (
            <button
                type="button"
                className={className}
                onClick={() => handleHeaderClick(key)}
                aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
            >
                {label}
                {sortIndicator(active, sort.dir)}
            </button>
        );
    };

    return (
        <PageSection
            title="Maps"
            description="Per-map K/D and HLTV rating. Click a column header to sort all cards."
        >
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
                        const sortedMaps = sortRows(maps, sort);

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
                                    {headerButton("Map", "mapName", "map-card-head-label")}
                                    {headerButton("Games", "matches", "map-card-head-value")}
                                    {headerButton("K/D", "kd", "map-card-head-value")}
                                    {headerButton("HLTV", "hltvRating", "map-card-head-value")}
                                </div>
                                <div className="map-card-rows">
                                    {sortedMaps.length === 0 ? (
                                        <div className="map-row map-row-empty">No matches</div>
                                    ) : (
                                        sortedMaps.map((row) => (
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
