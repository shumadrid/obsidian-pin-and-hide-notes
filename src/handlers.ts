import { TFile } from "obsidian";
import FileExplorerPlusPlugin from "./main";

export function addCommandsToFileMenu(plugin: FileExplorerPlusPlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, path) => {
            if (path instanceof TFile) {
                menu.addSeparator()
                    .addItem((item) => {
                        const isPinned = plugin.getFileExplorer()!.fileItems[path.path].info.pinned;
                        const pinnedProp = plugin.settings.frontmatterProps.pinned;

                        if (!isPinned) {
                            item.setTitle("Pin File")
                                .setIcon("pin")
                                .onClick(() => {
                                    plugin.app.fileManager.processFrontMatter(path, (frontmatter) => {
                                        if (!frontmatter) frontmatter = {};
                                        frontmatter[pinnedProp] = true;
                                    });
                                });
                        } else {
                            item.setTitle("Unpin File")
                                .setIcon("pin-off")
                                .onClick(() => {
                                    plugin.app.fileManager.processFrontMatter(path, (frontmatter) => {
                                        if (frontmatter) {
                                            delete frontmatter[pinnedProp];
                                        }
                                    });
                                });
                        }
                    })
                    .addItem((item) => {
                        const isHidden = plugin.getFileExplorer()!.fileItems[path.path].info.hidden;
                        const hiddenProp = plugin.settings.frontmatterProps.hidden;

                        if (!isHidden) {
                            item.setTitle("Hide File")
                                .setIcon("eye-off")
                                .onClick(() => {
                                    plugin.app.fileManager.processFrontMatter(path, (frontmatter) => {
                                        if (!frontmatter) frontmatter = {};
                                        frontmatter[hiddenProp] = true;
                                    });
                                });
                        } else {
                            item.setTitle("Unhide File")
                                .setIcon("eye")
                                .onClick(() => {
                                    plugin.app.fileManager.processFrontMatter(path, (frontmatter) => {
                                        if (frontmatter) {
                                            delete frontmatter[hiddenProp];
                                        }
                                    });
                                });
                        }
                    });
            }
        })
    );
}
