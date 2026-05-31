import { ChangeEvent } from "react";

import { ALL_MAPS } from "hooks";

import "./MapFilter.scss";

interface MapFilterProps {
    value: string;
    options: string[];
    onChange: (next: string) => void;
}

const formatMapName = (mapName: string): string =>
    mapName
        .replace(/^de_/, "")
        .replace(/^cs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const MapFilter = ({ value, options, onChange }: MapFilterProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value);
    };

    return (
        <label className="map-filter">
            <span className="map-filter-label">Map</span>
            <select className="map-filter-select" value={value} onChange={handleChange}>
                <option value={ALL_MAPS}>All maps</option>
                {options.map((mapName) => (
                    <option key={mapName} value={mapName}>
                        {formatMapName(mapName)}
                    </option>
                ))}
            </select>
        </label>
    );
};
