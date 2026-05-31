import { useEffect, useState } from "react";

export const ALL_MAPS = "all";

const readMapFromUrl = (): string => {
    if (typeof window === "undefined") {
        return ALL_MAPS;
    }
    const param = new URLSearchParams(window.location.search).get("map");
    if (param === null || param === "") {
        return ALL_MAPS;
    }
    return param;
};

const writeMapToUrl = (map: string): void => {
    const url = new URL(window.location.href);
    if (map === ALL_MAPS) {
        url.searchParams.delete("map");
    } else {
        url.searchParams.set("map", map);
    }
    window.history.replaceState(null, "", url.toString());
};

export const useMapFilter = () => {
    const [mapName, setMapNameState] = useState<string>(readMapFromUrl);

    useEffect(() => {
        const onPop = () => {
            setMapNameState(readMapFromUrl());
        };
        window.addEventListener("popstate", onPop);
        return () => {
            window.removeEventListener("popstate", onPop);
        };
    }, []);

    const setMapName = (next: string): void => {
        writeMapToUrl(next);
        setMapNameState(next);
    };

    return { mapName, setMapName };
};
