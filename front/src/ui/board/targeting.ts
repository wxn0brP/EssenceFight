import { socket } from "#ws";
import { gameState } from "#state";
import { boardsComp } from "#state";

export interface TargetingState {
    active: boolean;
    cardId: string;
    cardPos: string;
    effectId: string;
    effectName: string;
    targetType: "enemy" | "ally" | "self" | "ground" | "choose";
}

let targeting: TargetingState = {
    active: false,
    cardId: "",
    cardPos: "",
    effectId: "",
    effectName: "",
    targetType: "enemy",
};

function updateTargetingUI() {
    const banner = qs("#targeting-banner") as HTMLDivElement;
    const text = qs("#targeting-text") as HTMLSpanElement;

    if (targeting.active) {
        banner.style.display = "flex";
        const targetLabel = targeting.targetType === "enemy" ? "ENEMY" : targeting.targetType === "ally" ? "ALLY" : targeting.targetType.toUpperCase();
        text.textContent = `Select target for: ${targeting.effectName} (${targetLabel})`;

        // Update banner style based on target type
        if (targeting.targetType === "ally") {
            banner.classList.add("ally-targeting");
        } else {
            banner.classList.remove("ally-targeting");
        }

        // Clear all highlights first
        boardsComp.forEach(board => {
            board.element.querySelectorAll(".targeting-active").forEach(card => {
                card.classList.remove("targeting-active", "enemy-target", "ally-target");
            });
        });

        // Highlight valid targets based on targetType
        const targetClass = targeting.targetType === "enemy" ? "enemy-target" : "ally-target";

        if (targeting.targetType === "enemy") {
            const opponentBoardIndex = gameState.myBoardIndex ^ 1;
            const opponentBoard = boardsComp.find(b => b.index === opponentBoardIndex);
            if (opponentBoard) {
                opponentBoard.element.querySelectorAll("article:not(.empty)").forEach(card => {
                    card.classList.add("targeting-active", targetClass);
                });
            }
        } else if (targeting.targetType === "ally") {
            const myBoard = boardsComp.find(b => b.index === gameState.myBoardIndex);
            if (myBoard) {
                myBoard.element.querySelectorAll("article:not(.empty)").forEach(card => {
                    card.classList.add("targeting-active", targetClass);
                });
            }
        }
    } else {
        banner.style.display = "none";
        banner.classList.remove("ally-targeting");

        // Remove highlighting from all boards
        boardsComp.forEach(board => {
            board.element.querySelectorAll(".targeting-active").forEach(card => {
                card.classList.remove("targeting-active", "enemy-target", "ally-target");
            });
        });
    }
}

export function startTargeting(cardId: string, cardPos: string, effectId: string, effectName: string, targetType: TargetingState["targetType"]) {
    targeting = {
        active: true,
        cardId,
        cardPos,
        effectId,
        effectName,
        targetType,
    };
    updateTargetingUI();
}

export function cancelTargeting() {
    targeting = {
        active: false,
        cardId: "",
        cardPos: "",
        effectId: "",
        effectName: "",
        targetType: "enemy",
    };
    updateTargetingUI();
}

export function isTargeting(): boolean {
    return targeting.active;
}

export function getTargetingState(): TargetingState {
    return { ...targeting };
}

export function useEffectOnTarget(targetPos: string) {
    socket.emit("game.effect.use", `deck:${targeting.cardId}`, targeting.effectId, targetPos);
    cancelTargeting();
}

export function setupTargetingEvents() {
    const cancelBtn = qs("#targeting-cancel") as HTMLButtonElement;
    cancelBtn.addEventListener("click", () => {
        cancelTargeting();
    });
}
