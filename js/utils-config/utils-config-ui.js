import {VetoolsConfig} from "./utils-config-config.js";
import {SETTINGS_GROUPS} from "./utils-config-registry.js";

class _ConfigRenderState {
	wrp;
	comp;

	constructor (
		{
			wrp,
			comp,
		},
	) {
		this.wrp = wrp;
		this.comp = comp;
	}
}

export class ConfigUi {
	constructor (
		{
			settingsGroups,
		},
	) {
		this._settingsGroups = settingsGroups;
	}

	render (wrp) {
		const rdState = new _ConfigRenderState({
			wrp,
			comp: VetoolsConfig.getConfigComp(),
		});

		this._settingsGroups
			.forEach((configSection, i, arr) => {
				configSection.render(rdState, {isLast: i === arr.length - 1});
			});
	}

	/* -------------------------------------------- */

	/**
	 * @param {?string[]} settingsGroupIds Subset of group IDs to display
	 */
	static show (
		{
			settingsGroupIds = null,
		} = {},
	) {
		const settingsGroups = settingsGroupIds
			? SETTINGS_GROUPS
				.filter(group => settingsGroupIds.includes(group.groupId))
			: SETTINGS_GROUPS;

		const ui = new this({
			settingsGroups,
		});

		const {$modalInner, $modalFooter, doClose} = UiUtil.getShowModal({
			isUncappedWidth: true,
			isUncappedHeight: true,
			title: "Preferences",
			headerType: 3,
			isHeaderBorder: true,
			overlayColor: "transparent",
			hasFooter: true,
		});

		ui.render($modalInner[0]);

		const btnClose = ee`<button class="ve-btn ve-btn-default ve-btn-sm ml-auto">Close</button>`
			.onn("click", () => doClose());

		ee`<div class="py-1 w-100 ve-flex-v-center">
			${btnClose}
		</div>`
			.appendTo($modalFooter[0]);
	}
}
