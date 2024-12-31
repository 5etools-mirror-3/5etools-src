import {ConfigSettingsGroup} from "./util-config-settings-group.js";
import {ConfigSettingBoolean, ConfigSettingEnum, ConfigSettingExternal} from "./utils-config-setting-base.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE, SITE_STYLE_DISPLAY} from "../consts.js";

const settingsGroupStyleSwitcher = new ConfigSettingsGroup({
	groupId: "styleSwitcher",
	name: "Appearance",
	configSettings: [
		new (
			class extends ConfigSettingExternal {
				_configId = "theme";
				_name = "Theme";
				_help = "The color theme to be applied.";
				_isRowLabel = true;

				_getEleExternal () { return StyleSwitcher.getSelStyle(); }
			}
		)(),
		new ConfigSettingEnum({
			configId: "style",
			name: `<span>Style <span class="ve-small">(see also: <a href="https://2014.5e.tools" rel="noopener noreferrer" target="_blank">2014.5e.tools</a>)</span></span>`,
			help: `The styling to be applied when rendering specific information (stat blocks, etc.). Does not affect what content is available, only how it is displayed. See also: https://2014.5e.tools.`,
			isRowLabel: true,
			isReloadRequired: true,
			default: SITE_STYLE__ONE,
			values: [
				SITE_STYLE__CLASSIC,
				SITE_STYLE__ONE,
			],
			fnDisplay: it => SITE_STYLE_DISPLAY[it] || it,
		}),
		new (
			class extends ConfigSettingExternal {
				_configId = "isWideMode";
				_name = "Wide Mode (Experimental)";
				_help = "This feature is unsupported. Expect bugs.";
				_isRowLabel = true;

				_getEleExternal () { return StyleSwitcher.getCbWide(); }
			}
		)(),
	],
});

const _MARKDOWN_TAG_RENDER_MODES = {
	"convertMarkdown": "Convert to Markdown",
	"ignore": "Leave As-Is",
	"convertText": "Convert to Text",
};

const settingsGroupMarkdown = new ConfigSettingsGroup({
	groupId: "markdown",
	name: "Markdown",
	configSettings: [
		new ConfigSettingEnum({
			configId: "tagRenderMode",
			name: `Tag Handling (<code>@tag</code>)`,
			help: `The output to produce when rendering a 5etools "@tag".`,
			isRowLabel: true,
			default: "convertMarkdown",
			values: [
				"convertMarkdown",
				"ignore",
				"convertText",
			],
			fnDisplay: it => _MARKDOWN_TAG_RENDER_MODES[it] || it,
		}),
		new ConfigSettingBoolean({
			configId: "isAddColumnBreaks",
			name: `Add GM Binder Column Breaks (<code>\\\\columnbreak</code>)`,
			help: `If "\\\\columnbreak"s should be added to exported Markdown, at an approximate column breakpoint.`,
			isRowLabel: true,
			default: false,
		}),
		new ConfigSettingBoolean({
			configId: "isAddPageBreaks",
			name: `Add GM Binder Page Breaks (<code>\\\\pagebreak</code>)`,
			help: `If "\\\\pagebreak"s should be added to exported Markdown, at an approximate page breakpoint.`,
			isRowLabel: true,
			default: false,
		}),
	],
});

export const SETTINGS_GROUPS = [
	settingsGroupStyleSwitcher,
	settingsGroupMarkdown,
];
