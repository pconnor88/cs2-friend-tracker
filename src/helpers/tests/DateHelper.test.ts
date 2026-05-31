import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { canStepForward, formatFriendlyDate, rangeForPeriod, shiftAnchor } from "helpers";
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

    it("returns Monday 00:00 -> Sunday 23:59 of the week containing the anchor", () => {
        // Anchor: Saturday 30 May 2026
        const anchor = new Date(2026, 4, 30, 12, 0, 0);
        const { from, to } = rangeForPeriod(StatPeriod.Week, anchor);
        expect(from.getDay()).toBe(1);
        expect(from.getHours()).toBe(0);
        expect(from.getDate()).toBe(25);
        expect(to.getDay()).toBe(0);
        expect(to.getDate()).toBe(31);
        expect(to.getHours()).toBe(23);
        expect(to.getMinutes()).toBe(59);
    });

    it("handles week containing a Sunday correctly (Sunday belongs to previous Monday)", () => {
        const sunday = new Date(2026, 4, 31, 12, 0, 0);
        const { from, to } = rangeForPeriod(StatPeriod.Week, sunday);
        expect(from.getDate()).toBe(25);
        expect(to.getDate()).toBe(31);
    });

    it("returns the calendar month of the anchor", () => {
        const anchor = new Date(2026, 4, 15, 12, 0, 0);
        const { from, to } = rangeForPeriod(StatPeriod.Month, anchor);
        expect(from.getDate()).toBe(1);
        expect(from.getMonth()).toBe(4);
        expect(to.getDate()).toBe(31);
        expect(to.getMonth()).toBe(4);
        expect(to.getHours()).toBe(23);
    });

    it("returns 28-day February in a non-leap year", () => {
        const anchor = new Date(2026, 1, 15, 12, 0, 0);
        const { to } = rangeForPeriod(StatPeriod.Month, anchor);
        expect(to.getDate()).toBe(28);
    });

    it("returns epoch -> anchor for AllTime", () => {
        const anchor = new Date(NOW_ISO);
        const { from, to } = rangeForPeriod(StatPeriod.AllTime, anchor);
        expect(from.getTime()).toBe(0);
        expect(to.getTime()).toBe(anchor.getTime());
    });

    it("returns the single calendar day for Day", () => {
        const anchor = new Date(2026, 4, 15, 12, 0, 0);
        const { from, to } = rangeForPeriod(StatPeriod.Day, anchor);
        expect(from.getFullYear()).toBe(2026);
        expect(from.getMonth()).toBe(4);
        expect(from.getDate()).toBe(15);
        expect(from.getHours()).toBe(0);
        expect(from.getMinutes()).toBe(0);
        expect(to.getDate()).toBe(15);
        expect(to.getHours()).toBe(23);
        expect(to.getMinutes()).toBe(59);
    });
});

describe("shiftAnchor", () => {
    it("shifts by 7 days for Week", () => {
        const anchor = new Date(2026, 4, 15, 12);
        const back = shiftAnchor(StatPeriod.Week, anchor, -1);
        const forward = shiftAnchor(StatPeriod.Week, anchor, 1);
        expect(back.getDate()).toBe(8);
        expect(forward.getDate()).toBe(22);
    });

    it("shifts by 1 month for Month and resets to the 1st", () => {
        const anchor = new Date(2026, 4, 15, 12);
        const back = shiftAnchor(StatPeriod.Month, anchor, -1);
        const forward = shiftAnchor(StatPeriod.Month, anchor, 1);
        expect(back.getMonth()).toBe(3);
        expect(back.getDate()).toBe(1);
        expect(forward.getMonth()).toBe(5);
        expect(forward.getDate()).toBe(1);
    });

    it("is a no-op for AllTime", () => {
        const anchor = new Date(2026, 4, 15);
        expect(shiftAnchor(StatPeriod.AllTime, anchor, 1).getTime()).toBe(anchor.getTime());
    });

    it("shifts by 1 day for Day", () => {
        const anchor = new Date(2026, 4, 15, 12);
        const back = shiftAnchor(StatPeriod.Day, anchor, -1);
        const forward = shiftAnchor(StatPeriod.Day, anchor, 1);
        expect(back.getDate()).toBe(14);
        expect(back.getHours()).toBe(0);
        expect(forward.getDate()).toBe(16);
        expect(forward.getHours()).toBe(0);
    });

    it("crosses a month boundary correctly for Day", () => {
        const lastOfMonth = new Date(2026, 4, 31, 12);
        const forward = shiftAnchor(StatPeriod.Day, lastOfMonth, 1);
        expect(forward.getMonth()).toBe(5);
        expect(forward.getDate()).toBe(1);
    });
});

describe("canStepForward", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW_ISO));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("disallows stepping into a future week", () => {
        const thisWeek = new Date(2026, 4, 30, 12);
        expect(canStepForward(StatPeriod.Week, thisWeek)).toBe(false);
    });

    it("allows stepping into a past-to-current week", () => {
        const lastWeek = new Date(2026, 4, 20, 12);
        expect(canStepForward(StatPeriod.Week, lastWeek)).toBe(true);
    });

    it("disallows stepping into a future month", () => {
        const thisMonth = new Date(2026, 4, 15, 12);
        expect(canStepForward(StatPeriod.Month, thisMonth)).toBe(false);
    });

    it("allows stepping forward for a past day", () => {
        const yesterday = new Date(2026, 4, 29, 12);
        expect(canStepForward(StatPeriod.Day, yesterday)).toBe(true);
    });

    it("disallows stepping forward when on today", () => {
        const today = new Date(2026, 4, 30, 12);
        expect(canStepForward(StatPeriod.Day, today)).toBe(false);
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
