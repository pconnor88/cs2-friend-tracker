import { CustomButton } from "components/buttons";
import { TimeRangeSelector } from "components/filters";
import { useSync } from "hooks";
import { StatPeriod } from "models";
import { useSyncStore } from "sync";

import "./AppHeader.scss";

interface AppHeaderProps {
    period: StatPeriod;
    onPeriodChange: (next: StatPeriod) => void;
}

export const AppHeader = ({ period, onPeriodChange }: AppHeaderProps) => {
    const sync = useSync();
    const syncState = useSyncStore();
    const isSyncing = syncState.status === "syncing";

    const handleSync = async () => {
        await sync();
    };

    return (
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
            <div className="app-header-spacer" />
            <div className="app-header-actions">
                <TimeRangeSelector value={period} onChange={onPeriodChange} />
                <CustomButton variant="ghost" size="sm" onClick={handleSync} loading={isSyncing} disabled={isSyncing}>
                    Sync
                </CustomButton>
            </div>
        </header>
    );
};
