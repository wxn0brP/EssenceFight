import { stateStore, User } from "#api/auth";
import { db } from "#db";
import { GLSocket } from "@wxn0brp/gloves-link-server";
import { wss } from "./wss";

wss.of("/auth").onConnect(async (socket: GLSocket) => {
    const state = crypto.randomUUID();

    function google() {
        stateStore.add(state);
        socket.emit("auth.google", state);
        socket.joinRoom("google-" + state);
    }

    socket.on("auth.request", async (authId) => {
        if (!authId || authId === "none") return google();

        const user = await db.findOne<User>("users", { authId });
        if (!user) return google();

        user.sessionToken = crypto.randomUUID();
        user.sessionExpiry = Date.now() + 24 * 3600 * 1000;
        await db.updateOne("users", { _id: user._id }, user);

        socket.emit("auth.response", { _id: user._id, sessionToken: user.sessionToken });
    });
});