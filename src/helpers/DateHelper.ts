import { StatPeriod } from "models/enums";

export const rangeForPeriod = (period: StatPeriod, now: Date = new Date()): { from: Date; to: Date } => {
    const to = now;
    if (period === StatPeriod.Week) {
        const from = new Date(to);
        from.setDate(to.getDate() - 7);
        return { from, to };
    }
    if (period === StatPeriod.Month) {
        const from = new Date(to);
        from.setDate(to.getDate() - 30);
        return { from, to };
    }
    return { from: new Date(0), to };
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
