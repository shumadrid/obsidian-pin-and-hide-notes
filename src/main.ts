import { around } from "monkey-around";
import { FileExplorerView, PathVirtualElement, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { addCommandsToFileMenu } from "./handlers";
import FileExplorerPlusSettingTab, { FileExplorerPlusPluginSettings, TagFilter, UNSEEN_FILES_DEFAULT_SETTINGS } from "./settings";
import { changeVirtualElementPin } from "./utils";

export default class FileExplorerPlusPlugin extends Plugin {
    settings: FileExplorerPlusPluginSettings;

    private checkTagFilter(filter: TagFilter, path: TAbstractFile): boolean {
        if (!filter.active || !(path instanceof TFile)) {
            return false;
        }

        const cache = this.app.metadataCache.getFileCache(path);
        if (!cache || !cache.tags) {
            return false;
        }

        return cache.tags.some((tag) => tag.tag === filter.pattern);
    }

    async onload() {
        await this.loadSettings();
        addCommandsToFileMenu(this);
        this.addSettingTab(new FileExplorerPlusSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.patchFileExplorer();
            this.getFileExplorer()?.requestSort();
        });

        this.app.workspace.on("layout-change", () => {
            if (!this.getFileExplorer()?.fileExplorerPlusPatched) {
                this.patchFileExplorer();
                this.getFileExplorer()?.requestSort();
            }
        });

        // React to frontmatter changes
        this.registerEvent(
            this.app.metadataCache.on("changed", (file) => {
                this.getFileExplorer()?.requestSort();
            })
        );
    }

    getFileExplorerContainer(): WorkspaceLeaf | undefined {
        return this.app.workspace.getLeavesOfType("file-explorer")?.first();
    }

    getFileExplorer(): FileExplorerView | undefined {
        const fileExplorerContainer = this.getFileExplorerContainer();
        return fileExplorerContainer?.view as FileExplorerView;
    }

    patchFileExplorer() {
        const fileExplorer = this.getFileExplorer();

        if (!fileExplorer) {
            throw Error("Could not find file explorer");
        }

        const plugin = this;
        const leaf = this.app.workspace.getLeaf(true);

        this.register(
            around(Object.getPrototypeOf(fileExplorer), {
                getSortedFolderItems(old: any) {
                    return function (...args: any[]) {
                        let sortedChildren: PathVirtualElement[] = old.call(this, ...args);
                        let paths = sortedChildren.map((el) => el.file);

                        // Handle hiding files
                        const pathsToHide = plugin.getPathsToHide(paths);
                        const pathsToHideLookUp = pathsToHide.reduce((acc, path) => {
                            acc[path.path] = true;
                            return acc;
                        }, {} as { [key: string]: boolean });

                        sortedChildren = sortedChildren.filter((vEl) => {
                            if (pathsToHideLookUp[vEl.file.path]) {
                                vEl.info.hidden = true;
                                return false;
                            } else {
                                vEl.info.hidden = false;
                                return true;
                            }
                        });

                        // Handle pinning files
                        paths = sortedChildren.map((el) => el.file);
                        const pathsToPin = plugin.getPathsToPin(paths);
                        const pathsToPinLookUp = pathsToPin.reduce((acc, path) => {
                            acc[path.path] = true;
                            return acc;
                        }, {} as { [key: string]: boolean });

                        const pinnedVirtualElements = sortedChildren.filter((vEl) => {
                            if (pathsToPinLookUp[vEl.file.path]) {
                                vEl = changeVirtualElementPin(vEl, true);
                                vEl.info.pinned = true;
                                return true;
                            } else {
                                vEl = changeVirtualElementPin(vEl, false);
                                vEl.info.pinned = false;
                                return false;
                            }
                        });

                        const notPinnedVirtualElements = sortedChildren.filter((vEl) => {
                            return !pathsToPinLookUp[vEl.file.path];
                        });

                        sortedChildren = pinnedVirtualElements.concat(notPinnedVirtualElements);
                        return sortedChildren;
                    };
                },
            })
        );

        leaf.detach();
        fileExplorer.fileExplorerPlusPatched = true;
    }

    onunload() {
        const fileExplorer = this.getFileExplorer();
        if (!fileExplorer) {
            return;
        }

        for (const path in fileExplorer!.fileItems) {
            fileExplorer!.fileItems[path] = changeVirtualElementPin(fileExplorer!.fileItems[path], false);
        }

        fileExplorer.requestSort();
        fileExplorer.fileExplorerPlusPatched = false;
    }

    async loadSettings() {
        this.settings = Object.assign({}, UNSEEN_FILES_DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    getPathsToPin(paths: (TAbstractFile | null)[]): TAbstractFile[] {
        return paths.filter((path) => {
            if (!path || !(path instanceof TFile)) {
                return false;
            }

            const cache = this.app.metadataCache.getFileCache(path);
            if (!cache) {
                return false;
            }

            // Check frontmatter property
            const pinnedProp = this.settings.frontmatterProps.pinned;
            if (cache.frontmatter && cache.frontmatter[pinnedProp] === true) {
                return true;
            }

            // Check tags
            if (this.settings.pinFilters.active) {
                const tagFilterActivated = this.settings.pinFilters.tags.some((filter) => this.checkTagFilter(filter, path));
                if (tagFilterActivated) {
                    return true;
                }
            }

            return false;
        }) as TAbstractFile[];
    }

    getPathsToHide(paths: (TAbstractFile | null)[]): TAbstractFile[] {
        return paths.filter((path) => {
            if (!path || !(path instanceof TFile)) {
                return false;
            }

            const cache = this.app.metadataCache.getFileCache(path);
            if (!cache) {
                return false;
            }

            // Check frontmatter property
            const hiddenProp = this.settings.frontmatterProps.hidden;
            if (cache.frontmatter && cache.frontmatter[hiddenProp] === true) {
                return true;
            }

            // Check tags
            if (this.settings.hideFilters.active) {
                const tagFilterActivated = this.settings.hideFilters.tags.some((filter) => this.checkTagFilter(filter, path));
                if (tagFilterActivated) {
                    return true;
                }
            }

            return false;
        }) as TAbstractFile[];
    }
}
