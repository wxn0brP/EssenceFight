import { loader } from "#loader";
import { socket } from "#ws";
import { Evt_UserInfo } from "_types/socket";
import "./pages/index";

const matchProposalEl = qs("#match-proposal");
const matchAcceptBtn = qs<HTMLButtonElement>("#match-accept");
const matchDeclineBtn = qs<HTMLButtonElement>("#match-decline");
const userNameDiv = qs("#pg_profile__name");

export function getUserInfo() {
    loader.increment();

    socket.emit("user.info", (data: Evt_UserInfo) => {
        userNameDiv.innerHTML = data.name;
        qs("#pg_profile__ep_rank").innerHTML = data.rank;
        qs("#pg_profile__ep_bar").title = data.lp.toString() + " / 100";
        qs("#pg_profile__ep_bar_fill").style.setProperty("--ep-percent", `${data.lp / 100 * 100}%`);
        loader.decrement();
    });
}

socket.on("match.proposal", (data: any) => {
    matchProposalEl.style.display = "flex";
    matchProposalEl.classList.add("visible");
});

matchAcceptBtn.addEventListener("click", () => {
    socket.emit("match.proposal.respond", true);
    matchProposalEl.style.display = "none";
    matchProposalEl.classList.remove("visible");
});

matchDeclineBtn.addEventListener("click", () => {
    socket.emit("match.proposal.respond", false);
    matchProposalEl.style.display = "none";
    matchProposalEl.classList.remove("visible");
});

userNameDiv.addEventListener("dblclick", () => {
    const lastName = userNameDiv.innerHTML;
    const input = document.createElement("input");
    userNameDiv.innerHTML = "";
    userNameDiv.appendChild(input);
    input.value = lastName;
    input.focus();

    // Prevent double save
    let block = false;

    function save() {
        if (block) return;
        block = true;
        const affirmation = confirm("Save changes?");
        userNameDiv.innerHTML = affirmation ? input.value : lastName;
        if (!affirmation) return;

        socket.emit("user.meta.name.set", input.value);
    }

    input.addEventListener("blur", () => save());
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") save();
    });
});
