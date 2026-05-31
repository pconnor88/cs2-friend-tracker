import { KeyboardEvent } from "react";

import { DashboardView } from "models";

import "./ViewTabs.scss";

interface ViewTabsProps {
    value: DashboardView;
    onChange: (next: DashboardView) => void;
}

interface ViewOption {
    view: DashboardView;
    label: string;
}

const OPTIONS: ViewOption[] = [
    { view: DashboardView.Leaderboards, label: "Leaderboards" },
    { view: DashboardView.Graphs, label: "Graphs" },
    { view: DashboardView.Maps, label: "Maps" },
    { view: DashboardView.Matches, label: "Matches" }
];

export const ViewTabs = ({ value, onChange }: ViewTabsProps) => {
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
        }
        event.preventDefault();
        const currentIndex = OPTIONS.findIndex((option) => option.view === value);
        if (currentIndex === -1) {
            return;
        }
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + offset + OPTIONS.length) % OPTIONS.length;
        onChange(OPTIONS[nextIndex].view);
    };

    return (
        <nav className="view-tabs" role="tablist" aria-label="Dashboard view">
            {OPTIONS.map((option) => {
                const selected = option.view === value;
                const className = selected
                    ? "view-tabs-tab view-tabs-tab-selected"
                    : "view-tabs-tab";
                return (
                    <button
                        key={option.view}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        tabIndex={selected ? 0 : -1}
                        className={className}
                        onClick={() => onChange(option.view)}
                        onKeyDown={handleKeyDown}
                    >
                        {option.label}
                    </button>
                );
            })}
        </nav>
    );
};
