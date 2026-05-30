import { Rank } from "models";

import "./RankBadge.scss";

interface RankBadgeProps {
    rank: Rank;
    size?: "sm" | "md";
}

const NUMERAL_BY_RANK: Record<Rank, string> = {
    [Rank.Gold]: "1",
    [Rank.Silver]: "2",
    [Rank.Bronze]: "3"
};

export const RankBadge = ({ rank, size = "md" }: RankBadgeProps) => (
    <span
        className={`rank-badge rank-badge-${rank} rank-badge-${size}`}
        aria-label={`Rank ${NUMERAL_BY_RANK[rank]}`}
    >
        {NUMERAL_BY_RANK[rank]}
    </span>
);
