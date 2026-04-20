import { BoardUi } from "./index";

export function animateAttack(this: BoardUi, attackerCard: HTMLDivElement, defenderCard: HTMLDivElement) {
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

export function turnStartAnimation(this: BoardUi) {
    const el = this.element.qs(".rows");
    el.clA("turn-start");
    setTimeout(() => el.clR("turn-start"), 1000);
}