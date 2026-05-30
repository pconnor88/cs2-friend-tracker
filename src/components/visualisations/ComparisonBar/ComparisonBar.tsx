import { CSSProperties } from "react";

import { PlayerConfig, Rank } from "models";

import { RankBadge } from "../RankBadge";

import "./ComparisonBar.scss";

export interface ComparisonBarRow {
    player: PlayerConfig;
    value: number;
    displayValue: string;
    rank: Rank;
}

interface ComparisonBarProps {
    label: string;
    rows: ComparisonBarRow[];
    higherIsBetter?: boolean;
}

interface FillStyle extends CSSProperties {
    "--comparison-bar-fill-width": string;
    "--comparison-bar-fill-colour": string;
}

interface DotStyle extends CSSProperties {
    "--comparison-bar-dot-colour": string;
}

export const ComparisonBar = ({ label, rows }: ComparisonBarProps) => {
    const max = Math.max(...rows.map((row) => row.value), 0);

    return (
        <div className="comparison-bar">
            <div className="comparison-bar-header">
                <span className="comparison-bar-label">{label}</span>
            </div>
            <div className="comparison-bar-rows">
                {rows.map((row) => {
                    const ratio = max > 0 ? row.value / max : 0;
                    const widthPercent = row.value <= 0 ? 2 : Math.max(ratio * 100, 2);
                    const colourVar = `var(--player-${row.player.paletteIndex + 1})`;
                    const fillStyle: FillStyle = {
                        "--comparison-bar-fill-width": `${widthPercent}%`,
                        "--comparison-bar-fill-colour": colourVar
                    };
                    const dotStyle: DotStyle = {
                        "--comparison-bar-dot-colour": colourVar
                    };
                    return (
                        <div className="comparison-bar-row" key={row.player.slug}>
                            <div className="comparison-bar-player">
                                <span className="comparison-bar-dot" style={dotStyle} aria-hidden="true" />
                                <span className="comparison-bar-name">{row.player.displayName}</span>
                            </div>
                            <div className="comparison-bar-track">
                                <div className="comparison-bar-fill" style={fillStyle} />
                            </div>
                            <div className="comparison-bar-value">
                                <span className="comparison-bar-value-text">{row.displayValue}</span>
                                {row.rank === Rank.Gold ? <RankBadge rank={Rank.Gold} size="sm" /> : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
