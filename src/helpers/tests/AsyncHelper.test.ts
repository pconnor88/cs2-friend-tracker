import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRateLimiter } from "helpers";

describe("createRateLimiter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("runs a single call immediately", async () => {
        const throttle = createRateLimiter(1000);
        const fn = vi.fn(async () => "a");

        const promise = throttle(fn);
        await vi.advanceTimersByTimeAsync(0);

        expect(fn).toHaveBeenCalledTimes(1);
        await expect(promise).resolves.toBe("a");
    });

    it("spaces queued calls by at least the configured interval", async () => {
        const throttle = createRateLimiter(1000);
        const calledAt: number[] = [];
        const start = Date.now();
        const make = (label: string) => async () => {
            calledAt.push(Date.now() - start);
            return label;
        };

        const p1 = throttle(make("a"));
        const p2 = throttle(make("b"));
        const p3 = throttle(make("c"));

        await vi.advanceTimersByTimeAsync(0);
        expect(calledAt).toEqual([0]);

        await vi.advanceTimersByTimeAsync(1000);
        expect(calledAt).toEqual([0, 1000]);

        await vi.advanceTimersByTimeAsync(1000);
        expect(calledAt).toEqual([0, 1000, 2000]);

        await expect(p1).resolves.toBe("a");
        await expect(p2).resolves.toBe("b");
        await expect(p3).resolves.toBe("c");
    });

    it("does not stall the queue when a call rejects", async () => {
        const throttle = createRateLimiter(500);
        const calledAt: number[] = [];
        const start = Date.now();

        const failing = throttle(() => {
            calledAt.push(Date.now() - start);
            return Promise.reject(new Error("boom"));
        });
        const failingHandled = failing.catch((err: Error) => err.message);
        const recovering = throttle(() => {
            calledAt.push(Date.now() - start);
            return Promise.resolve("ok");
        });

        await vi.advanceTimersByTimeAsync(0);
        await expect(failingHandled).resolves.toBe("boom");

        await vi.advanceTimersByTimeAsync(500);
        await expect(recovering).resolves.toBe("ok");
        expect(calledAt).toEqual([0, 500]);
    });
});
