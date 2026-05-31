import { ChangeEvent, MouseEvent, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CustomButton } from "components/buttons";
import { exportAll, importAll } from "db";

import "./SettingsModal.scss";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const todayStamp = (): string => {
    const now = new Date();
    const yyyy = now.getFullYear().toString().padStart(4, "0");
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const handleExport = async () => {
        const payload = await exportAll();
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cs2-friend-tracker-${todayStamp()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file === undefined) {
            return;
        }
        const confirmed = window.confirm(
            `Import "${file.name}"? This will overwrite your local cache.`
        );
        if (!confirmed) {
            return;
        }
        try {
            const text = await file.text();
            const payload = JSON.parse(text);
            await importAll(payload);
            await queryClient.invalidateQueries({ queryKey: ["matches"] });
            await queryClient.invalidateQueries({ queryKey: ["snapshots"] });
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            window.alert(`Import failed: ${message}`);
        }
    };

    return (
        <div
            className="settings-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={handleBackdropClick}
        >
            <div className="settings-modal-card">
                <header className="settings-modal-header">
                    <h2 id="settings-modal-title" className="settings-modal-title">Settings</h2>
                    <button
                        type="button"
                        className="settings-modal-close"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path
                                d="M3 3l8 8M11 3l-8 8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </header>
                <div className="settings-modal-body">
                    <section className="settings-modal-section">
                        <h3 className="settings-modal-section-title">Data</h3>
                        <div className="settings-modal-row">
                            <div className="settings-modal-row-text">
                                <div className="settings-modal-row-label">Export local cache</div>
                                <div className="settings-modal-row-help">
                                    Download every cached match, profile snapshot, and sync record as a single JSON file.
                                </div>
                            </div>
                            <CustomButton variant="secondary" size="sm" onClick={handleExport}>
                                Export
                            </CustomButton>
                        </div>
                        <div className="settings-modal-row">
                            <div className="settings-modal-row-text">
                                <div className="settings-modal-row-label">Import cache from file</div>
                                <div className="settings-modal-row-help">
                                    Replaces your current local data with the contents of the chosen file.
                                </div>
                            </div>
                            <CustomButton variant="secondary" size="sm" onClick={handleImportClick}>
                                Import
                            </CustomButton>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/json,.json"
                                className="settings-modal-file-input"
                                onChange={handleImportChange}
                                aria-hidden="true"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
