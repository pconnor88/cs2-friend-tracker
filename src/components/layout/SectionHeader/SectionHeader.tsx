import { ReactNode } from "react";

import "./SectionHeader.scss";

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export const SectionHeader = ({ title, description, action }: SectionHeaderProps) => (
    <div className="section-header">
        <div className="section-header-text">
            <h2 className="section-header-title">{title}</h2>
            {description != null && <p className="section-header-description">{description}</p>}
        </div>
        {action != null && <div className="section-header-action">{action}</div>}
    </div>
);
