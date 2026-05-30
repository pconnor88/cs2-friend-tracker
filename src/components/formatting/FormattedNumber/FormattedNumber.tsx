import "./FormattedNumber.scss";

interface FormattedNumberProps {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
}

export const FormattedNumber = ({ value, decimals = 0, prefix, suffix }: FormattedNumberProps) => {
    if (Number.isNaN(value)) {
        return <span className="formatted-number">—</span>;
    }

    const display = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return (
        <span className="formatted-number">
            {prefix ?? ""}
            {display}
            {suffix ?? ""}
        </span>
    );
};
