import "./StatDelta.scss";

interface StatDeltaProps {
    delta: number;
    decimals?: number;
    suffix?: string;
    positiveIsGood?: boolean;
}

export const StatDelta = ({ delta, decimals = 2, suffix, positiveIsGood = true }: StatDeltaProps) => {
    let tone: "positive" | "negative" | "neutral";
    if (delta === 0 || Number.isNaN(delta)) {
        tone = "neutral";
    } else if (delta > 0) {
        tone = positiveIsGood ? "positive" : "negative";
    } else {
        tone = positiveIsGood ? "negative" : "positive";
    }

    let sign: string;
    if (delta > 0) {
        sign = "+";
    } else if (delta < 0) {
        sign = "−";
    } else {
        sign = "";
    }

    const abs = Math.abs(delta).toFixed(decimals);

    return (
        <span className={`stat-delta stat-delta-${tone}`}>
            {sign}
            {abs}
            {suffix ?? ""}
        </span>
    );
};
