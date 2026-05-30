import { AppHeader } from "components/layout";
import { SyncOverlay } from "components/overlays";
import { useTimeRange } from "hooks";
import { useSyncStore } from "sync";

import {
    CombatLeaderboardSection,
    HeadlineRow,
    MapSection,
    MultiKillLeaderboardSection,
    RankTrendSection,
    RecentMatchesSection,
    TrendSection,
    UtilityLeaderboardSection
} from "./sections";

import "./Dashboard.scss";

export const Dashboard = () => {
    const { period, setPeriod } = useTimeRange();
    const sync = useSyncStore();
    const inert = sync.status === "syncing";

    return (
        <>
            <SyncOverlay />
            <div className={inert ? "dashboard dashboard-inert" : "dashboard"} aria-hidden={inert}>
                <AppHeader period={period} onPeriodChange={setPeriod} />
                <main className="dashboard-main">
                    <HeadlineRow period={period} />
                    <CombatLeaderboardSection period={period} />
                    <MultiKillLeaderboardSection period={period} />
                    <UtilityLeaderboardSection period={period} />
                    <TrendSection period={period} />
                    <RankTrendSection period={period} />
                    <MapSection period={period} />
                    <RecentMatchesSection period={period} />
                </main>
            </div>
        </>
    );
};
