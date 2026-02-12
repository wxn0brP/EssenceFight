import { AnyCard } from "_types/card";

export const unusedCards = qs("#unused-cards-container");
export const unusedCardsOverlay = qs("#unused-cards-overlay");

let previousCardCount = -1;

function setCardsPosition() {
    const cards = Array.from(unusedCards.children) as HTMLDivElement[];
    const overlayCards = Array.from(unusedCardsOverlay.children) as HTMLDivElement[];

    for (let i = 0; i < cards.length; i++) {
        cards[i].style.top = `${overlayCards[i].offsetTop}px`;
        cards[i].style.left = `${overlayCards[i].offsetLeft}px`;
    }
}

window.addEventListener("resize", () => {
    if (previousCardCount <= 0) return;
    setCardsPosition();
});

export function renderUnusedCards(cards: AnyCard[]) {
    const isChanged = cards.length !== previousCardCount;
    if (!isChanged) return;

    previousCardCount = cards.length;
    const unusedIds = cards.map(card => card._id);

    unusedCardsOverlay.innerHTML = "";
    for (const card of cards) {
        const div = document.createElement("article");
        div.setAttribute("data-card-id", card._id);
        unusedCardsOverlay.appendChild(div);
    }

    // If unused cards are already rendered
    if (unusedCards.innerHTML) {
        Array.from(unusedCards.children).map((card: HTMLDivElement) => {
            const cardId = card.getAttribute("data-card-id");
            if (!unusedIds.includes(cardId))
                card.remove();
        });
        setCardsPosition();
        return;
    }

    for (const card of cards) {
        const div = document.createElement("article");
        div.innerHTML = `
<div class="card-content">
    <div class="card-header">
        <h3 class="card-name">${card.name}</h3>
    </div>
    <div class="card-body">
        <p class="card-class">${card.type}</p>
    </div>
</div>
`;
        div.title = JSON.stringify(card, null, 2);
        div.setAttribute("data-card-id", card._id);
        unusedCards.appendChild(div);
    }

    setCardsPosition();
}

export function resetUnusedCards() {
    unusedCards.innerHTML = "";
    unusedCardsOverlay.innerHTML = "";
    previousCardCount = -1;
}
