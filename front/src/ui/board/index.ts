import { gameState } from "#state";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { BoardState } from "_types/state";
import { animateAttack, turnStartAnimation } from "./animations";
import { events } from "./events";
import { getCardElement, render, renderCard, renderEffects } from "./render";

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

    render = render;
    getCardElement = getCardElement;
    renderCard = renderCard;
    renderEffects = renderEffects;
    animateAttack = animateAttack;
    events = events;
    turnStartAnimation = turnStartAnimation;
}
