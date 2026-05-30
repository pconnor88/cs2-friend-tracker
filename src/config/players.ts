import { PlayerConfig } from "models";

export const PLAYERS: readonly PlayerConfig[] = [
    { slug: "pete", displayName: "Pete", steam64: "76561197981513573", paletteIndex: 0 },
    { slug: "jed", displayName: "Jed", steam64: "76561198029125226", paletteIndex: 1 },
    { slug: "snell", displayName: "Snell", steam64: "76561199060284867", paletteIndex: 2 }
] as const;
