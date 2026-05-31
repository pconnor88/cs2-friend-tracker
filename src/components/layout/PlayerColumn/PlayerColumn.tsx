import { FormattedNumber, FormattedPercent } from "components/formatting";
import { StatCard } from "components/layout";
import { PlayerConfig, PlayerStats, Rank } from "models";

import "./PlayerColumn.scss";

interface PlayerColumnProps {
    player: PlayerConfig;
    stats: PlayerStats;
    rankMatches?: Rank;
    rankWinPercent?: Rank;
    rankKd?: Rank;
    rankRating?: Rank;
}

export const PlayerColumn = ({
    player,
    stats,
    rankMatches,
    rankWinPercent,
    rankKd,
    rankRating
}: PlayerColumnProps) => {
    const dotClass = `player-column-dot player-column-dot-${player.paletteIndex + 1}`;
    const noData = stats.matchesPlayed === 0;
    const dash = "—";

    return (
        <div className="player-column">
            <div className="player-column-header">
                <div className="player-column-heading">
                    <span className={dotClass} />
                    <h3 className="player-column-name">{player.displayName}</h3>
                </div>
                <div className="player-column-sub">
                    {noData ? "No matches" : (
                        <>
                            <FormattedNumber value={stats.matchesPlayed} /> matches
                        </>
                    )}
                </div>
            </div>
            <div className="player-column-grid">
                <StatCard
                    label="Matches"
                    value={noData ? dash : <FormattedNumber value={stats.matchesPlayed} />}
                    rank={noData ? undefined : rankMatches}
                />
                <StatCard
                    label="Win %"
                    value={noData ? dash : <FormattedPercent value={stats.winPercent} decimals={1} />}
                    rank={noData ? undefined : rankWinPercent}
                />
                <StatCard
                    label="K/D"
                    value={noData ? dash : <FormattedNumber value={stats.kd} decimals={2} />}
                    rank={noData ? undefined : rankKd}
                />
                <StatCard
                    label="HLTV"
                    value={noData ? dash : <FormattedNumber value={stats.hltvRating} decimals={2} />}
                    sublabel={noData ? undefined : "Avg HLTV rating"}
                    rank={noData ? undefined : rankRating}
                />
            </div>
        </div>
    );
};
