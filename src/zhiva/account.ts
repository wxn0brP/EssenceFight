import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import { spawn } from "bun";
import { existsSync, readFileSync, writeFileSync } from "fs";

const SERVER = process.env.ESSENCE_FIGHT_SERVER || "http://localhost:18593";
const identityPath = "./identity.json";

type AuthResult = { _id: string, sessionToken: string, authId: string };

export async function authenticate() {
    let authId = "none";

    if (existsSync(identityPath)) {
        try {
            const identity = JSON.parse(readFileSync(identityPath, "utf-8"));
            authId = identity.authId;
        } catch { }
    }

    return new Promise(async (resolve) => {
        const client = new GlovesLinkClient(SERVER + "/auth");

        client.on("auth.response", (result: AuthResult) => {
            resolve(result);
            client.disconnect();
            console.log("[EF-ZHI-ATH-01] Authenticated:", result._id);
        });

        client.on("auth.google", (state: string) => {
            const url = `${SERVER}/auth/google?state=${state}`;

            const os = process.platform;
            if (os === "win32") spawn(["start", url]);
            else if (os === "darwin") spawn(["open", url]);
            else spawn(["xdg-open", url]);
        });

        client.on("auth.google.response", (id: string) => {
            writeFileSync(identityPath, JSON.stringify({ authId: id }));
            client.emit("auth.request", id);
        });

        client.emit("auth.request", authId);
    });
}