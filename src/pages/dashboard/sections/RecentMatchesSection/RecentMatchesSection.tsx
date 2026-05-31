import { useEffect, useRef, useState } from "react";

import { FormattedNumber, FormattedPercent, FriendlyDate } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import {
    getAdr,
    getAssists,
    getDeaths,
    getHeadshotPercent,
    getHltvRating,
    getKast,
    getKills,
    getMultiKills2,
    getMultiKills3,
    getMultiKills4,
    getMultiKills5,
    getPlayerRowFromMatch
} from "helpers";
import { useAllMatches } from "hooks";
import { Match, StatPeriod } from "models";

import "./RecentMatchesSection.scss";

interface RecentMatchesSectionProps {
    period: StatPeriod;
    initialCount?: number;
    pageSize?: number;
}

const prettifyMapName = (mapName: string): string =>
    mapName
        .replace(/^de_/, "")
        .replace(/^cs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const getResultToneClass = (result: Match["matchResult"]): string => {
    if (result === "win") {
        return "result-win";
    }
    if (result === "loss") {
        return "result-loss";
    }
    return "result-tie";
};

const formatModeLabel = (dataSource: string): string => {
    if (dataSource === "matchmaking") {
        return "Premier";
    }
    return dataSource.replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatFinishedAt = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const RecentMatchesSection = ({
    period,
    initialCount = 25,
    pageSize = 25
}: RecentMatchesSectionProps) => {
    const { data: matches } = useAllMatches(period);
    const [openId, setOpenId] = useState<string | null>(null);
    const [displayedCount, setDisplayedCount] = useState<number>(initialCount);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setDisplayedCount(initialCount);
    }, [period, initialCount]);

    const totalMatches = matches?.length ?? 0;
    const hasMore = displayedCount < totalMatches;

    useEffect(() => {
        if (!hasMore) {
            return;
        }
        const sentinel = sentinelRef.current;
        if (sentinel === null) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    setDisplayedCount((current) => Math.min(current + pageSize, totalMatches));
                }
            }
        }, { rootMargin: "200px 0px" });
        observer.observe(sentinel);
        return () => {
            observer.disconnect();
        };
    }, [hasMore, pageSize, totalMatches]);

    if (matches === undefined) {
        return (
            <PageSection title="Recent matches" description="Tap a row to expand the scoreboard.">
                <div className="section-loading">Loading recent matches…</div>
            </PageSection>
        );
    }

    if (matches.length === 0) {
        return (
            <PageSection title="Recent matches" description="Tap a row to expand the scoreboard.">
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    const sorted = [...matches]
        .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())
        .slice(0, displayedCount);

    const handleToggle = (gameId: string) => {
        if (openId === gameId) {
            setOpenId(null);
            return;
        }
        setOpenId(gameId);
    };

    return (
        <PageSection title="Recent matches" description="Tap a row to expand the scoreboard.">
            <div className="recent-matches">
                {sorted.map((match) => {
                    const isOpen = openId === match.gameId;
                    const playersInMatch = PLAYERS.filter((p) =>
                        match.players.some((mp) => mp.steam64 === p.steam64)
                    );
                    return (
                        <div key={match.gameId} className="recent-matches-group">
                            <button
                                type="button"
                                className={isOpen ? "recent-matches-row recent-matches-row-open" : "recent-matches-row"}
                                onClick={() => handleToggle(match.gameId)}
                            >
                                <span className="recent-matches-date">
                                    <FriendlyDate iso={match.finishedAt} />
                                </span>
                                <span className="recent-matches-map">{prettifyMapName(match.mapName)}</span>
                                <span className={`recent-matches-score ${getResultToneClass(match.matchResult)}`}>
                                    {match.scoreOwn} – {match.scoreOpponent}
                                </span>
                                <span className="recent-matches-players">
                                    {playersInMatch.map((p) => (
                                        <span key={p.steam64} className="recent-matches-chip">
                                            <span
                                                className={`recent-matches-chip-dot recent-matches-chip-dot-${p.paletteIndex + 1}`}
                                            />
                                            {p.displayName}
                                        </span>
                                    ))}
                                </span>
                                <span
                                    className={
                                        isOpen
                                            ? "recent-matches-chevron recent-matches-chevron-open"
                                            : "recent-matches-chevron"
                                    }
                                    aria-hidden="true"
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path
                                            d="M5 3l4 4-4 4"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </button>
                            {isOpen ? (
                                <div className="recent-matches-body">
                                    <div className="recent-matches-meta">
                                        <span className="recent-matches-meta-item">
                                            {prettifyMapName(match.mapName)}
                                        </span>
                                        <span className="recent-matches-meta-divider" aria-hidden="true">·</span>
                                        <span className="recent-matches-meta-item">
                                            {formatModeLabel(match.dataSource)}
                                        </span>
                                        <span className="recent-matches-meta-divider" aria-hidden="true">·</span>
                                        <span className="recent-matches-meta-item">
                                            {formatFinishedAt(match.finishedAt)}
                                        </span>
                                        <span className="recent-matches-meta-divider" aria-hidden="true">·</span>
                                        <span className={`recent-matches-meta-result ${getResultToneClass(match.matchResult)}`}>
                                            {match.matchResult === "win" ? "Won" : match.matchResult === "loss" ? "Lost" : "Tied"} {match.scoreOwn}–{match.scoreOpponent}
                                        </span>
                                    </div>
                                    <div className="recent-matches-scoreboard">
                                        <div className="recent-matches-scoreboard-head-row">
                                            <span className="recent-matches-scoreboard-head recent-matches-scoreboard-head-name">Player</span>
                                            <span className="recent-matches-scoreboard-head">K</span>
                                            <span className="recent-matches-scoreboard-head">D</span>
                                            <span className="recent-matches-scoreboard-head">A</span>
                                            <span className="recent-matches-scoreboard-head">ADR</span>
                                            <span className="recent-matches-scoreboard-head">HLTV</span>
                                            <span className="recent-matches-scoreboard-head">HS %</span>
                                            <span className="recent-matches-scoreboard-head">KAST</span>
                                            <span className="recent-matches-scoreboard-head">2K</span>
                                            <span className="recent-matches-scoreboard-head">3K</span>
                                            <span className="recent-matches-scoreboard-head">4K</span>
                                            <span className="recent-matches-scoreboard-head">Ace</span>
                                        </div>
                                        {playersInMatch
                                            .map((p) => ({ player: p, row: getPlayerRowFromMatch(match, p.steam64) }))
                                            .filter((entry): entry is { player: typeof entry.player; row: NonNullable<typeof entry.row> } => entry.row !== undefined)
                                            .sort((a, b) => getHltvRating(b.row) - getHltvRating(a.row))
                                            .map(({ player: p, row }) => (
                                                <div
                                                    key={p.steam64}
                                                    className={`recent-matches-scoreboard-row recent-matches-scoreboard-row-${p.paletteIndex + 1}`}
                                                >
                                                    <span className="recent-matches-scoreboard-name">
                                                        {p.displayName}
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getKills(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getDeaths(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getAssists(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getAdr(row)} decimals={1} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getHltvRating(row)} decimals={2} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedPercent value={getHeadshotPercent(row)} decimals={0} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedPercent value={getKast(row)} decimals={0} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getMultiKills2(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getMultiKills3(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getMultiKills4(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getMultiKills5(row)} />
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
                {hasMore ? (
                    <div ref={sentinelRef} className="recent-matches-sentinel" aria-hidden="true">
                        Loading more…
                    </div>
                ) : (
                    <div className="recent-matches-end">
                        End of matches · {totalMatches} shown
                    </div>
                )}
            </div>
        </PageSection>
    );
};
