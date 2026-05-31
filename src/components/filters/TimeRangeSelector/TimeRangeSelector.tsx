import { KeyboardEvent } from "react";

import { StatPeriod } from "models";

import "./TimeRangeSelector.scss";

interface TimeRangeSelectorProps {
    value: StatPeriod;
    onChange: (next: StatPeriod) => void;
}

interface PeriodOption {
    period: StatPeriod;
    label: string;
}

const OPTIONS: PeriodOption[] = [
    { period: StatPeriod.Day, label: "Day" },
    { period: StatPeriod.Week, label: "Week" },
    { period: StatPeriod.Month, label: "Month" },
    { period: StatPeriod.AllTime, label: "All time" }
];

export const TimeRangeSelector = ({ value, onChange }: TimeRangeSelectorProps) => {
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
        }
        event.preventDefault();
        const currentIndex = OPTIONS.findIndex((option) => option.period === value);
        if (currentIndex === -1) {
            return;
        }
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + offset + OPTIONS.length) % OPTIONS.length;
        onChange(OPTIONS[nextIndex].period);
    };

    return (
        <div className="time-range-selector" role="radiogroup" aria-label="Time range">
            {OPTIONS.map((option) => {
                const selected = option.period === value;
                const className = selected
                    ? "time-range-selector-pill time-range-selector-pill-selected"
                    : "time-range-selector-pill";
                return (
                    <button
                        key={option.period}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={selected ? 0 : -1}
                        className={className}
                        onClick={() => onChange(option.period)}
                        onKeyDown={handleKeyDown}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
