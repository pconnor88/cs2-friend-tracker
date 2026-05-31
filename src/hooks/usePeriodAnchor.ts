import { useSyncExternalStore } from "react";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toIsoDate = (date: Date): string => {
    const yyyy = date.getFullYear().toString().padStart(4, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const todayLocal = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const readAnchorFromUrl = (): Date => {
    if (typeof window === "undefined") {
        return todayLocal();
    }
    const param = new URLSearchParams(window.location.search).get("anchor");
    if (param === null || !ISO_DATE_PATTERN.test(param)) {
        return todayLocal();
    }
    const [year, month, day] = param.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) {
        return todayLocal();
    }
    return parsed;
};

const writeAnchorToUrl = (anchor: Date, isDefault: boolean): void => {
    const url = new URL(window.location.href);
    if (isDefault) {
        url.searchParams.delete("anchor");
    } else {
        url.searchParams.set("anchor", toIsoDate(anchor));
    }
    window.history.replaceState(null, "", url.toString());
};

const isToday = (date: Date): boolean => {
    const t = todayLocal();
    return (
        date.getFullYear() === t.getFullYear()
        && date.getMonth() === t.getMonth()
        && date.getDate() === t.getDate()
    );
};

let currentAnchor: Date = readAnchorFromUrl();
const listeners = new Set<() => void>();

const emit = (): void => {
    for (const listener of listeners) {
        listener();
    }
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = (): Date => currentAnchor;

if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
        currentAnchor = readAnchorFromUrl();
        emit();
    });
}

export const usePeriodAnchor = () => {
    const anchor = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setAnchor = (next: Date): void => {
        writeAnchorToUrl(next, isToday(next));
        currentAnchor = next;
        emit();
    };

    return { anchor, setAnchor };
};
