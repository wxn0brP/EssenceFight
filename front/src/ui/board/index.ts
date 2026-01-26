import { gameState } from "#index";
import { socket } from "#ws";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { BoardState, CardPosition } from "_types/state";
import { unusedCards } from "./unused";
import { UnitCard } from "_types/card";

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
        return gameState.boards[this.index];
    }

    render() {
        const boardState = this.getBoardState();

        this.ui.ep.innerHTML = boardState.essencePoints.toString();
        this.ui.dp.innerHTML = boardState.deploymentPoints.toString();
        this.ui.aggressor.innerHTML = gameState.aggressive === this.index ? "true" : "false";
        this.ui.name.innerHTML = gameState.users[this.index];

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

    renderCard(div: HTMLDivElement, pos: CardPosition) {
        const boardState = this.getBoardState();
        const splitPos = pos.split("-");
        const data = gameState.cards[boardState.cards[splitPos[0]][+splitPos[1]]] as UnitCard;

        if (!data) {
            div.innerHTML = "Empty";
            div.classList.add("empty");
            return;
        }

        const state = boardState.cards.state[pos];

        div.innerHTML = `
<p>${data.name}</p>
<p>${data.class.join(", ")}</p>
<p>${state.hp}</p>
`;

        div.oncontextmenu = (e) => {
            e.preventDefault();
            alert(JSON.stringify(Object.assign({}, { state }, { data }), null, 2));
        }
    }

    events() {
        let activeUnusedCard: HTMLDivElement;

        unusedCards.addEventListener("click", (e) => {
            if (this.index !== gameState.aggressive) return console.error("Not your turn");

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
            if (this.index !== gameState.aggressive)
                return console.error("Not your turn");

            const target = e.target as HTMLDivElement;
            const card = target.closest("article") as HTMLDivElement;
            if (!card) return;

            if (activeUnusedCard) {
                if (!card.classList.contains("empty"))
                    return console.error("Card not empty");

                const cardId = activeUnusedCard.getAttribute("data-card-id");
                const cardPosition = card.getAttribute("data-id");

                activeUnusedCard = null;
                socket.emit("game.card.put", cardId, cardPosition);
            }
        });
    }
}