import { PathVirtualElement, setIcon } from "obsidian";

export function changeVirtualElementPin(vEl: PathVirtualElement, pin: boolean): PathVirtualElement {
    if (pin && !vEl.el.hasClass("tree-item-pinned")) {
        vEl.el.addClass("tree-item-pinned");

        const pinDiv = document.createElement("div");
        pinDiv.addClass("file-explorer-plus");
        pinDiv.addClass("pin-icon");
        setIcon(pinDiv, "pin");
        vEl.el.firstChild?.insertBefore(pinDiv, vEl.el.firstChild.firstChild);
    } else if (!pin) {
        vEl.el.removeClass("tree-item-pinned");

        const pinIcons = Array.from((vEl.el.firstChild as HTMLElement).children).filter((el: HTMLElement) => el.hasClass("pin-icon"));
        pinIcons.forEach((icon: HTMLElement) => vEl.el.firstChild?.removeChild(icon));
    }

    return vEl;
}
