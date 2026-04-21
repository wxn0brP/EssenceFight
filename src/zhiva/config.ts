async function getSocketServerConfig() {
    if (process.env.ESSENCE_FIGHT_SERVER) return process.env.ESSENCE_FIGHT_SERVER;
    const config = await fetch("https://aresconfig.ct8.pl/ef.txt").then(res => res.text());
    return config.trim();
}

export const serverUrl = await getSocketServerConfig();
