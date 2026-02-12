import { gameState } from "#state";
import { socket } from "#ws";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { UnitCard } from "_types/card";
import { BoardState, CardPosition } from "_types/state";
import { unusedCards } from "./unused";

export class BoardUi implements UiComponent {
    ui: {
        ep: HTMLDivElement;
        dp: HTMLDivElement;
        aggressor: HTMLDivElement;
        name: HTMLDivElement;
        ground: HTMLDivElement;
        castle: HTMLDivElement;
    } = {} as any;

    index: number;

    constructor(public element: HTMLDivElement) {
        this.ui.ep = this.element.qs("ep", 1);
        this.ui.dp = this.element.qs("dp", 1);
        this.ui.aggressor = this.element.qs("aggressor", 1);
        this.ui.name = this.element.qs("name", 1);
        this.ui.ground = this.element.qs("ground", 1);
        this.ui.castle = this.element.qs("castle", 1);
    }

    mount(): void { }

    init(index: number) {
        this.index = index;
        this.render();
    }

    getBoardState(): BoardState {
        return gameState.data.boards[this.index];
    }

    render() {
        const boardState = this.getBoardState();

        const previousEp = this.ui.ep.innerHTML;
        const previousDp = this.ui.dp.innerHTML;

        this.ui.ep.innerHTML = boardState.essencePoints.toString();
        this.ui.dp.innerHTML = boardState.deploymentPoints.toString();

        const isAggressor = gameState.data.aggressive === this.index;
        const wasAggressor = this.ui.aggressor.innerHTML === "true";
        this.ui.aggressor.innerHTML = isAggressor ? "true" : "false";

        if (isAggressor && !wasAggressor) this.turnStartAnimation();

        this.ui.name.innerHTML = gameState.data.users[this.index];

        if (previousEp && previousEp !== this.ui.ep.innerHTML) {
            this.ui.ep.classList.add("energy-pulse");
            setTimeout(() => this.ui.ep.classList.remove("energy-pulse"), 1000);
        }

        if (previousDp && previousDp !== this.ui.dp.innerHTML) {
            this.ui.dp.classList.add("energy-pulse");
            setTimeout(() => this.ui.dp.classList.remove("energy-pulse"), 1000);
        }

        for (let i = 0; i < 5; i++) {
            this.renderCard(
                this.ui.ground.children[i] as HTMLDivElement,
                `ground-${i}`
            );
            this.renderCard(
                this.ui.castle.children[i] as HTMLDivElement,
                (i === 0 || i === 4) ? "runes-" + Number(Boolean(i)) : "castle-" + (i - 1)
            );
        }
    }

    getCardElement(pos: CardPosition): HTMLDivElement {
        if (pos.startsWith("ground")) {
            const index = parseInt(pos.split("-")[1]);
            return this.ui.ground.children[index] as HTMLDivElement;
        } else {
            if (pos === "runes-0") return this.ui.castle.children[0] as HTMLDivElement;
            if (pos === "runes-1") return this.ui.castle.children[4] as HTMLDivElement;
            if (pos.startsWith("castle")) {
                const idx = parseInt(pos.split("-")[1]);
                return this.ui.castle.children[idx + 1] as HTMLDivElement;
            }
        }
        return null;
    }

    renderCard(div: HTMLDivElement, pos: CardPosition) {
        const boardState = this.getBoardState();
        const splitPos = pos.split("-");
        const cardId = boardState.cards[splitPos[0]][+splitPos[1]];
        const data = gameState.data.cards[cardId] as UnitCard;

        if (!data) {
            div.innerHTML = "Empty";
            div.classList.add("empty");
            div.classList.remove("card-deal");
            div.removeAttribute("data-card-id");
            return;
        }

        const state = boardState.cards.state[pos];
        div.classList.remove("empty");

        const previousCardId = div.getAttribute("data-card-id");
        const isNewCard = previousCardId !== cardId;
        const previousHp = div.querySelector(".card-hp")?.textContent;
        const currentHp = state.hp.toString();

        div.innerHTML = `
<div class="card-content">
    <div class="card-header">
        <h3 class="card-name">${data.name}</h3>
    </div>
    <div class="card-body">
        <p class="card-class">${data.class.join(", ")}</p>
    </div>
    <div class="card-footer">
        <span class="card-stat">HP: <strong class="card-hp">${state.hp}</strong></span>
    </div>
</div>
`;

        div.setAttribute("data-card-id", cardId);

        if (isNewCard) {
            div.classList.add("card-deal");
            setTimeout(() => {
                div.classList.remove("card-deal");
            }, 600);
        } else if (previousHp && previousHp !== currentHp) {
            const hpElement = div.querySelector(".card-hp");
            if (hpElement) {
                hpElement.classList.add("hp-change");
                setTimeout(() => {
                    hpElement.classList.remove("hp-change");
                }, 400);
            }

            if (state.hp <= 0) {
                div.classList.add("card-destroy");
                setTimeout(() => {
                    div.classList.remove("card-destroy");
                }, 500);
            }
        }

        div.oncontextmenu = (e) => {
            e.preventDefault();
            alert(JSON.stringify(Object.assign({}, { state }, { data }), null, 2));
        }
    }

    animateAttack(attackerCard: HTMLDivElement, defenderCard: HTMLDivElement) {
        const attackerRect = attackerCard.getBoundingClientRect();
        const defenderRect = defenderCard.getBoundingClientRect();

        const deltaX = defenderRect.left - attackerRect.left;
        const deltaY = defenderRect.top - attackerRect.top;

        attackerCard.style.setProperty("--attack-x", `${deltaX / 4}px`);
        attackerCard.style.setProperty("--attack-y", `${deltaY / 4}px`);

        attackerCard.classList.add("attacking", "card-attack");

        setTimeout(() => {
            defenderCard.classList.add("card-damage");

            setTimeout(() => {
                defenderCard.classList.remove("card-damage");
            }, 500);
        }, 400);

        setTimeout(() => {
            attackerCard.classList.remove("attacking", "card-attack");
        }, 800);
    }

    events() {
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
            if (this.index !== gameState.data.aggressive)
                return console.error("Not your turn");

            const target = e.target as HTMLDivElement;
            const card = target.closest("article") as HTMLDivElement;
            if (!card) return;

            if (activeUnusedCard) {
                if (!card.classList.contains("empty"))
                    return console.error("Card not empty");

                const cardId = activeUnusedCard.getAttribute("data-card-id");
                const cardPosition = card.getAttribute("data-id");

                activeUnusedCard.classList.remove("active");
                activeUnusedCard = null;
                this.element.classList.remove("active");
                socket.emit("game.card.put", cardId, cardPosition);
                return;
            }

            if (!card.classList.contains("empty")) {
                if (selectedAttack === card) {
                    card.classList.remove("selected");
                    selectedAttack = null;
                    this.element.classList.remove("active");
                    return;
                }

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

            if (selectedAttack) {
                if (this.index !== gameState.data.aggressive)
                    return console.error("Not your turn");

                const aggressiveCardPos = selectedAttack.getAttribute("data-id");
                const defensiveCardPos = card.getAttribute("data-id");

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
    }

    turnStartAnimation() {
        const el = this.element.qs(".rows");
        el.clA("turn-start");
        setTimeout(() => el.clR("turn-start"), 1000);
    }
}
