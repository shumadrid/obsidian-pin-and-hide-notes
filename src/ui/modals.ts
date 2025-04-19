import { Modal, TFile } from "obsidian";
import FileExplorerPlusPlugin from "src/main";

export class PathsActivatedModal extends Modal {
    constructor(private plugin: FileExplorerPlusPlugin, private actionType: "PIN" | "HIDE") {
        super(plugin.app);
    }

    onOpen() {
        const { contentEl } = this;
        const files = this.app.vault.getAllLoadedFiles();

        const pathsActivated = this.actionType === "HIDE" ? this.plugin.getPathsToHide(files) : this.plugin.getPathsToPin(files);

        contentEl.addClasses(["file-explorer-plus", "filters-activated-modal"]);

        const data: (string | HTMLElement)[][] = [["Path", "Type"]];

        for (const path of pathsActivated) {
            if (path instanceof TFile) {
                const row: (string | HTMLElement)[] = [];
                const link = contentEl.createEl("a");
                link.onClickEvent(() => {
                    this.app.workspace.getLeaf("tab").openFile(path);
                });
                link.textContent = path.path;
                row.push(link);
                row.push("File");
                data.push(row);
            }
        }

        const table = generateTable(data);
        contentEl.appendChild(table);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export function generateTable(data: (string | HTMLElement)[][]): HTMLElement {
    const table = document.createElement("table", {});
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    table.appendChild(thead);
    table.appendChild(tbody);

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const tableRow = document.createElement("tr");

        if (i === 0) {
            thead.appendChild(tableRow);
        } else {
            tbody.appendChild(tableRow);
        }

        for (let j = 0; j < row.length; j++) {
            let cell;
            if (i === 0) {
                cell = document.createElement("th");
                cell.textContent = data[i][j] as string;
            } else {
                cell = document.createElement("td");
                if (typeof data[i][j] === "string") {
                    cell.textContent = data[i][j] as string;
                } else {
                    cell.appendChild(data[i][j] as HTMLElement);
                }
            }
            tableRow.appendChild(cell);
        }
    }

    return table;
}
