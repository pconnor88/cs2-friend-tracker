import { Rank } from "./enums";

export interface RankResult {
    steam64: string;
    value: number;
    rank: Rank;
    deltaToMedian: number;
    isBest: boolean;
    isWorst: boolean;
}
