import { useState } from "react";

import { FormattedNumber, FormattedPercent, FriendlyDate } from "components/formatting";
import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import {
    getAdr,
    getAssists,
    getDeaths,
    getKast,
    getKills,
    getPlayerRowFromMatch,
    getRating
} from "helpers";
import { useAllMatches } from "hooks";
import { Match, StatPeriod } from "models";

import "./RecentMatchesSection.scss";

interface RecentMatchesSectionProps {
    period: StatPeriod;
    limit?: number;
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

export const RecentMatchesSection = ({ period, limit = 25 }: RecentMatchesSectionProps) => {
    const { data: matches } = useAllMatches(period);
    const [openId, setOpenId] = useState<string | null>(null);

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
        .slice(0, limit);

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
                                    <div className="recent-matches-scoreboard">
                                        <div className="recent-matches-scoreboard-head">Player</div>
                                        <div className="recent-matches-scoreboard-head">K</div>
                                        <div className="recent-matches-scoreboard-head">D</div>
                                        <div className="recent-matches-scoreboard-head">A</div>
                                        <div className="recent-matches-scoreboard-head">ADR</div>
                                        <div className="recent-matches-scoreboard-head">KAST</div>
                                        <div className="recent-matches-scoreboard-head">Rating</div>
                                        {playersInMatch.map((p) => {
                                            const row = getPlayerRowFromMatch(match, p.steam64);
                                            if (row === undefined) {
                                                return null;
                                            }
                                            return (
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
                                                        <FormattedPercent value={getKast(row)} />
                                                    </span>
                                                    <span className="recent-matches-scoreboard-cell">
                                                        <FormattedNumber value={getRating(row)} decimals={2} />
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </PageSection>
    );
};
