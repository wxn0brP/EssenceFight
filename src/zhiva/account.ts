import crypto from "crypto";
import { existsSync, writeFileSync, readFileSync } from "fs";

const SERVER = process.env.ESSENCE_FIGHT_SERVER || "http://localhost:18593";
const identityPath = "./identity.json";

interface Identity {
    deviceId: string;
}

let identity: Identity;
if (existsSync(identityPath)) {
    identity = JSON.parse(readFileSync(identityPath, "utf-8"));
} else {
    identity = {
        deviceId: crypto.randomUUID()
    };
    writeFileSync(identityPath, JSON.stringify(identity));
}

async function getChallenge() {
    const res = await fetch(`${SERVER}/auth/challenge`);
    return res.json() as Promise<{ challengeId: string; nonce: string; difficulty: number }>;
}

function solvePoW(deviceId: string, nonce: string, difficulty: number) {
    let counter = 0;

    while (true) {
        const data = deviceId + nonce + counter;
        const hash = crypto.createHash("sha256").update(data).digest();

        let zeros = 0;
        for (const byte of hash) {
            if (byte === 0) zeros += 8;
            else {
                zeros += Math.clz32(byte) - 24;
                break;
            }
        }

        if (zeros >= difficulty) return counter;
        counter++;
    }
}

export async function registerAccount() {
    const { challengeId, nonce, difficulty } = await getChallenge();
    console.log("[EF-ZHI-00-1] Solving PoW...");

    const counter = solvePoW(identity.deviceId, nonce, difficulty);
    console.log("[EF-ZHI-00-2] PoW solved:", counter);

    const res = await fetch(`${SERVER}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            deviceId: identity.deviceId,
            challengeId,
            counter,
        }),
    });

    const data = await res.json() as { err: true, msg: string } | { err: false, _id: string, sessionToken: string };
    console.log("[EF-ZHI-00-3] Server response:", data);

    if (data.err === true) {
        throw new Error(data.msg);
    }

    writeFileSync("./session.json", JSON.stringify({
        sessionToken: data.sessionToken,
        userId: data._id
    }));

    return {
        _id: data._id,
        sessionToken: data.sessionToken
    }
}


export async function login() {
    const sessionPath = "./session.json";
    let session: { sessionToken: string; userId: string } | null = null;

    if (existsSync(sessionPath)) {
        session = JSON.parse(readFileSync(sessionPath, "utf-8"));
    }

    if (!session) {
        console.log("[EF-ZHI-00-4] No session found, registering...");
        return await registerAccount();
    }

    const res = await fetch(`${SERVER}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            deviceId: identity.deviceId,
            sessionToken: session.sessionToken,
        }),
    });

    const data = await res.json() as { err: true, msg: string } | { err: false, _id: string, sessionToken: string };

    if (data.err === true) {
        console.log("[EF-ZHI-00-5] Login failed, registering...");
        return await registerAccount();
    }

    writeFileSync(sessionPath, JSON.stringify({ sessionToken: data.sessionToken, userId: data._id }));
    console.log("[EF-ZHI-00-6] Logged in", data._id);

    return data;
}
