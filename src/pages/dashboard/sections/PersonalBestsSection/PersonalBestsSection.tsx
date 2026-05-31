import { PageSection } from "components/layout";
import { PLAYERS } from "config";
import { PlayerProfileRecord } from "db/types";
import { rankStats } from "helpers";
import { useAllMatches, usePlayerProfiles } from "hooks";
import { Rank, StatPeriod } from "models";

import "./PersonalBestsSection.scss";

interface PersonalBestsSectionProps {
    period: StatPeriod;
    mapName?: string;
}

const ALL_TIME_RANGE = { from: new Date(0), to: new Date(2100, 0, 1) };

const LOWER_IS_BETTER_SKILLS = new Set<string>([
    "deaths",
    "deaths_to_bomb",
    "deaths_without_firing_a_shot",
    "got_flashed",
    "opening_duels_lost",
    "time_to_damage"
]);

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

const formatMapName = (mapName: string): string =>
    mapName
        .replace(/^de_/, "")
        .replace(/^cs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

const parseNumeric = (raw: string): number | null => {
    const m = raw.match(/-?\d+(\.\d+)?/);
    if (m === null) {
        return null;
    }
    const v = parseFloat(m[0]);
    return Number.isFinite(v) ? v : null;
};

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return iso;
    }
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export const PersonalBestsSection = ({ period: _period, mapName: _mapName }: PersonalBestsSectionProps) => {
    const { data, isLoading } = usePlayerProfiles();
    const { data: allMatches } = useAllMatches(StatPeriod.AllTime, ALL_TIME_RANGE);

    const matchMeta = new Map<string, { mapName: string; finishedAt: string }>();
    for (const m of allMatches ?? []) {
        matchMeta.set(m.gameId, { mapName: m.mapName, finishedAt: m.finishedAt });
    }

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

    const bestsByPlayerSkill = new Map<string, Map<string, { value: string; gameId?: string }>>();
    for (const player of PLAYERS) {
        const profile = profileByPlayer.get(player.steam64);
        const map = new Map<string, { value: string; gameId?: string }>();
        if (profile !== undefined) {
            for (const pb of profile.personalBests) {
                map.set(pb.skillId, { value: pb.value, gameId: pb.gameId });
            }
        }
        bestsByPlayerSkill.set(player.steam64, map);
    }

    const rankBySkillThenPlayer = new Map<string, Map<string, Rank>>();
    for (const skillId of sortedSkillIds) {
        const inputs: { steam64: string; value: number }[] = [];
        for (const player of PLAYERS) {
            const entry = bestsByPlayerSkill.get(player.steam64)?.get(skillId);
            if (entry === undefined) {
                continue;
            }
            const numeric = parseNumeric(entry.value);
            if (numeric === null) {
                continue;
            }
            inputs.push({ steam64: player.steam64, value: numeric });
        }
        const ranked = rankStats(inputs, {
            higherIsBetter: !LOWER_IS_BETTER_SKILLS.has(skillId)
        });
        rankBySkillThenPlayer.set(
            skillId,
            new Map(ranked.map(r => [r.steam64, r.rank as Rank]))
        );
    }

    return (
        <PageSection
            title="Personal bests"
            description="Each player's all-time best for every tracked skill. Hover a value for the map and date it was set. Source: Leetify."
        >
            <div className="personal-bests-cards">
                {PLAYERS.map(player => {
                    const dotClass = `personal-bests-card-dot personal-bests-card-dot-${player.paletteIndex + 1}`;
                    const bestsBySkill = bestsByPlayerSkill.get(player.steam64) ?? new Map();

                    return (
                        <div className="personal-bests-card" key={player.slug}>
                            <div className="personal-bests-card-header">
                                <span className={dotClass} aria-hidden="true" />
                                <h3 className="personal-bests-card-name">{player.displayName}</h3>
                            </div>
                            <div className="personal-bests-card-body">
                                {sortedSkillIds.map(skillId => {
                                    const entry = bestsBySkill.get(skillId);
                                    const rank = rankBySkillThenPlayer.get(skillId)?.get(player.steam64);
                                    const meta = entry?.gameId !== undefined
                                        ? matchMeta.get(entry.gameId)
                                        : undefined;
                                    const tooltip = meta !== undefined
                                        ? `${formatMapName(meta.mapName)} · ${formatDate(meta.finishedAt)}`
                                        : undefined;
                                    const valueClass = rank !== undefined
                                        ? `personal-bests-row-value personal-bests-row-value-${rank}`
                                        : "personal-bests-row-value";
                                    return (
                                        <div className="personal-bests-row" key={skillId}>
                                            <span className="personal-bests-row-label">
                                                {formatSkillLabel(skillId)}
                                            </span>
                                            <span
                                                className={valueClass}
                                                data-tooltip={tooltip}
                                                title={tooltip}
                                            >
                                                {entry?.value ?? "—"}
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
