import { canStepForward, formatPeriodLabel, isAnchorCurrent, shiftAnchor } from "helpers";
import { StatPeriod } from "models";

import "./PeriodNavigator.scss";

interface PeriodNavigatorProps {
    period: StatPeriod;
    anchor: Date;
    onChange: (next: Date) => void;
}

const todayLocal = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const PeriodNavigator = ({ period, anchor, onChange }: PeriodNavigatorProps) => {
    if (period === StatPeriod.AllTime) {
        return null;
    }

    const label = formatPeriodLabel(period, anchor);
    const canForward = canStepForward(period, anchor);
    const atCurrent = isAnchorCurrent(period, anchor);

    const goPrev = () => {
        onChange(shiftAnchor(period, anchor, -1));
    };

    const goNext = () => {
        if (!canForward) {
            return;
        }
        onChange(shiftAnchor(period, anchor, 1));
    };

    const goToday = () => {
        if (atCurrent) {
            return;
        }
        onChange(todayLocal());
    };

    return (
        <div className="period-navigator">
            <button
                type="button"
                className="period-navigator-button"
                onClick={goPrev}
                aria-label={period === StatPeriod.Week ? "Previous week" : "Previous month"}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                        d="M9 3l-4 4 4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            <span className="period-navigator-label">{label}</span>
            <button
                type="button"
                className="period-navigator-button"
                onClick={goNext}
                disabled={!canForward}
                aria-label={period === StatPeriod.Week ? "Next week" : "Next month"}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                        d="M5 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            <button
                type="button"
                className="period-navigator-today"
                onClick={goToday}
                disabled={atCurrent}
            >
                Today
            </button>
        </div>
    );
};
