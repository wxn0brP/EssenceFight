import { app, oneWindow } from "@wxn0brp/zhiva-base-lib";
import { apiRouter } from "@wxn0brp/zhiva-base-lib/api";
import { authenticate } from "./account";
import { serverUrl } from "./config";

oneWindow();
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

process.on("uncaughtException", (e) => {
    console.error("[EF-ZHI-01-2] Error:", e);
});

process.on("unhandledRejection", (e) => {
    console.error("[EF-ZHI-01-3] Error:", e);
});
