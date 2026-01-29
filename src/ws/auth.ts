import { stateStore, User } from "#api/auth";
import { db } from "#db";
import { GLSocket } from "@wxn0brp/gloves-link-server";
import { wss } from "./wss";

const namespace = wss.of("/auth");

namespace.auth(async () => {
    return {
        status: 200,
        user: {
            _id: crypto.randomUUID()
        }
    }
});

namespace.onConnect(async (socket: GLSocket) => {
    const id = socket.user._id;

    function google() {
        stateStore.add(id);
        socket.emit("auth.google", id);
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