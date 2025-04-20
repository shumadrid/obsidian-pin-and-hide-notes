import { App, PluginSettingTab, Setting } from "obsidian";
import FileExplorerPlusPlugin from "./main";

export interface TagFilter {
    pattern: string;
    active: boolean;
}

export interface TagFilterGroup {
    requireAll: boolean;
    tags: TagFilter[];
}

export interface FrontmatterFilter {
    property: string;
    values: string[];
    active: boolean;
}

export interface FileExplorerPlusPluginSettings {
    pinFilters: {
        active: boolean;
        tags: TagFilterGroup;
        frontmatter: FrontmatterFilter[];
    };
    hideFilters: {
        active: boolean;
        inverse: boolean;
        tags: TagFilterGroup;
        frontmatter: FrontmatterFilter[];
    };
}

export const UNSEEN_FILES_DEFAULT_SETTINGS: FileExplorerPlusPluginSettings = {
    pinFilters: {
        active: true,
        tags: {
            requireAll: false,
            tags: [],
        },
        frontmatter: [
            {
                property: "pinned",
                values: ["true"],
                active: true,
            },
        ],
    },
    hideFilters: {
        active: true,
        inverse: false,
        tags: {
            requireAll: false,
            tags: [],
        },
        frontmatter: [
            {
                property: "hidden",
                values: ["true"],
                active: true,
            },
        ],
    },
};

export default class FileExplorerPlusSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: FileExplorerPlusPlugin) {
        super(app, plugin);
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.addClass("file-explorer-plus");

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

        new Setting(this.containerEl)
            .setName("Inverse hide filter")
            .setDesc("When enabled, hide everything except files matching the filters")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.hideFilters.inverse).onChange(async (value) => {
                    this.plugin.settings.hideFilters.inverse = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                })
            );

        // this.addTagFilterSection("Pin", this.plugin.settings.pinFilters.tags);
        // this.addTagFilterSection("Hide", this.plugin.settings.hideFilters.tags);
        this.addFrontmatterFilterSection("Pin", this.plugin.settings.pinFilters.frontmatter);
        this.addFrontmatterFilterSection("Hide", this.plugin.settings.hideFilters.frontmatter);
    }

    private addTagFilterSection(type: "Pin" | "Hide", tagGroup: TagFilterGroup) {
        const containerEl = this.containerEl.createDiv();
        containerEl.createEl("h3", { text: `${type} Tag Filters` });

        // Add built-in tag info
        const infoEl = containerEl.createEl("p", {
            text: `Files with the built-in ${type === "Pin" ? "#pinned" : "#hidden"} tag will always be ${type.toLowerCase()}ed.`,
            attr: { class: "setting-item-description" },
        });

        new Setting(containerEl)
            .setName("Require all tags")
            .setDesc("When enabled, all tag filters must match. When disabled, any matching tag is sufficient.")
            .addToggle((toggle) =>
                toggle.setValue(tagGroup.requireAll).onChange(async (value) => {
                    tagGroup.requireAll = value;
                    await this.plugin.saveSettings();
                    this.plugin.getFileExplorer()?.requestSort();
                })
            );

        tagGroup.tags.forEach((filter, index) => {
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
                        tagGroup.tags.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    })
                );
        });

        new Setting(containerEl).addButton((button) =>
            button.setButtonText("Add Tag Filter").onClick(async () => {
                tagGroup.tags.push({ pattern: "", active: true });
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
