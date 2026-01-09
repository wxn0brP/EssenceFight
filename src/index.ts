import FalconFrame from "@wxn0brp/falcon-frame";
import { wss } from "./ws";

const app = new FalconFrame();

if (process.env.NODE_ENV === "development") {
    app.static("public");
    app.static("front/dist");
    app.static("front");
} else {
    app.get("/", () => "Server is running");
}

const server = app.l(18593);
wss.falconFrame(app, false);
wss.createServer(server);