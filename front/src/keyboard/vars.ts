export const $keyboard = {
    buffer: "",
    feedbackTimeout: null as NodeJS.Timeout | null,
    history: [],
    historyIndex: -1,
    bufDiv: qs("#keyboard-buffer"),
    feedbackDiv: qs("#keyboard-feedback"),
    helpDiv: qs("#keyboard-help"),
    helpVisible: false,
    macros: {} as Record<string, string[]>,
};

export type Zone = "ground" | "castle" | "runes";

export const zoneMap: Record<string, Zone> = {
    g: "ground",
    c: "castle",
    r: "runes"
};
