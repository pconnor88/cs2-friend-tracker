import { useSyncExternalStore } from "react";

import { SyncState, syncStore } from "./syncStore";

export const useSyncStore = (): SyncState =>
    useSyncExternalStore(syncStore.subscribe, syncStore.getSnapshot, syncStore.getSnapshot);
