import { around } from "monkey-around";
import { FileExplorerView, parseFrontMatterTags, PathVirtualElement, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { addCommandsToFileMenu } from "./handlers";
import PinAndHideNotesSettingTab, {
    FrontmatterFilter,
    PinAndHideNotesPluginSettings,
    TagFilterGroup,
    UNSEEN_FILES_DEFAULT_SETTINGS,
} from "./settings";
import { changeVirtualElementPin } from "./utils";

export const BUILT_IN_TAGS = {
    PINNED: "#pinned",
    HIDDEN: "#hidden",
};

export default class PinAndHideNotesPlugin extends Plugin {
    settings: PinAndHideNotesPluginSettings;

    private checkTagFilters(tagGroup: TagFilterGroup, path: TAbstractFile): boolean {
        if (!(path instanceof TFile)) {
            return false;
        }

        const cache = this.app.metadataCache.getFileCache(path);
        if (!cache || !cache.frontmatter) {
            return false;
        }

        const fileTags = parseFrontMatterTags(cache.frontmatter) || [];

        // Check built-in tags first
        if (tagGroup === this.settings.pinFilters.tags && fileTags.includes(BUILT_IN_TAGS.PINNED)) {
            return true;
        }
        if (tagGroup === this.settings.hideFilters.tags && fileTags.includes(BUILT_IN_TAGS.HIDDEN)) {
            return true;
        }

        const activeFilters = tagGroup.tags.filter((f) => f.active);
        if (activeFilters.length === 0) {
            return false;
        }

        // No need to add '#' prefix as parseFrontMatterTags already includes it
        const filterTags = activeFilters.map((filter) => filter.pattern);

        if (tagGroup.requireAll) {
            return filterTags.every((tag) => fileTags.some((fileTag) => fileTag.toLowerCase() === tag.toLowerCase()));
        } else {
            return filterTags.some((tag) => fileTags.some((fileTag) => fileTag.toLowerCase() === tag.toLowerCase()));
        }
    }

    private checkFrontmatterFilter(filter: FrontmatterFilter, path: TAbstractFile): boolean {
        if (!filter.active || !(path instanceof TFile)) {
            return false;
        }

        const cache = this.app.metadataCache.getFileCache(path);
        if (!cache || !cache.frontmatter || !cache.frontmatter[filter.property]) {
            return false;
        }

        const value = cache.frontmatter[filter.property];
        return filter.values.includes(String(value));
    }

    async onload() {
        await this.loadSettings();
        addCommandsToFileMenu(this);
        this.addSettingTab(new PinAndHideNotesSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.patchFileExplorer();
            this.getFileExplorer()?.requestSort();
        });

        this.app.workspace.on("layout-change", () => {
            if (!this.getFileExplorer()?.pinAndHideNotesPluginPatched) {
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
        fileExplorer.pinAndHideNotesPluginPatched = true;
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
        fileExplorer.pinAndHideNotesPluginPatched = false;
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

            if (!this.settings.pinFilters.active) {
                return false;
            }

            // Check tags
            const tagFilterActivated = this.checkTagFilters(this.settings.pinFilters.tags, path);
            if (tagFilterActivated) {
                return true;
            }

            // Check frontmatter filters
            const frontmatterFilterActivated = this.settings.pinFilters.frontmatter.some((filter) =>
                this.checkFrontmatterFilter(filter, path)
            );
            if (frontmatterFilterActivated) {
                return true;
            }

            return false;
        }) as TAbstractFile[];
    }

    getPathsToHide(paths: (TAbstractFile | null)[]): TAbstractFile[] {
        if (!this.settings.hideFilters.active) {
            return [];
        }

        const matchingPaths = paths.filter((path) => {
            if (!path || !(path instanceof TFile)) {
                return false;
            }

            // Check tags
            const tagFilterActivated = this.checkTagFilters(this.settings.hideFilters.tags, path);
            if (tagFilterActivated) {
                return true;
            }

            // Check frontmatter filters
            const frontmatterFilterActivated = this.settings.hideFilters.frontmatter.some((filter) =>
                this.checkFrontmatterFilter(filter, path)
            );
            if (frontmatterFilterActivated) {
                return true;
            }

            return false;
        }) as TAbstractFile[];

        if (this.settings.hideFilters.inverse) {
            return paths.filter((path) => path instanceof TFile && !matchingPaths.includes(path)) as TAbstractFile[];
        }

        return matchingPaths;
    }
}
