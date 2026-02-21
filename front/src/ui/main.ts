import { loader } from "#loader";
import { socket } from "#ws";
import { fetchVQL, V } from "@wxn0brp/vql-client";
import { AnyCard } from "_types/card";
import { Evt_UserInfo } from "_types/socket";

export const searchGameButton = qs<HTMLButtonElement>("#search-game");
const cardGrid = qs("#available-cards");
const deckCount = qs<HTMLSpanElement>("#deck-count");
const matchProposalEl = qs("#match-proposal");
const matchAcceptBtn = qs<HTMLButtonElement>("#match-accept");
const matchDeclineBtn = qs<HTMLButtonElement>("#match-decline");

const selectedCards = new Set<string>();

function updateDeckStatus() {
    deckCount.innerText = `Selected: ${selectedCards.size}/15`;
}

function renderCard(card: AnyCard) {
    const el = document.createElement("div");
    el.className = "card";
    el.setAttribute("data-id", card._id);

    const cost = "cost" in card ? card.cost : "";
    const hp = "health" in card ? card.health : "";
    let damage = "";
    if ("attack" in card) {
        damage = Math.max(card.attack.physical, card.attack.arts, card.attack.true).toString();
    }

    const cardClass = "class" in card ? card.class[0] : card.type;

    el.innerHTML = `
        <div class="card-content">
            <div class="card-header">
                <div class="card-name">${card.name}</div>
            </div>
            <div class="card-body">
                 <div class="card-class">${cardClass}</div>
            </div>
            <div class="card-footer">
                ${hp ? `<div class="card-stat hp">HP ${hp}</div>` : ""}
                ${damage ? `<div class="card-stat attack">DMG ${damage}</div>` : ""}
                ${cost !== "" ? `<div class="card-stat cost">C ${cost}</div>` : ""}
            </div>
        </div>
    `;

    el.addEventListener("click", () => {
        if (selectedCards.has(card._id)) {
            selectedCards.delete(card._id);
            el.classList.remove("selected");
        } else {
            if (selectedCards.size >= 15) return alert("Max 15 cards allowed!");
            selectedCards.add(card._id);
            el.classList.add("selected");
        }
        updateDeckStatus();
    });

    return el;
}

async function loadCards() {
    loader.increment();
    const cards = await V<AnyCard[]>`card card`;
    const deck = await V<{ cards: string[] }>`client deck!`;
    loader.decrement();

    cardGrid.innerHTML = "";
    selectedCards.clear();

    cards.forEach(card => {
        const el = renderCard(card);
        if (deck && deck.cards.includes(card._id)) {
            selectedCards.add(card._id);
            el.classList.add("selected");
        }
        cardGrid.appendChild(el);
    });
    updateDeckStatus();
}

loadCards();

export function searchGame() {
    if (selectedCards.size === 0)
        if (!confirm("You haven't selected any cards. A random deck will be used. Do you want to proceed?"))
            return;

    searchGameButton.disabled = true;
    const deck = Array.from(selectedCards);

    socket.emit("game.search", deck, (data: true | string) => {
        if (data === true) {
            loader.increment();
            console.log("[EF-UI-01] Game searching...");
            searchGameButton.innerHTML = "Searching...";
        } else {
            console.error("[EF-UI-02] Game searching error:", data);
            searchGameButton.innerHTML = "Search (err)";
            searchGameButton.disabled = false;
            if (typeof data === "string") alert(data);
        }
    });

    fetchVQL({
        db: "client",
        d: {
            updateOneOrAdd: {
                collection: "deck",
                search: {},
                updater: {
                    cards: deck
                }
            }
        }
    });
}

searchGameButton.addEventListener("click", () => searchGame());

function getUserInfo() {
    loader.increment();

    socket.emit("user.info", (data: Evt_UserInfo) => {
        qs("#user-name").innerHTML = data.name;
        qs("#ep-rank").innerHTML = data.rank;
        qs("#ep-bar").title = data.lp.toString() + " / 100";
        qs("#ep-bar-fill").style.setProperty("--ep-percent", `${data.lp / 100 * 100}%`);
        loader.decrement();
    });
}

getUserInfo();

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
