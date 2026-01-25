import { loader } from "#loader";
import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import { fetchApiJson } from "@wxn0brp/zhiva-base-lib/front/api";

function mockApi() {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token");
    if (!token) {
        const tk = prompt("Enter token");
        location.search = `?token=${tk}`;
    }

    return {
        err: false,
        data: {
            _id: token,
            sessionToken: token
        }
    }
}

const tokenRes:
    { err: true, msg: string } |
    { err: false, data: { _id: string, sessionToken: string } }
    = (localStorage.getItem("dev") === "true") ? mockApi() : await fetchApiJson("token");

if (tokenRes.err === true) {
    alert(tokenRes.msg);
    throw new Error(tokenRes.msg);
}

export const user = tokenRes.data;

export const socket = new GlovesLinkClient("/", {
    token: tokenRes.data.sessionToken,
    logs: true
});

socket.on("game.start", () => {
    qs("#view-main").style.display = "none";
    qs("#view-game").style.display = "";
    loader.decrement();
});

socket.on("wait", () => {
    console.log("wait");
});