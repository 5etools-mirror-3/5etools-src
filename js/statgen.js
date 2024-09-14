"use strict";

class StatGenPage {
	constructor () {
		this._statGenUi = null;
		this._isIgnoreHashChanges = false;
	}

	async pInit () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();
		const [races, backgrounds, feats] = await Promise.all([
			await this._pLoadRaces(),
			await this._pLoadBackgrounds(),
			await this._pLoadFeats(),
		]);

		this._statGenUi = new StatGenUi({
			races,
			backgrounds,
			feats,
			tabMetasAdditional: this._getAdditionalTabMetas(),
		});
		await this._statGenUi.pInit();
		this._statGenUi.addHookActiveTag(() => this._setHashFromTab());
		const savedStateDebounced = MiscUtil.throttle(this._pDoSaveState.bind(this), 100);
		this._statGenUi.addHookAll("state", () => savedStateDebounced());

		window.addEventListener("hashchange", () => this._handleHashChange());
		const setStateFromHash = this._handleHashChange();

		if (!setStateFromHash) {
			const savedState = await StorageUtil.pGetForPage(StatGenPage._STORAGE_KEY_STATE);
			if (savedState != null) this._statGenUi.setStateFrom(savedState);
		}

		this._statGenUi.render($(`#statgen-main`));

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_getAdditionalTabMetas () {
		return [
			new TabUiUtil.TabMeta({
				type: "buttons",
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-download"></span>`,
						title: "Save to File",
						pFnClick: () => {
							DataUtil.userDownload("statgen", this._statGenUi.getSaveableState(), {fileType: "statgen"});
						},
					},
				],
			}),
			new TabUiUtil.TabMeta({
				type: "buttons",
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-upload"></span>`,
						title: "Load from File",
						pFnClick: async () => {
							const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["statgen"]});

							DataUtil.doHandleFileLoadErrorsGeneric(errors);

							if (!jsons?.length) return;
							this._statGenUi.setStateFrom(jsons[0]);
						},
					},
				],
			}),
			new TabUiUtil.TabMeta({
				type: "buttons",
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-magnet"></span>`,
						title: "Copy Link",
						pFnClick: async (evt, $btn) => {
							const encoded = `${window.location.href.split("#")[0]}#pointbuy${HASH_PART_SEP}${encodeURIComponent(JSON.stringify(this._statGenUi.getSaveableState()))}`;
							await MiscUtil.pCopyTextToClipboard(encoded);
							JqueryUtil.showCopiedEffect($btn);
						},
					},
				],
			}),
			new TabUiUtil.TabMeta({
				type: "buttons",
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-refresh"></span>`,
						title: "Reset All",
						type: "danger",
						pFnClick: () => this._statGenUi.doResetAll(),
					},
				],
			}),
		];
	}

	async _pDoSaveState () {
		const statGenState = this._statGenUi.getSaveableState();
		await StorageUtil.pSetForPage(StatGenPage._STORAGE_KEY_STATE, statGenState);
	}

	async _pLoadRaces () {
		return [
			...(await DataUtil.race.loadJSON()).race,
			...((await DataUtil.race.loadPrerelease({isAddBaseRaces: false})).race || []),
			...((await DataUtil.race.loadBrew({isAddBaseRaces: false})).race || []),
		]
			.filter(it => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](it);
				return !ExcludeUtil.isExcluded(hash, "race", it.source);
			});
	}

	async _pLoadBackgrounds () {
		return [
			...(await DataUtil.loadJSON("data/backgrounds.json")).background,
			...((await PrereleaseUtil.pGetBrewProcessed()).background || []),
			...((await BrewUtil2.pGetBrewProcessed()).background || []),
		]
			.filter(it => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](it);
				return !ExcludeUtil.isExcluded(hash, "background", it.source);
			});
	}

	async _pLoadFeats () {
		return [
			...(await DataUtil.loadJSON("data/feats.json")).feat,
			...((await PrereleaseUtil.pGetBrewProcessed()).feat || []),
			...((await BrewUtil2.pGetBrewProcessed()).feat || []),
		]
			.filter(it => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](it);
				return !ExcludeUtil.isExcluded(hash, "feat", it.source);
			});
	}

	_setTabFromHash (tabName) {
		this._isIgnoreHashChanges = true;
		const ixTab = this._statGenUi.MODES.indexOf(tabName);
		this._statGenUi.ixActiveTab = ~ixTab ? ixTab : 0;
		this._isIgnoreHashChanges = false;
	}

	_setHashFromTab () {
		this._isIgnoreHashChanges = true;
		window.location.hash = this._statGenUi.MODES[this._statGenUi.ixActiveTab];
		this._isIgnoreHashChanges = false;
	}

	_handleHashChange () {
		if (this._isIgnoreHashChanges) return false;

		const hash = (window.location.hash.slice(1) || "").trim().toLowerCase();
		const [mode, state] = (hash.split(HASH_PART_SEP) || [""]);

		if (!this._statGenUi.MODES.includes(mode)) {
			this._doSilentHashChange(this._statGenUi.MODES[0]);
			window.history.replaceState(
				{},
				document.title,
				`${location.origin}${location.pathname}#${this._statGenUi.MODES[0]}`,
			);
			return this._handleHashChange();
		}

		this._setTabFromHash(mode);
		if (!state || !state.trim()) return false;

		this._doSilentHashChange(mode);

		try {
			const saved = JSON.parse(decodeURIComponent(state));
			this._statGenUi.setStateFrom(saved);
			return true;
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load state from URL!`});
			setTimeout(() => { throw e; });
			return false;
		}
	}

	_doSilentHashChange (mode) {
		window.history.replaceState(
			{},
			document.title,
			`${location.origin}${location.pathname}#${mode}`,
		);
	}
}
StatGenPage._STORAGE_KEY_STATE = "state";

const statGenPage = new StatGenPage();
window.addEventListener("load", () => statGenPage.pInit());
