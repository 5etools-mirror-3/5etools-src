export class ConfigSettingsGroup {
	constructor (
		{
			groupId,
			name,
			configSettings,
		},
	) {
		this._groupId = groupId;
		this._name = name;
		this._configSettings = configSettings;

		this._configSettings
			.forEach(configSetting => configSetting.setGroupId(this._groupId));
	}

	get groupId () { return this._groupId; }

	render (rdState, {isLast = false} = {}) {
		const wrpRows = ee`<div></div>`;

		ee`<div class="w-100">
			<h4>${this._name}</h4>
			${wrpRows}
			${isLast ? null : `<hr class="hr-3 mb-1">`}
		</div>`
			.appendTo(rdState.wrp);

		this._configSettings
			.forEach(configSetting => configSetting.render(rdState, wrpRows));
	}

	mutDefaults (config) {
		const group = config[this._groupId] ||= {};
		this._configSettings
			.forEach(configSetting => configSetting.mutDefaults(group));
	}

	mutVerify (config) {
		const group = config[this._groupId] ||= {};
		this._configSettings
			.forEach(configSetting => configSetting.mutVerify(group));
	}
}
