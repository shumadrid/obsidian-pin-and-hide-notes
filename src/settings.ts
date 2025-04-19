import { App, PluginSettingTab, Setting } from "obsidian";
import FileExplorerPlusPlugin from "./main";

export interface TagFilter {
    pattern: string;
    active: boolean;
}

export interface FileExplorerPlusPluginSettings {
    frontmatterProps: {
        pinned: string;
        hidden: string;
    };
    pinFilters: {
        active: boolean;
        tags: TagFilter[];
    };
    hideFilters: {
        active: boolean;
        tags: TagFilter[];
    };
}

export const UNSEEN_FILES_DEFAULT_SETTINGS: FileExplorerPlusPluginSettings = {
    frontmatterProps: {
        pinned: "pinned",
        hidden: "hidden",
    },
    pinFilters: {
        active: true,
        tags: [],
    },
    hideFilters: {
        active: true,
        tags: [],
    },
};

export default class FileExplorerPlusSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: FileExplorerPlusPlugin) {
        super(app, plugin);
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.addClass("file-explorer-plus");

        // Frontmatter property settings
        this.containerEl.createEl("h2", { text: "Frontmatter Properties", attr: { class: "settings-header" } });

        new Setting(this.containerEl)
            .setName("Pinned frontmatter property")
            .setDesc("The frontmatter property name to use for pinned files")
            .addText((text) => {
                text.setValue(this.plugin.settings.frontmatterProps.pinned).onChange(async (value) => {
                    this.plugin.settings.frontmatterProps.pinned = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                });
            });

        new Setting(this.containerEl)
            .setName("Hidden frontmatter property")
            .setDesc("The frontmatter property name to use for hidden files")
            .addText((text) => {
                text.setValue(this.plugin.settings.frontmatterProps.hidden).onChange(async (value) => {
                    this.plugin.settings.frontmatterProps.hidden = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                });
            });

        // Tag filter settings
        this.containerEl.createEl("h2", { text: "Tag Filters", attr: { class: "settings-header" } });

        new Setting(this.containerEl)
            .setName("Enable pin tag filters")
            .setDesc("Enable automatic pinning of files with specific tags.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.pinFilters.active).onChange(async (value) => {
                    this.plugin.settings.pinFilters.active = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                });
            });

        new Setting(this.containerEl)
            .setName("Enable hide tag filters")
            .setDesc("Enable automatic hiding of files with specific tags.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.hideFilters.active).onChange(async (value) => {
                    this.plugin.settings.hideFilters.active = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                });
            });

        this.addTagFilterSection("Pin", this.plugin.settings.pinFilters.tags);
        this.addTagFilterSection("Hide", this.plugin.settings.hideFilters.tags);
    }

    private addTagFilterSection(type: "Pin" | "Hide", filters: TagFilter[]) {
        const containerEl = this.containerEl.createDiv();
        containerEl.createEl("h3", { text: `${type} Tag Filters` });

        filters.forEach((filter, index) => {
            new Setting(containerEl)
                .setName(`Tag Filter ${index + 1}`)
                .addText((text) =>
                    text.setValue(filter.pattern).onChange(async (value) => {
                        filter.pattern = value;
                        await this.plugin.saveSettings();
                        this.plugin.getFileExplorer()?.requestSort();
                    })
                )
                .addToggle((toggle) =>
                    toggle.setValue(filter.active).onChange(async (value) => {
                        filter.active = value;
                        await this.plugin.saveSettings();
                        this.plugin.getFileExplorer()?.requestSort();
                    })
                )
                .addButton((button) =>
                    button.setButtonText("Remove").onClick(async () => {
                        filters.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    })
                );
        });

        new Setting(containerEl).addButton((button) =>
            button.setButtonText("Add Tag Filter").onClick(async () => {
                filters.push({ pattern: "", active: true });
                await this.plugin.saveSettings();
                this.display();
            })
        );
    }
}
