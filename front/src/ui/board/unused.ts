import { AnyCard } from "_types/card";

export const unusedCards = document.qs("#unused-cards");

export function renderUnusedCards(cards: AnyCard[]) {
    unusedCards.innerHTML = "";
    for (const card of cards) {
        const div = document.createElement("article");
        div.innerHTML = `
<p>${card.name}</p>
<p>${card.type}</p>
`;
        div.title = JSON.stringify(card, null, 2);
        div.setAttribute("data-card-id", card._id);
        unusedCards.appendChild(div);
    }
}