import { useState } from "react";

import { TimeRangeSelector, ViewTabs } from "components/filters";
import { SettingsModal } from "components/overlays";
import { useSync } from "hooks";
import { DashboardView, StatPeriod } from "models";
import { useSyncStore } from "sync";

import "./AppHeader.scss";

interface AppHeaderProps {
    period: StatPeriod;
    onPeriodChange: (next: StatPeriod) => void;
    view: DashboardView;
    onViewChange: (next: DashboardView) => void;
}

export const AppHeader = ({ period, onPeriodChange, view, onViewChange }: AppHeaderProps) => {
    const sync = useSync();
    const syncState = useSyncStore();
    const isSyncing = syncState.status === "syncing";
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleSync = async () => {
        if (isSyncing) {
            return;
        }
        await sync();
    };

    return (
        <>
        <header className="app-header">
            <div className="app-header-brand">
                <svg
                    className="app-header-brand-glyph"
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    aria-hidden="true"
                >
                    <line x1="14" y1="2" x2="14" y2="9" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="14" y1="19" x2="14" y2="26" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="14" x2="9" y2="14" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="19" y1="14" x2="26" y2="14" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="14" cy="14" r="1.5" fill="var(--brand)" />
                </svg>
                <span className="app-header-brand-text">CS2 Friend Tracker</span>
            </div>
            <div className="app-header-tabs">
                <ViewTabs value={view} onChange={onViewChange} />
            </div>
            <div className="app-header-actions">
                <TimeRangeSelector value={period} onChange={onPeriodChange} />
                <button
                    type="button"
                    className={isSyncing
                        ? "app-header-icon-button app-header-icon-button-spinning"
                        : "app-header-icon-button"}
                    onClick={handleSync}
                    disabled={isSyncing}
                    title={isSyncing ? "Syncing…" : "Sync from Leetify"}
                    aria-label={isSyncing ? "Syncing" : "Sync from Leetify"}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path
                            d="M2.5 9a6.5 6.5 0 0 1 11-4.7M15.5 9a6.5 6.5 0 0 1-11 4.7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M13.5 1.5v3h-3M4.5 16.5v-3h3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                <button
                    type="button"
                    className="app-header-icon-button"
                    onClick={() => setIsSettingsOpen(true)}
                    title="Settings"
                    aria-label="Settings"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
        </header>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
};
