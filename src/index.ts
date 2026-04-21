import { googleRouter } from "#api/auth";
import FalconFrame from "@wxn0brp/falcon-frame";
import "./ws";
import { wss } from "./ws/wss";
import { FF_VQL } from "@wxn0brp/vql";
import { VQL } from "#db";

const app = new FalconFrame();
FF_VQL(app, VQL);

app.get("/", () => "Server is running");

app.use("/auth/google", googleRouter);

const server = app.l(18593);
app.use("/gloves-link", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

wss.falconFrame(app, false);
wss.attachToHttpServer(server);
