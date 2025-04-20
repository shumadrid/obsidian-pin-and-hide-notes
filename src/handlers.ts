import { TFile } from "obsidian";
import FileExplorerPlusPlugin from "./main";

export function addCommandsToFileMenu(plugin: FileExplorerPlusPlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, path) => {
            if (path instanceof TFile) {
                menu.addSeparator()
                    .addItem((item) => {
                        const isPinned = plugin.getFileExplorer()!.fileItems[path.path].info.pinned;
                        if (!isPinned) {
                            item.setTitle("Pin File").setIcon("pin");
                        } else {
                            item.setTitle("Unpin File").setIcon("pin-off");
                        }
                    })
                    .addItem((item) => {
                        const isHidden = plugin.getFileExplorer()!.fileItems[path.path].info.hidden;
                        if (!isHidden) {
                            item.setTitle("Hide File").setIcon("eye-off");
                        } else {
                            item.setTitle("Unhide File").setIcon("eye");
                        }
                    });
            }
        })
    );
}
