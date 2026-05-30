import "../FormattedNumber/FormattedNumber.scss";

interface FormattedPercentProps {
    value: number;
    decimals?: number;
}

export const FormattedPercent = ({ value, decimals = 1 }: FormattedPercentProps) => {
    if (!Number.isFinite(value)) {
        return <span className="formatted-number">—</span>;
    }

    const display = (value * 100).toFixed(decimals);

    return <span className="formatted-number">{display}%</span>;
};
