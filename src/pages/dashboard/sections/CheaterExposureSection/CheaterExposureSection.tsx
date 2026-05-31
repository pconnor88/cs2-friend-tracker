import { FormattedNumber } from "components/formatting";
import { PageSection, StatCard } from "components/layout";
import { PLAYERS } from "config";
import { useProfileSnapshots } from "hooks";
import { StatPeriod } from "models";

import "./CheaterExposureSection.scss";

interface CheaterExposureSectionProps {
    period: StatPeriod;
    mapName?: string;
}

export const CheaterExposureSection = ({ period }: CheaterExposureSectionProps) => {
    const { data, isLoading } = useProfileSnapshots(period);

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Cheater exposure">
                <div className="section-loading">Loading exposure…</div>
            </PageSection>
        );
    }

    if (data.length === 0) {
        return (
            <PageSection title="Cheater exposure">
                <div className="section-empty">No matches in this period.</div>
            </PageSection>
        );
    }

    const flaggedGameIdsByPlayer = new Map<string, Set<string>>();
    const totalGameIdsByPlayer = new Map<string, Set<string>>();
    const squadFlaggedGameIds = new Set<string>();
    const squadTotalGameIds = new Set<string>();

    for (const player of PLAYERS) {
        flaggedGameIdsByPlayer.set(player.steam64, new Set<string>());
        totalGameIdsByPlayer.set(player.steam64, new Set<string>());
    }

    for (const snapshot of data) {
        totalGameIdsByPlayer.get(snapshot.steam64)?.add(snapshot.gameId);
        squadTotalGameIds.add(snapshot.gameId);
        if (snapshot.hasBannedPlayer === true) {
            flaggedGameIdsByPlayer.get(snapshot.steam64)?.add(snapshot.gameId);
            squadFlaggedGameIds.add(snapshot.gameId);
        }
    }

    return (
        <PageSection
            title="Cheater exposure"
            description="Matches you played that Leetify later flagged as containing a banned player. Re-syncs pick up newly-banned opponents automatically."
        >
            <div className="cheater-exposure-grid">
                {PLAYERS.map(player => {
                    const flagged = flaggedGameIdsByPlayer.get(player.steam64)?.size ?? 0;
                    const total = totalGameIdsByPlayer.get(player.steam64)?.size ?? 0;
                    return (
                        <StatCard
                            key={player.steam64}
                            label={player.displayName}
                            value={<FormattedNumber value={flagged} />}
                            sublabel={<>of <FormattedNumber value={total} /> played</>}
                        />
                    );
                })}
                <StatCard
                    label="Squad total"
                    value={<FormattedNumber value={squadFlaggedGameIds.size} />}
                    sublabel={<>of <FormattedNumber value={squadTotalGameIds.size} /> played</>}
                />
            </div>
        </PageSection>
    );
};
