import { app, oneWindow, waitToStart } from "@wxn0brp/zhiva-base-lib";
import { apiRouter, apiSecret } from "@wxn0brp/zhiva-base-lib/api";
import { authenticate } from "./account";
import { serverUrl } from "./config";
import { FF_VQL } from "@wxn0brp/vql";
import { client_VQL } from "./db";

if (process.env.NODE_ENV === "development") {
    await waitToStart();
    console.log("Session token", "?zhiva-secret=" + apiSecret);
} else {
    // Zhiva
    oneWindow();
}
app.static("public");
app.static("front/dist");
app.static("front");

apiRouter.get("/config/socket", async () => {
    return { err: false, url: serverUrl };
});

apiRouter.get("/token", async (req, res) => {
    try {
        const data = await authenticate();
        return { err: false, data };
    } catch (e) {
        console.error("[EF-ZHI-01-1] Error:", e);
        res.status(500).json({ err: true, msg: "Internal server error" });
    }
});

FF_VQL(apiRouter, client_VQL);

process.on("uncaughtException", (e) => {
    console.error("[EF-ZHI-01-2] Error:", e);
});

process.on("unhandledRejection", (e) => {
    console.error("[EF-ZHI-01-3] Error:", e);
});
