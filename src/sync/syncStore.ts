import { PlayerConfig } from "models";

export type SyncStatus = "idle" | "syncing" | "complete" | "error";
export type PlayerSyncStatus = "pending" | "running" | "complete" | "error";

export interface PlayerProgress {
    steam64: string;
    displayName: string;
    paletteIndex: 0 | 1 | 2;
    status: PlayerSyncStatus;
    totalNew: number;
    completed: number;
    errorMessage?: string;
}

export interface SyncState {
    status: SyncStatus;
    startedAt?: number;
    completedAt?: number;
    players: PlayerProgress[];
}

let state: SyncState = { status: "idle", players: [] };
const listeners = new Set<() => void>();

const emit = (): void => {
    for (const l of listeners) {
        l();
    }
};

const setState = (next: SyncState): void => {
    state = next;
    emit();
};

export const syncStore = {
    getSnapshot: (): SyncState => state,
    subscribe: (l: () => void): (() => void) => {
        listeners.add(l);
        return () => {
            listeners.delete(l);
        };
    },

    beginSync: (players: readonly PlayerConfig[]): void => {
        setState({
            status: "syncing",
            startedAt: Date.now(),
            completedAt: undefined,
            players: players.map(p => ({
                steam64: p.steam64,
                displayName: p.displayName,
                paletteIndex: p.paletteIndex,
                status: "pending",
                totalNew: 0,
                completed: 0
            }))
        });
    },

    startPlayerSync: (steam64: string, totalNew: number): void => {
        setState({
            ...state,
            players: state.players.map(p =>
                p.steam64 === steam64 ? { ...p, status: "running", totalNew } : p
            )
        });
    },

    advancePlayerSync: (steam64: string): void => {
        setState({
            ...state,
            players: state.players.map(p =>
                p.steam64 === steam64 ? { ...p, completed: p.completed + 1 } : p
            )
        });
    },

    completePlayerSync: (steam64: string, opts?: { errorMessage?: string }): void => {
        setState({
            ...state,
            players: state.players.map(p =>
                p.steam64 === steam64
                    ? {
                          ...p,
                          status: opts?.errorMessage !== undefined ? "error" : "complete",
                          errorMessage: opts?.errorMessage
                      }
                    : p
            )
        });
    },

    endSync: (): void => {
        const hasError = state.players.some(p => p.status === "error");
        setState({
            ...state,
            status: hasError ? "error" : "complete",
            completedAt: Date.now()
        });
    },

    dismiss: (): void => {
        setState({ ...state, status: "idle" });
    }
};
