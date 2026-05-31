import { StatPeriod } from "models/enums";

const startOfWeek = (anchor: Date): Date => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + mondayOffset);
    return d;
};

const endOfDay = (date: Date): Date =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const rangeForPeriod = (period: StatPeriod, anchor: Date = new Date()): { from: Date; to: Date } => {
    if (period === StatPeriod.Week) {
        const from = startOfWeek(anchor);
        const lastDay = new Date(from);
        lastDay.setDate(from.getDate() + 6);
        return { from, to: endOfDay(lastDay) };
    }
    if (period === StatPeriod.Month) {
        const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
        return { from, to: endOfDay(lastDay) };
    }
    return { from: new Date(0), to: anchor };
};

export const formatPeriodLabel = (period: StatPeriod, anchor: Date): string => {
    if (period === StatPeriod.Week) {
        const { from, to } = rangeForPeriod(StatPeriod.Week, anchor);
        const sameMonth = from.getMonth() === to.getMonth();
        const fmt = (d: Date, withMonth: boolean): string =>
            d.toLocaleDateString(undefined, withMonth
                ? { weekday: "short", day: "numeric", month: "short" }
                : { weekday: "short", day: "numeric" });
        return `${fmt(from, true)} – ${fmt(to, !sameMonth)}`;
    }
    if (period === StatPeriod.Month) {
        return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    return "All time";
};

export const shiftAnchor = (period: StatPeriod, anchor: Date, direction: -1 | 1): Date => {
    if (period === StatPeriod.Week) {
        const next = new Date(anchor);
        next.setDate(anchor.getDate() + 7 * direction);
        return next;
    }
    if (period === StatPeriod.Month) {
        return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
    }
    return anchor;
};

export const canStepForward = (period: StatPeriod, anchor: Date, now: Date = new Date()): boolean => {
    const next = shiftAnchor(period, anchor, 1);
    const range = rangeForPeriod(period, next);
    return range.from.getTime() <= now.getTime();
};

export const isAnchorCurrent = (period: StatPeriod, anchor: Date, now: Date = new Date()): boolean => {
    if (period === StatPeriod.AllTime) {
        return true;
    }
    const { from, to } = rangeForPeriod(period, anchor);
    return now.getTime() >= from.getTime() && now.getTime() <= to.getTime();
};

export const formatFriendlyDate = (iso: string, now: Date = new Date()): string => {
    const date = new Date(iso);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) {
        return "Just now";
    }
    if (diffMin < 60) {
        return `${diffMin} min ago`;
    }
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) {
        return `${diffHr} hr ago`;
    }
    const diffDay = Math.round(diffHr / 24);
    if (diffDay === 1) {
        return "Yesterday";
    }
    if (diffDay < 7) {
        return `${diffDay} days ago`;
    }
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
