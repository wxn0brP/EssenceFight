import { exec } from "./exec";
import { clearBuf, feedback, showBuf } from "./utils";
import { $keyboard } from "./vars";

export function onKeyDown(e: KeyboardEvent) {
    if (document.activeElement?.tagName === "INPUT") return;
    if (document.activeElement?.tagName === "TEXTAREA") return;
    const { history, helpDiv } = $keyboard;

    if ($keyboard.helpVisible) {
        if (e.key === "Escape" || e.key === "h") {
            e.preventDefault();
            helpDiv.fadeOut();
            $keyboard.helpVisible = false;
            return;
        }
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length > 0) {
            if ($keyboard.historyIndex === -1) {
                $keyboard.historyIndex = history.length - 1;
            } else if ($keyboard.historyIndex > 0) {
                $keyboard.historyIndex--;
            }
            $keyboard.buffer = history[$keyboard.historyIndex];
            showBuf();
        }
        return;
    }

    if (e.key === "ArrowDown") {
        e.preventDefault();
        if ($keyboard.historyIndex !== -1) {
            if ($keyboard.historyIndex < history.length - 1) {
                $keyboard.historyIndex++;
                $keyboard.buffer = history[$keyboard.historyIndex];
            } else {
                $keyboard.historyIndex = -1;
                $keyboard.buffer = "";
            }
            showBuf();
        }
        return;
    }

    if (e.key === "Escape") {
        clearBuf();
        feedback("Cleared");
        return;
    }

    if (e.key === "h") {
        if (!$keyboard.buffer) {
            $keyboard.helpVisible = true;
            helpDiv.fadeIn();
        }
        return;
    }

    if (e.key === "Enter" || e.key === " ") {
        if ($keyboard.buffer) {
            history.push($keyboard.buffer);
            $keyboard.historyIndex = -1;
            exec();
        }
        return;
    }

    if (e.key === "Backspace") {
        $keyboard.buffer = $keyboard.buffer.slice(0, -1);
        showBuf();
        return;
    }

    const ch = e.key.toLowerCase();
    if (/^[a-z0-9]$/.test(ch) || ch === ".") {
        $keyboard.buffer += ch;
        showBuf();
    }
}
