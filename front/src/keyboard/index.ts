import { mgl } from "#mgl";
import { onKeyDown } from "./keydown";
import { $keyboard } from "./vars";

function setMacro(name: string, ...args: string[]) {
    $keyboard.macros[name] = args;
    console.log(`[Macro] Set "${name}" to:`, args);
}

mgl.setMacro = setMacro;

export function setupKeyboardEvents() {
    document.addEventListener("keydown", onKeyDown);
}
