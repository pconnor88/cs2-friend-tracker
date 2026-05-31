import { canStepForward, formatPeriodLabel, isAnchorCurrent, shiftAnchor } from "helpers";
import { StatPeriod } from "models";

import "./PeriodNavigator.scss";

interface PeriodNavigatorProps {
    period: StatPeriod;
    anchor: Date;
    onChange: (next: Date) => void;
    availableDays?: readonly string[];
}

const todayLocal = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const toYmd = (date: Date): string => {
    const y = date.getFullYear().toString().padStart(4, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const parseYmd = (ymd: string): Date => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const findPrevDay = (days: readonly string[], anchor: Date): Date | undefined => {
    const target = toYmd(anchor);
    let found: string | undefined;
    for (const day of days) {
        if (day < target) {
            found = day;
        } else {
            break;
        }
    }
    return found === undefined ? undefined : parseYmd(found);
};

const findNextDay = (days: readonly string[], anchor: Date): Date | undefined => {
    const target = toYmd(anchor);
    const today = toYmd(todayLocal());
    for (const day of days) {
        if (day > target && day <= today) {
            return parseYmd(day);
        }
    }
    return undefined;
};

export const PeriodNavigator = ({ period, anchor, onChange, availableDays }: PeriodNavigatorProps) => {
    if (period === StatPeriod.AllTime) {
        return null;
    }

    const isDayMode = period === StatPeriod.Day;
    const label = formatPeriodLabel(period, anchor);
    const days = availableDays ?? [];
    const prevDay = isDayMode ? findPrevDay(days, anchor) : undefined;
    const nextDay = isDayMode ? findNextDay(days, anchor) : undefined;

    const canBack = isDayMode ? prevDay !== undefined : true;
    const canForward = isDayMode ? nextDay !== undefined : canStepForward(period, anchor);
    const atCurrent = isAnchorCurrent(period, anchor);

    const goPrev = () => {
        if (!canBack) {
            return;
        }
        if (isDayMode && prevDay !== undefined) {
            onChange(prevDay);
            return;
        }
        onChange(shiftAnchor(period, anchor, -1));
    };

    const goNext = () => {
        if (!canForward) {
            return;
        }
        if (isDayMode && nextDay !== undefined) {
            onChange(nextDay);
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

    const prevLabel =
        period === StatPeriod.Day
            ? "Previous day with data"
            : period === StatPeriod.Week
                ? "Previous week"
                : "Previous month";
    const nextLabel =
        period === StatPeriod.Day
            ? "Next day with data"
            : period === StatPeriod.Week
                ? "Next week"
                : "Next month";

    return (
        <div className="period-navigator">
            <button
                type="button"
                className="period-navigator-button"
                onClick={goPrev}
                disabled={!canBack}
                aria-label={prevLabel}
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
                aria-label={nextLabel}
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
