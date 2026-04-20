import { allCardMap } from "#cards";
import { gameState } from "#state";
import { UnitCard } from "_types/card/card";
import { CardEffect } from "_types/card/effect";
import { CardPosition } from "_types/state";
import { BoardUi } from "./index";

export function render(this: BoardUi) {
    const boardState = this.getBoardState();

    const previousEp = this.ui.ep.innerHTML;
    const previousDp = this.ui.dp.innerHTML;

    this.ui.ep.innerHTML = boardState.essencePoints.toString();
    this.ui.dp.innerHTML = boardState.deploymentPoints.toString();

    const isAggressor = gameState.data.aggressive === this.index;
    const wasAggressor = this.ui.aggressor.innerHTML === "true";
    this.ui.aggressor.innerHTML = isAggressor ? "true" : "false";

    if (isAggressor && !wasAggressor) this.turnStartAnimation();

    this.ui.name.innerHTML = gameState.data.usersMeta[this.index].name;

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

export function getCardElement(this: BoardUi, pos: CardPosition): HTMLDivElement {
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

export function renderCard(this: BoardUi, div: HTMLDivElement, pos: CardPosition) {
    const boardState = this.getBoardState();
    const splitPos = pos.split("-");
    const cardId = boardState.cards[splitPos[0]][+splitPos[1]];
    const data = allCardMap[cardId] as UnitCard;

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
    ${this.renderEffects(data, cardId, pos)}
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

export function renderEffects(this: BoardUi, data: UnitCard, cardId: string, pos: CardPosition): string {
    const abilityEffects = (data.effects || []).filter(
        (effect: CardEffect.Effect) => effect.trigger === "ability"
    );

    if (abilityEffects.length === 0) return "";

    const buttons = abilityEffects.map((effect: CardEffect.Effect) => {
        const costText = "";
        const title = `${effect.name}${costText}\n${effect.description || ""}`;
        return `<button class="effect-btn" data-card-id="${cardId}" data-card-pos="${pos}" data-effect-id="${effect._id}" title="${title.replace(/"/g, "&quot;")}">${effect.name}${costText}</button>`;
    }).join("");

    return `<div class="card-effects">${buttons}</div>`;
}
