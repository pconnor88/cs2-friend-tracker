import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatFriendlyDate, rangeForPeriod } from "helpers";
import { StatPeriod } from "models/enums";

const NOW_ISO = "2026-05-30T12:00:00.000Z";

describe("rangeForPeriod", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW_ISO));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns the last 7 days for Week", () => {
        const { from, to } = rangeForPeriod(StatPeriod.Week);
        expect(to.toISOString()).toBe(NOW_ISO);
        const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(7);
    });

    it("returns the last 30 days for Month", () => {
        const { from, to } = rangeForPeriod(StatPeriod.Month);
        expect(to.toISOString()).toBe(NOW_ISO);
        const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(30);
    });

    it("returns epoch -> now for AllTime", () => {
        const { from, to } = rangeForPeriod(StatPeriod.AllTime);
        expect(from.getTime()).toBe(0);
        expect(to.toISOString()).toBe(NOW_ISO);
    });
});

describe("formatFriendlyDate", () => {
    const NOW = new Date(NOW_ISO);

    it("returns 'Just now' for less than a minute ago", () => {
        const iso = new Date(NOW.getTime() - 5 * 1000).toISOString();
        expect(formatFriendlyDate(iso, NOW)).toBe("Just now");
    });

    it("returns minutes ago for under an hour", () => {
        const iso = new Date(NOW.getTime() - 15 * 60 * 1000).toISOString();
        expect(formatFriendlyDate(iso, NOW)).toBe("15 min ago");
    });

    it("returns hours ago for under a day", () => {
        const iso = new Date(NOW.getTime() - 5 * 60 * 60 * 1000).toISOString();
        expect(formatFriendlyDate(iso, NOW)).toBe("5 hr ago");
    });

    it("returns 'Yesterday' for ~1 day ago", () => {
        const iso = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
        expect(formatFriendlyDate(iso, NOW)).toBe("Yesterday");
    });

    it("returns N days ago for under a week", () => {
        const iso = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
        expect(formatFriendlyDate(iso, NOW)).toBe("3 days ago");
    });

    it("falls back to a long-form date past a week", () => {
        const iso = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const result = formatFriendlyDate(iso, NOW);
        expect(result).not.toMatch(/ago|Yesterday|Just now/);
        expect(result.length).toBeGreaterThan(0);
    });
});
