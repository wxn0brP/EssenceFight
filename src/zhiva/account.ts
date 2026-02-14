import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import { spawn } from "bun";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { serverUrl } from "./config";

const identityPath = "./identity.json";

interface AuthResult {
    _id: string;
    sessionToken: string;
    authId: string
}

export async function authenticate() {
    let authId = "none";

    if (existsSync(identityPath)) {
        try {
            const identity = JSON.parse(readFileSync(identityPath, "utf-8"));
            authId = identity.authId;
        } catch { }
    }

    return new Promise(async (resolve) => {
        const authUrl = new URL("/auth", serverUrl);
        const client = new GlovesLinkClient(authUrl.toString());

        client.on("auth.response", (result: AuthResult) => {
            resolve(result);
            client.disconnect();
            console.log("[EF-ZHI-ATH-01] Authenticated:", result._id);
        });

        client.on("auth.google", (state: string) => {
            const urlPath = `/auth/google?state=${state}`;
            const url = new URL(urlPath, serverUrl).toString();

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
