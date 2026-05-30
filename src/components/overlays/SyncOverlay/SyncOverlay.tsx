import { useEffect, useState } from "react";

import { CustomButton } from "components/buttons";
import { syncStore, useSyncStore } from "sync";

import "./SyncOverlay.scss";

export const SyncOverlay = () => {
    const state = useSyncStore();
    const [showTail, setShowTail] = useState<boolean>(false);

    useEffect(() => {
        if (state.status === "complete") {
            setShowTail(true);
            const handle = window.setTimeout(() => setShowTail(false), 600);
            return () => {
                window.clearTimeout(handle);
            };
        }
        setShowTail(false);
        return undefined;
    }, [state.status, state.completedAt]);

    const shouldShow = state.status === "syncing" || state.status === "error" || showTail;

    useEffect(() => {
        if (!shouldShow) {
            return undefined;
        }
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [shouldShow]);

    if (!shouldShow) {
        return null;
    }

    const title =
        state.status === "syncing"
            ? "Syncing matches…"
            : state.status === "error"
                ? "Sync failed"
                : "Synced";
    const subtitle =
        state.status === "syncing"
            ? "Pulling latest games from Leetify. Hang tight."
            : state.status === "error"
                ? "Some players couldn't be synced. The dashboard will show whatever's cached."
                : "Up to date.";

    return (
        <div
            className="sync-overlay"
            role="dialog"
            aria-modal="true"
            aria-busy={state.status === "syncing"}
            aria-live="polite"
        >
            <div className="sync-overlay-card">
                <div className="sync-overlay-head">
                    <h2 className="sync-overlay-title">{title}</h2>
                    <p className="sync-overlay-subtitle">{subtitle}</p>
                </div>
                <ul className="sync-overlay-players">
                    {state.players.map((p) => {
                        const dotClass = `sync-overlay-dot sync-overlay-dot-${p.paletteIndex + 1}`;
                        const barFill =
                            p.totalNew === 0
                                ? 100
                                : Math.min(100, Math.round((p.completed / p.totalNew) * 100));
                        const isUpToDate = p.status === "complete" && p.totalNew === 0;
                        const fillClass = [
                            "sync-overlay-bar-fill",
                            `sync-overlay-bar-fill-player-${p.paletteIndex + 1}`,
                            isUpToDate ? "sync-overlay-bar-fill-positive" : "",
                            p.status === "error" ? "sync-overlay-bar-fill-negative" : ""
                        ]
                            .filter((c) => c !== "")
                            .join(" ");

                        let statusText: string;
                        let statusClass = "sync-overlay-status";
                        if (p.status === "pending") {
                            statusText = "Queued";
                            statusClass = "sync-overlay-status sync-overlay-status-muted";
                        } else if (p.status === "running" && p.totalNew === 0) {
                            statusText = "Checking…";
                            statusClass = "sync-overlay-status sync-overlay-status-muted";
                        } else if (p.status === "running") {
                            statusText = `${p.completed} / ${p.totalNew}`;
                        } else if (p.status === "complete" && p.totalNew === 0) {
                            statusText = "Up to date";
                            statusClass = "sync-overlay-status sync-overlay-status-muted";
                        } else if (p.status === "complete") {
                            statusText = `${p.completed} done`;
                            statusClass = "sync-overlay-status sync-overlay-status-positive";
                        } else {
                            statusText = "Failed";
                            statusClass = "sync-overlay-status sync-overlay-status-negative";
                        }

                        return (
                            <li key={p.steam64} className="sync-overlay-player">
                                <div className="sync-overlay-name-cell">
                                    <span className={dotClass} aria-hidden="true" />
                                    <span className="sync-overlay-name">{p.displayName}</span>
                                </div>
                                <div className="sync-overlay-bar" aria-hidden="true">
                                    <div
                                        className={fillClass}
                                        style={{ width: `${barFill}%` }}
                                    />
                                </div>
                                <div className={statusClass}>{statusText}</div>
                            </li>
                        );
                    })}
                </ul>
                {state.status === "error" ? (
                    <div className="sync-overlay-footer">
                        <CustomButton variant="secondary" size="sm" onClick={() => syncStore.dismiss()}>
                            Continue anyway
                        </CustomButton>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
