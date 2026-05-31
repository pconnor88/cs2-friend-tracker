import { MapFilter } from "components/filters";
import { AppHeader } from "components/layout";
import { SyncOverlay } from "components/overlays";
import { ALL_MAPS, useAllMatches, useMapFilter, useTimeRange, useView } from "hooks";
import { DashboardView } from "models";
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
    const { view, setView } = useView();
    const { mapName, setMapName } = useMapFilter();
    const { data: allMatches } = useAllMatches(period);
    const sync = useSyncStore();
    const inert = sync.status === "syncing";

    const mapOptions =
        allMatches === undefined
            ? []
            : Array.from(new Set(allMatches.map(m => m.mapName))).sort((a, b) => a.localeCompare(b));

    const effectiveMapName = mapName === ALL_MAPS ? undefined : mapName;

    return (
        <>
            <SyncOverlay />
            <div className={inert ? "dashboard dashboard-inert" : "dashboard"} aria-hidden={inert}>
                <AppHeader
                    period={period}
                    onPeriodChange={setPeriod}
                    view={view}
                    onViewChange={setView}
                />
                <main className="dashboard-main">
                    {view === DashboardView.Leaderboards && (
                        <>
                            <div className="dashboard-toolbar">
                                <MapFilter value={mapName} options={mapOptions} onChange={setMapName} />
                            </div>
                            <HeadlineRow period={period} mapName={effectiveMapName} />
                            <CombatLeaderboardSection period={period} mapName={effectiveMapName} />
                            <MultiKillLeaderboardSection period={period} mapName={effectiveMapName} />
                            <UtilityLeaderboardSection period={period} mapName={effectiveMapName} />
                        </>
                    )}
                    {view === DashboardView.Graphs && (
                        <>
                            <TrendSection period={period} />
                            <RankTrendSection period={period} />
                        </>
                    )}
                    {view === DashboardView.Maps && <MapSection period={period} />}
                    {view === DashboardView.Matches && <RecentMatchesSection period={period} />}
                </main>
            </div>
        </>
    );
};
