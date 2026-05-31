import { PageSection, PlayerColumn } from "components/layout";
import { PLAYERS } from "config";
import { rankStats } from "helpers";
import { useStatsForAllPlayers } from "hooks";
import { PlayerStats, Rank, StatPeriod } from "models";

import "./HeadlineRow.scss";

interface HeadlineRowProps {
    period: StatPeriod;
    mapName?: string;
}

export const HeadlineRow = ({ period, mapName }: HeadlineRowProps) => {
    const { data, isLoading } = useStatsForAllPlayers(period, undefined, mapName);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Headline">
                <div className="section-loading">Loading headline stats…</div>
            </PageSection>
        );
    }

    const rankFor = (extract: (s: PlayerStats) => number, higherIsBetter = true) => {
        const ranked = rankStats(
            data.map(s => ({ steam64: s.steam64, value: extract(s) })),
            { higherIsBetter }
        );
        return new Map(ranked.map(r => [r.steam64, r.rank as Rank]));
    };

    const matchesRank = rankFor(s => s.matchesPlayed);
    const winRank = rankFor(s => s.winPercent);
    const kdRank = rankFor(s => s.kd);
    const ratingRank = rankFor(s => s.hltvRating);

    return (
        <PageSection
            title="Headline"
            description="At-a-glance comparison of the three of you for the selected period."
        >
            <div className="headline-row">
                {PLAYERS.map(player => {
                    const stats = data.find(s => s.steam64 === player.steam64);
                    if (stats === undefined) {
                        return null;
                    }
                    return (
                        <PlayerColumn
                            key={player.steam64}
                            player={player}
                            stats={stats}
                            rankMatches={matchesRank.get(player.steam64) ?? Rank.Silver}
                            rankWinPercent={winRank.get(player.steam64) ?? Rank.Silver}
                            rankKd={kdRank.get(player.steam64) ?? Rank.Silver}
                            rankRating={ratingRank.get(player.steam64) ?? Rank.Silver}
                        />
                    );
                })}
            </div>
        </PageSection>
    );
};
