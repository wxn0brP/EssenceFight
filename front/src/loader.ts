export namespace loader {
    const div = qs("#loader");
    let i = 0;

    export function increment() {
        div.style.display = "";
        i++;
    }

    export function decrement() {
        i--;
        if (i <= 0) {
            div.style.display = "none";
            i = 0;
        }
    }
}