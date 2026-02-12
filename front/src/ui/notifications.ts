export const notificationOverlay = qs("#game-notification");
export const notificationTitle = qs("#notification-title");
export const notificationMessage = qs("#notification-message");
export const notificationClose = qs("#notification-close");
export const turnBanner = qs("#turn-banner");

let onCloseCallback: (() => void) | null = null;

export function showNotification(title: string, message: string, type: "victory" | "defeat" | "info" = "info", onClose?: () => void) {
    if (!notificationOverlay || !notificationTitle || !notificationMessage) return;

    onCloseCallback = onClose || null;

    notificationTitle.innerText = title;
    notificationMessage.innerText = message;

    notificationTitle.className = ""; // Reset classes
    if (type !== "info") {
        notificationTitle.classList.add(type);
    }

    notificationOverlay.classList.remove("hidden");
    notificationOverlay.style.display = "flex";

    // Trigger reflow
    void notificationOverlay.offsetWidth;

    notificationOverlay.classList.add("visible");
}

export function hideNotification() {
    if (!notificationOverlay) return;

    notificationOverlay.classList.remove("visible");
    setTimeout(() => {
        notificationOverlay.style.display = "none";
        if (onCloseCallback) {
            onCloseCallback();
            onCloseCallback = null;
        }
    }, 500);
}

export function showTurnBanner(text: string) {
    if (!turnBanner) return;

    turnBanner.innerText = text;
    turnBanner.classList.remove("turn-banner-show");

    // Trigger reflow
    void turnBanner.offsetWidth;

    turnBanner.classList.add("turn-banner-show");
}

notificationClose.addEventListener("click", hideNotification);
