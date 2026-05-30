import { ReactNode } from "react";

import { SectionHeader } from "components/layout";

import "./PageSection.scss";

interface PageSectionProps {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
}

export const PageSection = ({ title, description, action, children }: PageSectionProps) => (
    <section className="page-section">
        <SectionHeader title={title} description={description} action={action} />
        <div className="page-section-body">{children}</div>
    </section>
);
