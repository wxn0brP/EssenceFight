import { mgl } from "#mgl";
import { socket } from "#ws";

class Bot {
    running = false;

    executeMove(move: any): void {
        switch (move.type) {
            case "deploy":
                socket.emit("game.card.put", move.who, move.to);
                break;
            case "attack":
                socket.emit("game.attack.base", move.who, move.to);
                break;
            case "effect":
                socket.emit("game.effect.use", move.who, move.effectId, move.targets?.[0] ?? "");
                break;
            case "end_turn":
                socket.emit("game.turn.end");
                break;
            case "next_phase":
                socket.emit("game.phase.next");
                break;
        }
    }

    async run(one = false) {
        if (this.running) return;
        this.running = true;
        const end = () => this.running = false;

        while (this.running) {
            const moves: any[] = await new Promise(resolve => socket.emit("game.moves", data => resolve(data)));

            if (!moves.length) return end();

            const firstMove = moves[0];
            console.log("Executing move:", firstMove);
            this.executeMove(firstMove);

            if (one) return end();
            if (firstMove.type === "end_turn") return end();

            await new Promise(r => setTimeout(r, 1_000));
        }
    }

    stop() {
        this.running = false;
    }
}

export const bot = new Bot();
mgl.bot = bot;
