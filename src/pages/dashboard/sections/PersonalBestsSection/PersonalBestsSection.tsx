import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { PlayerProfileRecord } from "db/types";
import { usePlayerProfiles } from "hooks";
import { StatPeriod } from "models";

import "./PersonalBestsSection.scss";

interface PersonalBestsSectionProps {
    period: StatPeriod;
    mapName?: string;
}

const formatSkillLabel = (skillId: string): string =>
    skillId
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/Ct /g, "CT ")
        .replace(/^T /g, "T ")
        .replace(/Adr/g, "ADR")
        .replace(/Mvps/g, "MVPs")
        .replace(/Smg/g, "SMG")
        .replace(/He /g, "HE ");

export const PersonalBestsSection = ({ period: _period, mapName: _mapName }: PersonalBestsSectionProps) => {
    const { data, isLoading } = usePlayerProfiles();

    if (isLoading || data === undefined) {
        return (
            <PageSection title="Personal bests">
                <div className="section-loading">Loading personal bests…</div>
            </PageSection>
        );
    }

    const profileByPlayer = new Map<string, PlayerProfileRecord>();
    for (const profile of data) {
        profileByPlayer.set(profile.steam64, profile);
    }

    const anyData = PLAYERS.some(player => {
        const profile = profileByPlayer.get(player.steam64);
        return profile !== undefined && profile.personalBests.length > 0;
    });

    if (!anyData) {
        return (
            <PageSection title="Personal bests">
                <div className="section-empty">No personal bests synced yet.</div>
            </PageSection>
        );
    }

    const allSkillIds = new Set<string>();
    for (const profile of data) {
        for (const pb of profile.personalBests) {
            allSkillIds.add(pb.skillId);
        }
    }
    const sortedSkillIds = Array.from(allSkillIds).sort((a, b) =>
        formatSkillLabel(a).localeCompare(formatSkillLabel(b))
    );

    return (
        <PageSection
            title="Personal bests"
            description="Each player's all-time best for every tracked skill. Source: Leetify."
        >
            <div className="personal-bests-cards">
                {PLAYERS.map(player => {
                    const profile = profileByPlayer.get(player.steam64);
                    const dotClass = `personal-bests-card-dot personal-bests-card-dot-${player.paletteIndex + 1}`;
                    const bestsBySkill = new Map<string, string>();
                    if (profile !== undefined) {
                        for (const pb of profile.personalBests) {
                            bestsBySkill.set(pb.skillId, pb.value);
                        }
                    }

                    return (
                        <div className="personal-bests-card" key={player.slug}>
                            <div className="personal-bests-card-header">
                                <span className={dotClass} aria-hidden="true" />
                                <h3 className="personal-bests-card-name">{player.displayName}</h3>
                            </div>
                            <div className="personal-bests-card-body">
                                {sortedSkillIds.map(skillId => {
                                    const value = bestsBySkill.get(skillId);
                                    return (
                                        <div className="personal-bests-row" key={skillId}>
                                            <span className="personal-bests-row-label">
                                                {formatSkillLabel(skillId)}
                                            </span>
                                            <span className="personal-bests-row-value">
                                                {value ?? "—"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </PageSection>
    );
};
