import { loader } from "#loader";
import { searchGame } from "#ui/main";
import { socket } from "#ws";

socket.on("game.start", () => {
    qs("#view-main").style.display = "none";
    qs("#view-game").style.display = "";
    loader.decrement();
});

socket.on("wait", () => {
    console.log("wait");
});

if (localStorage.getItem("dev") === "true") {
    socket.on("disconnect", () => {
        setTimeout(() => {
            searchGame();
        }, 1000);
    });

    socket.on("error.valid", (msg: string) => {
        console.error(msg);
    });
}