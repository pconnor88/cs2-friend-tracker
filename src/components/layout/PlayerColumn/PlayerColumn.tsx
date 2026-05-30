import { FormattedNumber, FormattedPercent } from "components/formatting";
import { StatCard } from "components/layout";
import { PlayerConfig, PlayerStats, Rank } from "models";

import "./PlayerColumn.scss";

interface PlayerColumnProps {
    player: PlayerConfig;
    stats: PlayerStats;
    rankMatches: Rank;
    rankWinPercent: Rank;
    rankKd: Rank;
    rankRating: Rank;
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

    return (
        <div className="player-column">
            <div className="player-column-header">
                <div className="player-column-heading">
                    <span className={dotClass} />
                    <h3 className="player-column-name">{player.displayName}</h3>
                </div>
                <div className="player-column-sub">
                    <FormattedNumber value={stats.matchesPlayed} /> matches
                </div>
            </div>
            <div className="player-column-grid">
                <StatCard
                    label="Matches"
                    value={<FormattedNumber value={stats.matchesPlayed} />}
                    rank={rankMatches}
                    paletteIndex={player.paletteIndex}
                />
                <StatCard
                    label="Win %"
                    value={<FormattedPercent value={stats.winPercent} decimals={1} />}
                    rank={rankWinPercent}
                    paletteIndex={player.paletteIndex}
                />
                <StatCard
                    label="K/D"
                    value={<FormattedNumber value={stats.kd} decimals={2} />}
                    rank={rankKd}
                    paletteIndex={player.paletteIndex}
                />
                <StatCard
                    label="HLTV"
                    value={<FormattedNumber value={stats.hltvRating} decimals={2} />}
                    sublabel="Avg HLTV rating"
                    rank={rankRating}
                    paletteIndex={player.paletteIndex}
                />
            </div>
        </div>
    );
};
