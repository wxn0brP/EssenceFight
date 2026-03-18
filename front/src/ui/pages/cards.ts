import { loader } from "#loader";
import { V } from "@wxn0brp/vql-client";
import { AnyCard } from "_types/card";

const cardGrid = qs("#available-cards");
const deckCount = qs<HTMLSpanElement>("#deck-count");

export const selectedCards = new Set<string>();

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

export async function loadCards() {
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
