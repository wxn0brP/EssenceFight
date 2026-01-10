import { app, oneWindow } from "@wxn0brp/zhiva-base-lib";
import { apiRouter } from "@wxn0brp/zhiva-base-lib/api";
import { login } from "./account";

oneWindow();
app.static("public");
app.static("front/dist");
app.static("front");

apiRouter.get("/token", async (req, res) => {
    try {
        const data = await login();
        return { err: false, data };
    } catch (e) {
        console.error("[EF-ZHI-01-1] Error:", e);
        res.status(500).json({ err: true, msg: "Internal server error" });
    }
})