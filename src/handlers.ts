import { TFile } from "obsidian";
import PinAndHideNotesPlugin, { BUILT_IN_TAGS } from "./main";

async function toggleTag(file: TFile, tag: string, add: boolean, plugin: PinAndHideNotesPlugin) {
    const cleanTag = tag.replace("#", "").toLowerCase();

    await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
        // Ensure frontmatter and tags array exists
        if (!frontmatter) frontmatter = {};
        if (!frontmatter.tags) frontmatter.tags = [];

        // Convert to array if it's not already
        if (!Array.isArray(frontmatter.tags)) {
            frontmatter.tags = [frontmatter.tags].filter((t) => t);
        }

        // Case-insensitive tag handling
        const existingTags = frontmatter.tags.map((t: string) => t.toLowerCase());

        if (add && !existingTags.includes(cleanTag)) {
            frontmatter.tags.push(cleanTag);
        } else if (!add) {
            frontmatter.tags = frontmatter.tags.filter((t: string) => t.toLowerCase() !== cleanTag);
        }
    });
}

export function addCommandsToFileMenu(plugin: PinAndHideNotesPlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, path) => {
            if (path instanceof TFile) {
                menu.addSeparator()
                    .addItem((item) => {
                        const isPinned = plugin.getFileExplorer()!.fileItems[path.path].info.pinned;
                        if (!isPinned) {
                            item.setTitle("PHN: Pin File")
                                .setIcon("pin")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.PINNED, true, plugin);
                                });
                        } else {
                            item.setTitle("PHN: Unpin File")
                                .setIcon("pin-off")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.PINNED, false, plugin);
                                });
                        }
                    })
                    .addItem((item) => {
                        const isHidden = plugin.getFileExplorer()!.fileItems[path.path].info.hidden;
                        if (!isHidden) {
                            item.setTitle("PHN: Hide File")
                                .setIcon("eye-off")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.HIDDEN, true, plugin);
                                });
                        } else {
                            item.setTitle("PHN: Unhide File")
                                .setIcon("eye")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.HIDDEN, false, plugin);
                                });
                        }
                    });
            }
        })
    );
}
