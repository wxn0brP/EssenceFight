import { db } from "#db";
import { INITIAL_LP, INITIAL_MMR, INITIAL_RANK, RankPlayersC } from "#mmr/vars";
import { wss } from "#ws/wss";
import { Router } from "@wxn0brp/falcon-frame";

export interface User {
    _id: string;
    authId: string;
    sessionToken: string;
    sessionExpiry: number;
}

export const googleRouter = new Router();

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
} = process.env;

export const stateStore = new Set<string>();

googleRouter.get("/", (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
        res.status(500).send("The Google OAuth client is not configured");
    }

    if (!req.query.state) {
        return res.status(400).send("Missing OAuth state");
    }

    const state = req.query.state;

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "openid",
        state,
        prompt: "consent",
    });

    res.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
});

googleRouter.get("/callback", async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state || !stateStore.has(state as string)) {
        return res.status(400).send("Invalid OAuth state");
    }

    stateStore.delete(state as string);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code: code as string,
            client_id: GOOGLE_CLIENT_ID!,
            client_secret: GOOGLE_CLIENT_SECRET!,
            redirect_uri: GOOGLE_REDIRECT_URI!,
            grant_type: "authorization_code",
        }),
    });

    const tokenData = await tokenRes.json();

    const userRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        }
    );

    const googleUser = await userRes.json() as { sub: string, picture: string };

    const efUser = await db.findOne<{ _id: string }>("google", { g: googleUser.sub });
    if (efUser) {
        wss.room("google-" + state).emit("auth.google.response", efUser._id);
    } else {
        const newUser: { _id: string } = await db.add("google", { g: googleUser.sub });

        const dbUser = await db.add<User>("users", {
            sessionToken: "",
            sessionExpiry: 1,
            _id: undefined,
            authId: newUser._id
        });

        await RankPlayersC.add({
            _id: dbUser._id,
            mmr: INITIAL_MMR,
            rank: INITIAL_RANK,
            lp: INITIAL_LP,
            gamesPlayed: 0
        });

        wss.room("google-" + state).emit("auth.google.response", dbUser._id);
    }

    return "Success. You can now close this window.";
});