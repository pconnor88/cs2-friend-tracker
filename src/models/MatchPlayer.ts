import { LeetifyGamePlayerStats, LeetifyOpeningDuel } from "api/types";

export interface MatchPlayer {
    steam64: string;
    raw: LeetifyGamePlayerStats;
    openingDuelRaw?: LeetifyOpeningDuel;
}
