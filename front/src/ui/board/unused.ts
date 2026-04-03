import { gameState } from "#state";
import { socket } from "#ws";
import { SpellCard } from "_types/card/card";
import { CardEffect } from "_types/card/effect";
import { AnyCard } from "_types/card/sub";
import { startTargeting, TargetingState } from "./targeting";

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

function renderSpellEffects(card: SpellCard, cardId: string): string {
    const abilityEffects = (card.effects || []).filter(
        (effect: CardEffect.Effect) => effect.trigger === "ability"
    );

    if (abilityEffects.length === 0) return "";

    const buttons = abilityEffects.map((effect: CardEffect.Effect) => {
        const targetType = card.targetScope || effect.operations?.find(op => op.op === "resolve_target")?.target || "self";
        const targetLabel = targetType === "enemy" ? "Enemy" : targetType === "ally" ? "Ally" : "";
        const title = `${effect.name}\n${effect.description || ""}${targetLabel ? "\nTarget: " + targetLabel : ""}`;
        return `<button
class="spell-effect-btn"
data-card-id="${cardId}"
data-effect-id="${effect._id}"
data-target-type="${targetType}"
title="${title.replace(/"/g, "&quot;")}">
${effect.name}
</button>`;
    }).join("");

    return `<div class="card-spell-effects">${buttons}</div>`;
}

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
        const spellEffectsHtml = card.type === "spell" ? renderSpellEffects(card as SpellCard, card._id) : "";

        const div = document.createElement("article");
        div.innerHTML = `
<div class="card-content">
    <div class="card-header">
        <h3 class="card-name">${card.name}</h3>
    </div>
    <div class="card-body">
        <p class="card-class">${card.type}</p>
    </div>
    ${spellEffectsHtml}
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

export function setupUnusedCardsEvents() {
    unusedCards.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const effectBtn = target.closest<HTMLButtonElement>(".spell-effect-btn");

        if (!effectBtn)
            return;

        e.stopPropagation();
        if (gameState.data.aggressive !== gameState.myBoardIndex) return console.error("Not your turn");

        const cardId = effectBtn.getAttribute("data-card-id");
        const effectId = effectBtn.getAttribute("data-effect-id");
        const targetType = effectBtn.getAttribute("data-target-type") as TargetingState["targetType"] || "enemy";

        if (targetType === "enemy")
            startTargeting(cardId, "", effectId, effectBtn.textContent, targetType);
        else
            socket.emit("game.effect.use", `deck:${cardId}`, effectId, "");
    });
}
