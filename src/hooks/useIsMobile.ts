import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

const getSnapshot = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }
    return window.matchMedia(MOBILE_QUERY).matches;
};

const getServerSnapshot = (): boolean => false;

const subscribe = (listener: () => void): (() => void) => {
    if (typeof window === "undefined") {
        return () => undefined;
    }
    const mql = window.matchMedia(MOBILE_QUERY);
    mql.addEventListener("change", listener);
    return () => {
        mql.removeEventListener("change", listener);
    };
};

export const useIsMobile = (): boolean =>
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
