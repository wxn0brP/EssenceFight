export const logEffect = (module: string, ...args: any[]) =>
    process.env.EF_LOG_EFFECT === "true" &&
    console.log("[EFFECT][" + module + "]", ...args);
