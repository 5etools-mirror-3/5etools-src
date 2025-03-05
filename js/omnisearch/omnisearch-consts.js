export class OmnisearchConsts {
	static BTN_META_PARTNERED = {
		propOmnisearch: "isShowPartnered",
		fnAddHookOmnisearch: "addHookPartnered",
		fnDoToggleOmnisearch: "doTogglePartnered",
		title: "Include Partnered",
		text: "Partnered",
	};
	static BTN_META_BREW = {
		propOmnisearch: "isShowBrew",
		fnAddHookOmnisearch: "addHookBrew",
		fnDoToggleOmnisearch: "doToggleBrew",
		title: "Include Homebrew",
		text: "Homebrew",
	};
	static BTN_META_UA = {
		propOmnisearch: "isShowUa",
		fnAddHookOmnisearch: "addHookUa",
		fnDoToggleOmnisearch: "doToggleUa",
		title: "Include Unearthed Arcana and other unofficial source results",
		text: "UA/Etc.",
	};
	static BTN_META_BLOCKLISTED = {
		propOmnisearch: "isShowBlocklisted",
		fnAddHookOmnisearch: "addHookBlocklisted",
		fnDoToggleOmnisearch: "doToggleBlocklisted",
		title: "Include blocklisted content results",
		text: "Blocklisted",
	};
	static BTN_META_LEGACY = {
		propOmnisearch: "isShowLegacy",
		fnAddHookOmnisearch: "addHookLegacy",
		fnDoToggleOmnisearch: "doToggleLegacy",
		title: "Include legacy content results",
		text: "Legacy",
	};
	static BTN_META_SRD_ONLY = {
		propOmnisearch: "isSrdOnly",
		fnAddHookOmnisearch: "addHookSrdOnly",
		fnDoToggleOmnisearch: "doToggleSrdOnly",
		title: "Exclude non- Systems Reference Document results",
		text: "SRD",
	};
	static BTN_METAS = [
		this.BTN_META_PARTNERED,
		this.BTN_META_BREW,
		this.BTN_META_UA,
		this.BTN_META_BLOCKLISTED,
		this.BTN_META_LEGACY,
		this.BTN_META_SRD_ONLY,
	];
}
