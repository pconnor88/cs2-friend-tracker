export const createRateLimiter = (minIntervalMs: number) => {
    let nextAvailableAt = 0;
    return <T>(fn: () => Promise<T>): Promise<T> => {
        const now = Date.now();
        const startAt = Math.max(now, nextAvailableAt);
        nextAvailableAt = startAt + minIntervalMs;
        const wait = startAt - now;
        return new Promise<T>((resolve, reject) => {
            setTimeout(() => {
                fn().then(resolve, reject);
            }, wait);
        });
    };
};

export const pLimit = (concurrency: number) => {
    let active = 0;
    const queue: (() => void)[] = [];

    const next = () => {
        if (active >= concurrency || queue.length === 0) {
            return;
        }
        active++;
        const run = queue.shift();
        if (run !== undefined) {
            run();
        }
    };

    return <T>(fn: () => Promise<T>): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push(() => {
            fn().then(value => {
                active--;
                resolve(value);
                next();
            }).catch(err => {
                active--;
                reject(err);
                next();
            });
        });
        next();
    });
};
