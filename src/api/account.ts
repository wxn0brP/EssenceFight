import { db } from "#db";
import { INITIAL_LP, INITIAL_MMR, INITIAL_RANK, RankPlayersC } from "#mmr/vars";
import { RouteHandler, Router } from "@wxn0brp/falcon-frame";
import crypto from "crypto";

interface Challenge {
    nonce: string;
    difficulty: number;
    expiresAt: number;
}

export interface User {
    _id: string;
    deviceId: string;
    sessionToken: string;
    sessionExpiry: number;
}

const challenges = new Map<string, Challenge>();

export const authRouter = new Router();

authRouter.get("/challenge", (req, res) => {
    const challengeId = crypto.randomUUID();
    const nonce = crypto.randomBytes(16).toString("hex");
    const difficulty = 22;
    const expiresAt = Date.now() + 60_000;

    setTimeout(() => {
        challenges.delete(challengeId);
    }, 61_000);

    challenges.set(challengeId, { nonce, difficulty, expiresAt });
    return {
        challengeId,
        nonce,
        difficulty
    }
});

const checkChallenge: RouteHandler = async (req, res, next) => {
    const { deviceId, challengeId, counter } = req.body as {
        deviceId: string;
        challengeId: string;
        counter: number;
    };

    const challenge = challenges.get(challengeId);
    if (!challenge)
        return { err: true, msg: "Invalid challenge" }

    if (Date.now() > challenge.expiresAt)
        return { err: true, msg: "Challenge expired" }

    const hash = crypto
        .createHash("sha256")
        .update(deviceId + challenge.nonce + counter)
        .digest();

    let zeros = 0;
    for (const byte of hash) {
        if (byte === 0) zeros += 8;
        else {
            zeros += Math.clz32(byte) - 24;
            break;
        }
    }

    if (zeros < challenge.difficulty)
        return res.status(400).json({ err: true, msg: "PoW failed" });

    challenges.delete(challengeId);
    return next();
}

authRouter.post("/register", checkChallenge, async (req, res) => {
    const { deviceId } = req.body as { deviceId: string };

    const deviceIdUsed = await db.findOne<User>("users", { deviceId });
    if (deviceIdUsed)
        return { err: true, msg: "Device ID already in use" }

    const sessionToken = crypto.randomUUID();
    const sessionExpiry = Date.now() + 24 * 3600 * 1000;

    const dbUser = await db.add<User>("users", {
        deviceId,
        sessionToken: sessionToken,
        sessionExpiry: sessionExpiry,
        _id: undefined
    });

    await RankPlayersC.add({
        _id: dbUser._id,
        mmr: INITIAL_MMR,
        rank: INITIAL_RANK,
        lp: INITIAL_LP,
        gamesPlayed: 0
    });

    return {
        err: false,
        _id: dbUser._id,
        sessionToken
    }
});

authRouter.post("/login", checkChallenge, async (req, res) => {
    const { deviceId } = req.body as { deviceId: string };

    const user = await db.findOne<User>("users", { deviceId });
    if (!user)
        return { err: true, msg: "Unauthorized" };

    user.sessionToken = crypto.randomUUID();
    user.sessionExpiry = Date.now() + 24 * 3600 * 1000;

    await db.updateOne("users", { _id: user._id }, user);

    return {
        err: false,
        _id: user._id,
        sessionToken: user.sessionToken
    };
});

authRouter.post("/refresh-token", async (req, res) => {
    const { deviceId, sessionToken } = req.body as { deviceId: string; sessionToken: string };

    const user = await db.findOne<User>("users", { deviceId, sessionToken });
    if (!user)
        return { err: true, msg: "Unauthorized" };

    if (Date.now() > user.sessionExpiry)
        return { err: true, msg: "Session expired" };

    user.sessionToken = crypto.randomUUID();
    user.sessionExpiry = Date.now() + 24 * 3600 * 1000;

    await db.updateOne("users", { _id: user._id }, user);

    return {
        err: false,
        _id: user._id,
        sessionToken: user.sessionToken
    }
});
