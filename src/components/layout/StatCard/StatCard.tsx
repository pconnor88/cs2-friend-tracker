import { ReactNode } from "react";

import { RankBadge } from "components/visualisations";
import { Rank } from "models";

import "./StatCard.scss";

interface StatCardProps {
    label: string;
    value: ReactNode;
    sublabel?: ReactNode;
    rank?: Rank;
    paletteIndex?: 0 | 1 | 2;
    compact?: boolean;
}

export const StatCard = ({ label, value, sublabel, rank, paletteIndex, compact }: StatCardProps) => {
    const classes = ["stat-card"];
    classes.push(compact ? "stat-card-compact" : "stat-card-regular");
    if (paletteIndex != null) {
        classes.push(`stat-card-player-${paletteIndex + 1}`);
    }
    if (rank != null) {
        classes.push(`stat-card-ranked-${rank}`);
    }

    return (
        <div className={classes.join(" ")}>
            {rank != null && (
                <div className="stat-card-rank">
                    <RankBadge rank={rank} size="sm" />
                </div>
            )}
            <span className="stat-card-label">{label}</span>
            <div className="stat-card-value">{value}</div>
            {sublabel != null && <div className="stat-card-sublabel">{sublabel}</div>}
        </div>
    );
};
