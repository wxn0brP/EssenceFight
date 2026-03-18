import "./buttons";
import "./cards";

const pages = document.querySelectorAll<HTMLDivElement>("#view-main > div");
const switches = document.querySelectorAll<HTMLButtonElement>("aside button");

export type Pages = "main" | "play" | "cards" | "card-summon" | "shop";

export function switchPage(page: Pages) {
    pages.forEach(page => page.style.display = "none");
    switches.forEach(button => button.classList.remove("active"));
    qs("#page-" + page).style.display = "";
    qs(page, 1).classList.add("active");
}

switches.forEach(button => {
    button.addEventListener("click", () => {
        switchPage(button.dataset.id as Pages);
    });
});
