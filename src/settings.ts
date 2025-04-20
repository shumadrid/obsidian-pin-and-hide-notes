import { App, PluginSettingTab, Setting } from "obsidian";
import FileExplorerPlusPlugin from "./main";

export interface TagFilter {
    pattern: string;
    active: boolean;
}

export interface FrontmatterFilter {
    property: string;
    values: string[];
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
        frontmatter: FrontmatterFilter[];
    };
    hideFilters: {
        active: boolean;
        tags: TagFilter[];
        frontmatter: FrontmatterFilter[];
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
        frontmatter: [],
    },
    hideFilters: {
        active: true,
        tags: [],
        frontmatter: [],
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

        // Filters settings
        this.containerEl.createEl("h2", { text: "Filters", attr: { class: "settings-header" } });

        new Setting(this.containerEl)
            .setName("Enable pin filters")
            .setDesc("Enable automatic pinning based on tags or frontmatter properties")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.pinFilters.active).onChange(async (value) => {
                    this.plugin.settings.pinFilters.active = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                });
            });

        new Setting(this.containerEl)
            .setName("Enable hide filters")
            .setDesc("Enable automatic hiding based on tags or frontmatter properties")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.hideFilters.active).onChange(async (value) => {
                    this.plugin.settings.hideFilters.active = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                });
            });

        this.addTagFilterSection("Pin", this.plugin.settings.pinFilters.tags);
        this.addTagFilterSection("Hide", this.plugin.settings.hideFilters.tags);
        this.addFrontmatterFilterSection("Pin", this.plugin.settings.pinFilters.frontmatter);
        this.addFrontmatterFilterSection("Hide", this.plugin.settings.hideFilters.frontmatter);
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

    private addFrontmatterFilterSection(type: "Pin" | "Hide", filters: FrontmatterFilter[]) {
        const containerEl = this.containerEl.createDiv();
        containerEl.createEl("h3", { text: `${type} Frontmatter Filters` });

        filters.forEach((filter, index) => {
            const setting = new Setting(containerEl)
                .setName(`Frontmatter Filter ${index + 1}`)
                .addText((text) =>
                    text
                        .setPlaceholder("Property name")
                        .setValue(filter.property)
                        .onChange(async (value) => {
                            filter.property = value;
                            await this.plugin.saveSettings();
                            this.plugin.getFileExplorer()?.requestSort();
                        })
                )
                .addText((text) =>
                    text
                        .setPlaceholder("Values (comma-separated)")
                        .setValue(filter.values.join(","))
                        .onChange(async (value) => {
                            filter.values = value
                                .split(",")
                                .map((v) => v.trim())
                                .filter((v) => v);
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
            button.setButtonText("Add Frontmatter Filter").onClick(async () => {
                filters.push({ property: "", values: [], active: true });
                await this.plugin.saveSettings();
                this.display();
            })
        );
    }
}
