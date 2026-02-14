import { googleRouter } from "#api/auth";
import FalconFrame from "@wxn0brp/falcon-frame";
import "./ws";
import { wss } from "./ws/wss";
import { FF_VQL } from "@wxn0brp/vql";
import { VQL } from "#db";

const app = new FalconFrame();
FF_VQL(app, VQL);

if (process.env.NODE_ENV === "development") {
    app.use("/", (req, res, next) => {
        if (req.socket.remoteAddress !== "127.0.0.1" && req.url === "/")
            return res.send("Server is running");
        next();
    });
    app.static("public");
    app.static("front/dist");
    app.static("front");
} else {
    app.get("/", () => "Server is running");
}

app.use("/auth/google", googleRouter);

const server = app.l(18593);
wss.falconFrame(app, false);
wss.attachToHttpServer(server);
