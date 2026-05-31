import { useEffect, useState } from "react";

import { StatPeriod } from "models";

const VALID = new Set<string>([StatPeriod.Day, StatPeriod.Week, StatPeriod.Month, StatPeriod.AllTime]);

const readPeriodFromUrl = (): StatPeriod => {
    if (typeof window === "undefined") {
        return StatPeriod.Month;
    }
    const param = new URLSearchParams(window.location.search).get("period");
    if (param !== null && VALID.has(param)) {
        return param as StatPeriod;
    }
    return StatPeriod.Month;
};

const writePeriodToUrl = (period: StatPeriod): void => {
    const url = new URL(window.location.href);
    url.searchParams.set("period", period);
    window.history.replaceState(null, "", url.toString());
};

export const useTimeRange = () => {
    const [period, setPeriodState] = useState<StatPeriod>(readPeriodFromUrl);

    useEffect(() => {
        const onPop = () => {
            setPeriodState(readPeriodFromUrl());
        };
        window.addEventListener("popstate", onPop);
        return () => {
            window.removeEventListener("popstate", onPop);
        };
    }, []);

    const setPeriod = (next: StatPeriod): void => {
        writePeriodToUrl(next);
        setPeriodState(next);
    };

    return { period, setPeriod };
};
