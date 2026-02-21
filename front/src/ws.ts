import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import { fetchApiJson } from "@wxn0brp/zhiva-base-lib/front/api";

const params = new URLSearchParams(window.location.search);

function mockApi() {
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

const socketUrl = await fetchApiJson("config/socket").then(res => res.url);

export const user = tokenRes.data;

export const socket = new GlovesLinkClient(socketUrl, {
    token: tokenRes.data.sessionToken,
    logs: true,
    reConnectInterval: 3000,
});

(window as any).mgl_socket = socket;
