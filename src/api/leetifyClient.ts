import { LeetifyGame, LeetifyProfile } from "api/types";
import { createRateLimiter } from "helpers";

const BASE_URL = "https://api.leetify.com";

const throttle = createRateLimiter(3000);

const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Leetify request failed (${response.status}) for ${url}`);
    }
    return await response.json() as T;
};

export const fetchProfile = (steam64: string): Promise<LeetifyProfile> =>
    throttle(() => fetchJson<LeetifyProfile>(`${BASE_URL}/api/profile/id/${steam64}`));

export const fetchGame = (gameId: string): Promise<LeetifyGame> =>
    throttle(() => fetchJson<LeetifyGame>(`${BASE_URL}/api/games/${gameId}`));
