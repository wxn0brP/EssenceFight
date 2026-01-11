import crypto from "crypto";
import { existsSync, writeFileSync, readFileSync } from "fs";

const SERVER = process.env.ESSENCE_FIGHT_SERVER || "http://localhost:18593";
const identityPath = "./identity.json";
const sessionPath = "./session.json";

interface Identity {
    deviceId: string;
}

interface Session {
    deviceId: string;
    userId: string;
    sessionToken: string;
}

type AuthResult = { err: true, msg: string } | { err: false, _id: string, sessionToken: string };

async function getChallenge(): Promise<{ challengeId: string; nonce: string; difficulty: number }> {
    const res = await fetch(`${SERVER}/auth/challenge`);
    return res.json();
}

function solvePoW(deviceId: string, nonce: string, difficulty: number): number {
    let counter = 0;
    const now = Date.now();
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
        if (zeros >= difficulty) {
            console.log("[EF-ZHI-AUTH-05-01] Time taken:", Math.round((Date.now() - now) / 1000) + "s");
            return counter;
        }
        counter++;
    }
}

async function _performPoWRegister(deviceId: string): Promise<AuthResult> {
    const { challengeId, nonce, difficulty } = await getChallenge();
    console.log("[EF-ZHI-AUTH-01-02] Solving PoW for registration...");

    const counter = solvePoW(deviceId, nonce, difficulty);
    console.log("[EF-ZHI-AUTH-01-02] PoW solved:", counter);

    const res = await fetch(`${SERVER}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, challengeId, counter }),
    });

    const data = await res.json() as AuthResult;
    console.log("[EF-ZHI-AUTH-01-03] Registration server response:", data);

    return data;
}

async function _performPoWLogin(deviceId: string): Promise<AuthResult> {
    const { challengeId, nonce, difficulty } = await getChallenge();
    console.log("[EF-ZHI-AUTH-02-01] Solving PoW for login...");

    const counter = solvePoW(deviceId, nonce, difficulty);
    console.log("[EF-ZHI-AUTH-02-02] PoW solved:", counter);

    const res = await fetch(`${SERVER}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, challengeId, counter }),
    });

    const data = await res.json() as AuthResult;
    console.log("[EF-ZHI-AUTH-02-03] Login server response:", data);

    return data;
}


export async function authenticate() {
    // 1. If session exists, try to refresh it.
    if (existsSync(sessionPath)) {
        const session: Session = JSON.parse(readFileSync(sessionPath, "utf-8"));
        console.log("[EF-ZHI-AUTH-03-01] Found session, attempting to refresh token...");

        const res = await fetch(`${SERVER}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deviceId: session.deviceId,
                sessionToken: session.sessionToken,
            }),
        });

        const data = await res.json() as AuthResult;

        if (data.err === false) {
            const newSession: Session = { ...session, sessionToken: data.sessionToken };
            writeFileSync(sessionPath, JSON.stringify(newSession));
            console.log("[EF-ZHI-AUTH-03-02] Session refresh successful.");
            return newSession;
        }

        console.log("[EF-ZHI-AUTH-03-03] Session refresh failed:", data.msg);
    }

    // 2. No valid session. If identity exists, try to PoW-login.
    if (existsSync(identityPath)) {
        const identity: Identity = JSON.parse(readFileSync(identityPath, "utf-8"));
        console.log("[EF-ZHI-AUTH-03-04] Found identity, attempting PoW login.");

        const loginData = await _performPoWLogin(identity.deviceId);

        if (loginData.err === false) {
            const newSession: Session = { deviceId: identity.deviceId, userId: loginData._id, sessionToken: loginData.sessionToken };
            writeFileSync(sessionPath, JSON.stringify(newSession));

            console.log("[EF-ZHI-AUTH-03-05] PoW login successful.");
            return newSession;
        }

        // If PoW login fails for an existing identity, it's a fatal error.
        // We shouldn't try to register, as the deviceId is already taken.
        console.error("[ZHI-AUTH] FATAL: PoW login failed for existing identity:", loginData.msg);
        throw new Error(`PoW login failed: ${loginData.msg}`);
    }

    // 3. No identity file. This is a new client. Register a new account.
    console.log("[EF-ZHI-AUTH-03-06] No identity found, creating new one and registering...");

    const newIdentity: Identity = { deviceId: crypto.randomUUID() };
    writeFileSync(identityPath, JSON.stringify(newIdentity));

    const registerData = await _performPoWRegister(newIdentity.deviceId);

    if (registerData.err === true) {
        console.error("[EF-ZHI-AUTH-03-07] FATAL: Registration failed for new identity:", registerData.msg);
        throw new Error(`Registration failed: ${registerData.msg}`);
    }

    const newSession: Session = { deviceId: newIdentity.deviceId, userId: registerData._id, sessionToken: registerData.sessionToken };
    writeFileSync(sessionPath, JSON.stringify(newSession));

    console.log("[EF-ZHI-AUTH-03-08] New account registration successful.");
    return newSession;
}