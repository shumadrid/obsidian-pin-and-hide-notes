import { TFile, TFile } from "obsidian";
import FileExplorerPlusPlugin, { BUILT_IN_TAGS } from "./main";

async function toggleTag(file: TFile, tag: string, add: boolean) {
    const content = await file.vault.read(file);
    let newContent: string;

    // Remove '#' from tag for frontmatter
    const cleanTag = tag.replace("#", "");

    if (add) {
        if (!content.includes("---\n")) {
            // No frontmatter - add new frontmatter with tag
            newContent = `---\ntags: [${cleanTag}]\n---\n${content}`;
        } else {
            const [frontmatter, ...rest] = content.split("---\n").filter((p) => p.length > 0);
            const content = rest.join("---\n");

            if (!frontmatter.includes("tags:")) {
                // No tags field - add it
                newContent = `---\n${frontmatter.trim()}\ntags: [${cleanTag}]\n---\n${content}`;
            } else {
                // Has tags - append to existing
                const tagMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
                if (tagMatch) {
                    const currentTags = tagMatch[1]
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0);
                    if (!currentTags.includes(cleanTag)) {
                        currentTags.push(cleanTag);
                    }
                    const newFrontmatter = frontmatter.replace(/tags:\s*\[(.*?)\]/, `tags: [${currentTags.join(", ")}]`);
                    newContent = `---\n${newFrontmatter}\n---\n${content}`;
                } else {
                    // Malformed tags - overwrite
                    newContent = `---\n${frontmatter.trim()}\ntags: [${cleanTag}]\n---\n${content}`;
                }
            }
        }
    } else {
        if (!content.includes("---\n")) {
            return; // No frontmatter, nothing to remove
        }

        const [frontmatter, ...rest] = content.split("---\n").filter((p) => p.length > 0);
        const content = rest.join("---\n");

        const tagMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
        if (tagMatch) {
            const currentTags = tagMatch[1]
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0 && t !== cleanTag);
            const newFrontmatter = frontmatter.replace(/tags:\s*\[(.*?)\]/, `tags: [${currentTags.join(", ")}]`);
            newContent = `---\n${newFrontmatter}\n---\n${content}`;
        } else {
            return; // No tags field, nothing to remove
        }
    }

    await file.vault.modify(file, newContent);
}

export function addCommandsToFileMenu(plugin: FileExplorerPlusPlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, path) => {
            if (path instanceof TFile) {
                menu.addSeparator()
                    .addItem((item) => {
                        const isPinned = plugin.getFileExplorer()!.fileItems[path.path].info.pinned;
                        if (!isPinned) {
                            item.setTitle("Pin File")
                                .setIcon("pin")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.PINNED, true);
                                });
                        } else {
                            item.setTitle("Unpin File")
                                .setIcon("pin-off")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.PINNED, false);
                                });
                        }
                    })
                    .addItem((item) => {
                        const isHidden = plugin.getFileExplorer()!.fileItems[path.path].info.hidden;
                        if (!isHidden) {
                            item.setTitle("Hide File")
                                .setIcon("eye-off")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.HIDDEN, true);
                                });
                        } else {
                            item.setTitle("Unhide File")
                                .setIcon("eye")
                                .onClick(() => {
                                    toggleTag(path, BUILT_IN_TAGS.HIDDEN, false);
                                });
                        }
                    });
            }
        })
    );
}
