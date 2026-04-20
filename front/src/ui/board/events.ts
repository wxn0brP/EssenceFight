import { allCardMap } from "#cards";
import { gameState } from "#state";
import { socket } from "#ws";
import { BoardUi } from "./index";
import { getTargetingState, isTargeting, useEffectOnTarget } from "./targeting";
import { unusedCards } from "./unused";

export function events(this: BoardUi) {
    let activeUnusedCard: HTMLDivElement;
    let selectedAttack: HTMLDivElement;

    unusedCards.addEventListener("click", (e) => {
        if (this.index !== gameState.data.aggressive) return console.error("Not your turn");

        const target = e.target as HTMLDivElement;
        const card = target.closest("article") as HTMLDivElement;
        if (!card) return;

        if (this.getBoardState().deploymentPoints <= 0) return console.error("No deployment points");

        if (activeUnusedCard === card) {
            card.classList.remove("active");
            this.element.classList.remove("active");
            activeUnusedCard = null;
            return;
        }

        unusedCards.querySelectorAll(".active").forEach(card => card.classList.remove("active"));
        card.classList.add("active");
        activeUnusedCard = card;
        this.element.classList.add("active");
    });

    this.element.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;

        const effectBtn = target.closest(".effect-btn") as HTMLButtonElement;
        if (effectBtn) {
            e.stopPropagation();
            if (this.index !== gameState.data.aggressive) return console.error("Not your turn");

            const cardId = effectBtn.getAttribute("data-card-id");
            const cardPos = effectBtn.getAttribute("data-card-pos");
            const effectId = effectBtn.getAttribute("data-effect-id");

            socket.emit("game.effect.use", `board:${cardPos}`, effectId, "");
            return;
        }

        if (this.index !== gameState.data.aggressive)
            return console.error("Not your turn");

        const card = target.closest("article") as HTMLDivElement;
        if (!card) return;

        if (activeUnusedCard) {
            if (!card.classList.contains("empty"))
                return console.error("Card not empty");

            const cardId = activeUnusedCard.getAttribute("data-card-id");
            const cardPosition = card.getAttribute("data-id");

            const cardData = allCardMap[cardId];
            const isRunesSlot = cardPosition.startsWith("runes-");

            if (isRunesSlot && cardData?.type !== "rune")
                return console.error("Only rune cards can be placed on runes slots");

            if (!isRunesSlot && cardData?.type !== "unit")
                return console.error("Only unit cards can be placed on non-runes slots");

            activeUnusedCard.classList.remove("active");
            activeUnusedCard = null;
            this.element.classList.remove("active");
            socket.emit("game.card.put", cardId, cardPosition);
            return;
        }

        if (!card.classList.contains("empty")) {
            const cardPos = card.getAttribute("data-id");

            if (cardPos?.startsWith("runes-"))
                return console.error("Runes cannot attack");

            if (selectedAttack === card) {
                card.classList.remove("selected");
                selectedAttack = null;
                this.element.classList.remove("active");
                return;
            }

            if (!gameState.data.phase)
                return console.error("Not in attack phase");

            this.element.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedAttack = card;
            this.element.classList.add("active");
            return;
        }
    });

    qs("#board_opponent").addEventListener("click", (e) => {
        const target = e.target as HTMLDivElement;
        const card = target.closest("article") as HTMLDivElement;
        if (!card) return;

        if (isTargeting()) {
            const targetingState = getTargetingState();
            if (targetingState.targetType === "enemy" && !card.classList.contains("empty")) {
                const targetPos = card.getAttribute("data-id");
                useEffectOnTarget(targetPos);
                return;
            }
        }

        if (selectedAttack) {
            if (this.index !== gameState.data.aggressive)
                return console.error("Not your turn");

            const aggressiveCardPos = selectedAttack.getAttribute("data-id");
            const defensiveCardPos = card.getAttribute("data-id");

            if (defensiveCardPos?.startsWith("runes-"))
                return console.error("Runes cannot be attacked");

            const defensiveBoard = gameState.data.boards[1 - this.index];
            if (defensiveCardPos === "castle-1" && (defensiveBoard.cards.castle[0] || defensiveBoard.cards.castle[2]))
                return console.error("Cannot attack leader while guard is present");

            this.animateAttack(selectedAttack, card);

            selectedAttack.classList.remove("selected");
            selectedAttack = null;
            this.element.classList.remove("active");

            setTimeout(() => {
                socket.emit("game.attack.base", aggressiveCardPos, defensiveCardPos);
            }, 400);
            return;
        }
    });

    this.element.addEventListener("click", (e) => {
        if (!isTargeting()) return;

        const targetingState = getTargetingState();
        if (targetingState.targetType !== "ally") return;

        const target = e.target as HTMLDivElement;
        const card = target.closest("article") as HTMLDivElement;
        if (!card || card.classList.contains("empty")) return;

        e.stopPropagation();
        const targetPos = card.getAttribute("data-id");
        useEffectOnTarget(targetPos);
    });
}
