import { MapFilter, PeriodNavigator } from "components/filters";
import { AppHeader } from "components/layout";
import { SyncOverlay } from "components/overlays";
import {
    ALL_MAPS,
    useAllMatches,
    useMapFilter,
    usePeriodAnchor,
    useTimeRange,
    useView
} from "hooks";
import { DashboardView } from "models";
import { useSyncStore } from "sync";

import {
    AimMechanicsSection,
    CheaterExposureSection,
    CombatLeaderboardSection,
    ComparisonChartSection,
    FormVsBaselineSection,
    FriendlyFireLeaderboardSection,
    HeadlineRow,
    MapSection,
    MapStalenessSection,
    MultiKillLeaderboardSection,
    RankTrendSection,
    RecentMatchesSection,
    SessionFatigueSection,
    SideStrategySection,
    SquadSynergySection,
    TimeOfDaySection,
    TrendSection,
    UtilityLeaderboardSection
} from "./sections";

import "./Dashboard.scss";

export const Dashboard = () => {
    const { period, setPeriod } = useTimeRange();
    const { view, setView } = useView();
    const { mapName, setMapName } = useMapFilter();
    const { anchor, setAnchor } = usePeriodAnchor();
    const { data: allMatches } = useAllMatches(period);
    const sync = useSyncStore();
    const inert = sync.status === "syncing";

    const mapOptions =
        allMatches === undefined
            ? []
            : Array.from(new Set(allMatches.map(m => m.mapName))).sort((a, b) => a.localeCompare(b));

    const effectiveMapName = mapName === ALL_MAPS ? undefined : mapName;

    const navigator = (
        <PeriodNavigator period={period} anchor={anchor} onChange={setAnchor} />
    );

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
                                {navigator}
                            </div>
                            <HeadlineRow period={period} mapName={effectiveMapName} />
                            <CombatLeaderboardSection period={period} mapName={effectiveMapName} />
                            <MultiKillLeaderboardSection period={period} mapName={effectiveMapName} />
                            <UtilityLeaderboardSection period={period} mapName={effectiveMapName} />
                            <FriendlyFireLeaderboardSection period={period} mapName={effectiveMapName} />
                        </>
                    )}
                    {view === DashboardView.Graphs && (
                        <>
                            <div className="dashboard-toolbar">{navigator}</div>
                            <TrendSection period={period} />
                            <RankTrendSection period={period} />
                            <ComparisonChartSection period={period} />
                            <SessionFatigueSection period={period} />
                            <TimeOfDaySection period={period} />
                        </>
                    )}
                    {view === DashboardView.Maps && (
                        <>
                            <div className="dashboard-toolbar">
                                <MapFilter value={mapName} options={mapOptions} onChange={setMapName} />
                                {navigator}
                            </div>
                            <SideStrategySection period={period} mapName={effectiveMapName} />
                            <MapSection period={period} />
                            <MapStalenessSection period={period} mapName={effectiveMapName} />
                        </>
                    )}
                    {view === DashboardView.Matches && (
                        <>
                            <div className="dashboard-toolbar">{navigator}</div>
                            <RecentMatchesSection period={period} />
                        </>
                    )}
                    {view === DashboardView.Insights && (
                        <>
                            <div className="dashboard-toolbar">
                                <MapFilter value={mapName} options={mapOptions} onChange={setMapName} />
                                {navigator}
                            </div>
                            <FormVsBaselineSection period={period} mapName={effectiveMapName} />
                            <SquadSynergySection period={period} mapName={effectiveMapName} />
                            <AimMechanicsSection period={period} mapName={effectiveMapName} />
                            <CheaterExposureSection period={period} mapName={effectiveMapName} />
                        </>
                    )}
                </main>
            </div>
        </>
    );
};
