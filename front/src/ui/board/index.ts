import { socket, user } from "#ws";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { AnyCard } from "_types/card";
import { BoardState, GameState, Id } from "_types/state";
import { unusedCards } from "./unused";
import { gameState } from "#index";

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

        this.renderCard(this.ui.ground.children[0] as HTMLDivElement, gameState.cards[boardState.cards.ground[0]]);
        this.renderCard(this.ui.ground.children[1] as HTMLDivElement, gameState.cards[boardState.cards.ground[1]]);
        this.renderCard(this.ui.ground.children[2] as HTMLDivElement, gameState.cards[boardState.cards.ground[2]]);
        this.renderCard(this.ui.ground.children[3] as HTMLDivElement, gameState.cards[boardState.cards.ground[3]]);
        this.renderCard(this.ui.ground.children[4] as HTMLDivElement, gameState.cards[boardState.cards.ground[4]]);

        this.renderCard(this.ui.castle.children[0] as HTMLDivElement, gameState.cards[boardState.cards.runes[0]]);
        this.renderCard(this.ui.castle.children[1] as HTMLDivElement, gameState.cards[boardState.cards.castle[0]]);
        this.renderCard(this.ui.castle.children[2] as HTMLDivElement, gameState.cards[boardState.cards.castle[1]]);
        this.renderCard(this.ui.castle.children[3] as HTMLDivElement, gameState.cards[boardState.cards.castle[2]]);
        this.renderCard(this.ui.castle.children[4] as HTMLDivElement, gameState.cards[boardState.cards.runes[1]]);
    }

    renderCard(div: HTMLDivElement, data: AnyCard) {
        if (!data) {
            div.innerHTML = "Empty";
            div.classList.add("empty");
            return;
        }
        div.innerHTML = data.name;
        div.title = JSON.stringify(data, null, 2);
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