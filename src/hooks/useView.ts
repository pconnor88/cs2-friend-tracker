import { useEffect, useState } from "react";

import { DashboardView } from "models";

const VALID = new Set<string>([
    DashboardView.Leaderboards,
    DashboardView.Graphs,
    DashboardView.Maps,
    DashboardView.Matches
]);

const readViewFromUrl = (): DashboardView => {
    if (typeof window === "undefined") {
        return DashboardView.Leaderboards;
    }
    const param = new URLSearchParams(window.location.search).get("view");
    if (param !== null && VALID.has(param)) {
        return param as DashboardView;
    }
    return DashboardView.Leaderboards;
};

const writeViewToUrl = (view: DashboardView): void => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url.toString());
};

export const useView = () => {
    const [view, setViewState] = useState<DashboardView>(readViewFromUrl);

    useEffect(() => {
        const onPop = () => {
            setViewState(readViewFromUrl());
        };
        window.addEventListener("popstate", onPop);
        return () => {
            window.removeEventListener("popstate", onPop);
        };
    }, []);

    const setView = (next: DashboardView): void => {
        writeViewToUrl(next);
        setViewState(next);
    };

    return { view, setView };
};
