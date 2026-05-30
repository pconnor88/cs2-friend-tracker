import { MatchPlayer } from "./MatchPlayer";

export interface Match {
    gameId: string;
    mapName: string;
    finishedAt: string;
    durationSeconds: number;
    matchResult: "win" | "loss" | "tie";
    scoreOwn: number;
    scoreOpponent: number;
    dataSource: string;
    players: MatchPlayer[];
}
