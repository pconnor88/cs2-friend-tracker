import { ReactNode } from "react";

import "./CustomButton.scss";

interface CustomButtonProps {
    children: ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md";
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    type?: "button" | "submit";
    title?: string;
}

export const CustomButton = ({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    onClick,
    type = "button",
    title
}: CustomButtonProps) => {
    const classes = [
        "custom-button",
        `custom-button-${variant}`,
        `custom-button-${size}`,
        loading ? "custom-button-loading" : ""
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || loading}
            onClick={onClick}
            title={title}
        >
            {loading ? (
                <svg
                    className="custom-button-spinner"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                >
                    <circle
                        cx="6"
                        cy="6"
                        r="4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="20 10"
                        strokeLinecap="round"
                    />
                </svg>
            ) : null}
            <span className="custom-button-label">{children}</span>
        </button>
    );
};
