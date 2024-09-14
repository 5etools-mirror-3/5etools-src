import {EncounterBuilderUi} from "../encounterbuilder/encounterbuilder-ui.js";
import {EncounterBuilderCreatureMeta} from "../encounterbuilder/encounterbuilder-models.js";
import {EncounterBuilderHelpers} from "../utils-list-bestiary.js";

export class EncounterBuilderUiBestiary extends EncounterBuilderUi {
	static _HASH_KEY = "encounterbuilder";

	_isSuspendSyncToSublist = false;

	constructor ({cache, comp, bestiaryPage, sublistManager}) {
		super({cache, comp});

		this._bestiaryPage = bestiaryPage;
		this._sublistManager = sublistManager;

		this._lock = new VeLock();

		this._cachedTitle = null;
	}

	initUi () {
		document.getElementById("stat-tabs").classList.add("best-ecgen__hidden");
		document.getElementById("float-token").classList.add("best-ecgen__hidden");
		document.getElementById("wrp-pagecontent").classList.add("best-ecgen__hidden");

		$(`#btn-encounterbuild`).click(() => Hist.setSubhash(this.constructor._HASH_KEY, true));
	}

	render () {
		super.render({
			$parentRandomAndAdjust: $("#wrp-encounterbuild-random-and-adjust"),
			$parentGroupAndDifficulty: $("#wrp-encounterbuild-group-and-difficulty"),
		});
		this._render_saveLoad();
	}

	_render_saveLoad () {
		const $btnSave = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Save Encounter</button>`)
			.click(evt => this._sublistManager.pHandleClick_save(evt));

		const $btnLoad = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Load Encounter</button>`)
			.click(evt => this._sublistManager.pHandleClick_load(evt));

		$$(document.getElementById("best-ecgen__wrp-save-controls"))`<div class="ve-flex-col">
			<div class="ve-flex-h-right ve-btn-group">
				${$btnSave}
				${$btnLoad}
			</div>
		</div>`;
	}

	_handleClickCopyAsText (evt) {
		let xpTotal = 0;
		const ptsCreature = this._sublistManager.sublistItems
			.sort((a, b) => SortUtil.ascSortLower(a.name, b.name))
			.map(it => {
				xpTotal += Parser.crToXpNumber(it.values.cr) * it.data.count;
				return `${it.data.count}× ${it.name}`;
			});
		const ptXp = `${xpTotal.toLocaleString()} XP`;

		if (evt.shiftKey) {
			MiscUtil.pCopyTextToClipboard([...ptsCreature, ptXp].join("\n")).then(null);
		} else {
			MiscUtil.pCopyTextToClipboard(`${ptsCreature.join(", ")} (${ptXp})`).then(null);
		}
		JqueryUtil.showCopiedEffect(evt.currentTarget);
	}

	_handleClickBackToStatblocks () {
		Hist.setSubhash(this.constructor._HASH_KEY, null);
	}

	_render_groupAndDifficulty ({rdState, $parentGroupAndDifficulty}) {
		super._render_groupAndDifficulty({rdState, $parentGroupAndDifficulty});

		const $btnSaveToUrl = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2">Save to URL</button>`)
			.click(() => this._sublistManager.pHandleClick_download({isUrl: true, $eleCopyEffect: $btnSaveToUrl}));
		const $btnSaveToFile = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Save to File</button>`)
			.click(() => this._sublistManager.pHandleClick_download());
		const $btnLoadFromFile = $(`<button class="ve-btn ve-btn-default ve-btn-xs">Load from File</button>`)
			.click(evt => this._sublistManager.pHandleClick_upload({isAdditive: evt.shiftKey}));
		const $btnCopyAsText = $(`<button class="ve-btn ve-btn-default ve-btn-xs mr-2" title="SHIFT for Multi-Line Format">Copy as Text</button>`).click((evt) => this._handleClickCopyAsText(evt));
		const $btnReset = $(`<button class="ve-btn ve-btn-danger ve-btn-xs" title="SHIFT to Reset Players">Reset</button>`)
			.click((evt) => this._sublistManager.pHandleClick_new(evt));

		const $btnBackToStatblocks = $(`<button class="ve-btn ve-btn-success ve-btn-xs">Back to Stat Blocks</button>`).click((evt) => this._handleClickBackToStatblocks(evt));

		$$`<div class="ve-flex-col w-100">
			<hr class="hr-1">

			<div class="ve-flex-v-center mb-2">
				${$btnSaveToUrl}
				<div class="ve-btn-group ve-flex-v-center mr-2">
					${$btnSaveToFile}
					${$btnLoadFromFile}
				</div>
				${$btnCopyAsText}
				${$btnReset}
			</div>
	
			<div class="ve-flex">
				${$btnBackToStatblocks}
			</div>
		</div>`
			.appendTo($parentGroupAndDifficulty);
	}

	/* -------------------------------------------- */

	withSublistSyncSuppressed (fn) {
		try {
			this._isSuspendSyncToSublist = true;
			fn();
		} finally {
			this._isSuspendSyncToSublist = false;
		}
	}

	/**
	 * On encounter builder state change, save to the sublist
	 */
	_render_hk_doUpdateExternalStates () {
		if (this._isSuspendSyncToSublist) return;
		this._render_hk_pDoUpdateExternalStates().then(null);
	}

	async _render_hk_pDoUpdateExternalStates () {
		try {
			await this._lock.pLock();
			await this._render_hk_pDoUpdateExternalStates_();
		} finally {
			this._lock.unlock();
		}
	}

	async _render_hk_pDoUpdateExternalStates_ () {
		const nxtState = await this._sublistManager.pGetExportableSublist({isMemoryOnly: true});
		Object.assign(nxtState, this._comp.getSublistPluginState());
		await this._sublistManager.pDoLoadExportedSublist(nxtState, {isMemoryOnly: true});
	}

	/* -------------------------------------------- */

	onSublistChange ({$dispCrTotal}) {
		const encounterXpInfo = EncounterBuilderCreatureMeta.getEncounterXpInfo(this._comp.creatureMetas, this._getPartyMeta());

		const monCount = this._sublistManager.sublistItems.map(it => it.data.count).sum();
		$dispCrTotal.html(`${monCount} creature${monCount === 1 ? "" : "s"}; ${encounterXpInfo.baseXp.toLocaleString()} XP (<span class="help" title="Adjusted Encounter XP">Enc</span>: ${(encounterXpInfo.adjustedXp).toLocaleString()} XP)`);
	}

	/* -------------------------------------------- */

	resetCache () { this._cache.reset(); }

	isActive () {
		return Hist.getSubHash(this.constructor._HASH_KEY) === "true";
	}

	_showBuilder () {
		this._cachedTitle = this._cachedTitle || document.title;
		document.title = "Encounter Builder - 5etools";
		$(document.body).addClass("best__ecgen-active");
		this._bestiaryPage.doDeselectAll();
		this._sublistManager.doSublistDeselectAll();
	}

	_hideBuilder () {
		if (this._cachedTitle) {
			document.title = this._cachedTitle;
			this._cachedTitle = null;
		}
		$(document.body).removeClass("best__ecgen-active");
	}

	_handleClick ({evt, mode, entity}) {
		if (mode === "add") {
			return this._sublistManager.pDoSublistAdd({entity, doFinalize: true, addCount: evt.shiftKey ? 5 : 1});
		}

		return this._sublistManager.pDoSublistSubtract({entity, subtractCount: evt.shiftKey ? 5 : 1});
	}

	async _pHandleShuffleClick ({evt, sublistItem}) {
		const creatureMeta = EncounterBuilderHelpers.getSublistedCreatureMeta({sublistItem});
		this._doShuffle({creatureMeta});
	}

	handleSubhash () {
		if (Hist.getSubHash(this.constructor._HASH_KEY) === "true") this._showBuilder();
		else this._hideBuilder();
	}

	async doStatblockMouseOver ({evt, ele, source, hash, customHashId}) {
		return Renderer.hover.pHandleLinkMouseOver(
			evt,
			ele,
			{
				page: UrlUtil.PG_BESTIARY,
				source,
				hash,
				customHashId,
			},
		);
	}

	static getTokenHoverMeta (mon) {
		if (!Renderer.monster.hasToken(mon)) return null;

		return Renderer.hover.getMakePredefinedHover(
			{
				type: "image",
				href: {
					type: "external",
					url: Renderer.monster.getTokenUrl(mon),
				},
				data: {
					hoverTitle: `Token \u2014 ${mon.name}`,
				},
			},
			{isBookContent: true},
		);
	}

	static _getFauxMon (name, source, scaledTo) {
		return {name, source, _isScaledCr: scaledTo != null, _scaledCr: scaledTo};
	}

	async pDoCrChange ($iptCr, monScaled, scaledTo) {
		if (!$iptCr) return; // Should never occur, but if the creature has a non-adjustable CR, this field will not exist

		try {
			await this._lock.pLock();
			await this._pDoCrChange({$iptCr, monScaled, scaledTo});
		} finally {
			this._lock.unlock();
		}
	}

	async _pDoCrChange ({$iptCr, monScaled, scaledTo}) {
		// Fetch original
		const mon = await DataLoader.pCacheAndGetHash(
			UrlUtil.PG_BESTIARY,
			UrlUtil.autoEncodeHash(monScaled),
		);

		const baseCr = mon.cr.cr || mon.cr;
		if (baseCr == null) return;
		const baseCrNum = Parser.crToNumber(baseCr);
		const targetCr = $iptCr.val();

		if (!Parser.isValidCr(targetCr)) {
			JqueryUtil.doToast({
				content: `"${$iptCr.val()}" is not a valid Challenge Rating! Please enter a valid CR (0-30). For fractions, "1/X" should be used.`,
				type: "danger",
			});
			$iptCr.val(Parser.numberToCr(scaledTo || baseCr));
			return;
		}

		const targetCrNum = Parser.crToNumber(targetCr);

		if (targetCrNum === scaledTo) return;

		const state = await this._sublistManager.pGetExportableSublist({isForceIncludePlugins: true, isMemoryOnly: true});
		const toFindHash = UrlUtil.autoEncodeHash(mon);

		const toFindUid = !(scaledTo == null || baseCrNum === scaledTo) ? Renderer.monster.getCustomHashId(this.constructor._getFauxMon(mon.name, mon.source, scaledTo)) : null;
		const ixCurrItem = state.items.findIndex(it => {
			if (scaledTo == null || scaledTo === baseCrNum) return !it.customHashId && it.h === toFindHash;
			else return it.customHashId === toFindUid;
		});
		if (!~ixCurrItem) throw new Error(`Could not find previously sublisted item!`);

		const toFindNxtUid = baseCrNum !== targetCrNum ? Renderer.monster.getCustomHashId(this.constructor._getFauxMon(mon.name, mon.source, targetCrNum)) : null;
		const nextItem = state.items.find(it => {
			if (targetCrNum === baseCrNum) return !it.customHashId && it.h === toFindHash;
			else return it.customHashId === toFindNxtUid;
		});

		// if there's an existing item with a matching UID (or lack of), merge into it
		if (nextItem) {
			const curr = state.items[ixCurrItem];
			nextItem.c = `${Number(nextItem.c || 1) + Number(curr.c || 1)}`;
			state.items.splice(ixCurrItem, 1);
		} else {
			// if we're returning to the original CR, wipe the existing UID. Otherwise, adjust it
			if (targetCrNum === baseCrNum) delete state.items[ixCurrItem].customHashId;
			else state.items[ixCurrItem].customHashId = Renderer.monster.getCustomHashId(this.constructor._getFauxMon(mon.name, mon.source, targetCrNum));
		}

		await this._sublistManager.pDoLoadExportedSublist(state, {isMemoryOnly: true});
	}

	getButtons (monId) {
		return e_({
			tag: "span",
			clazz: `best-ecgen__visible ve-col-1 no-wrap pl-0 ve-btn-group`,
			click: evt => {
				evt.preventDefault();
				evt.stopPropagation();
			},
			children: [
				e_({
					tag: "button",
					title: `Add (SHIFT for 5)`,
					clazz: `ve-btn ve-btn-success ve-btn-xs best-ecgen__btn-list`,
					click: evt => this._handleClick({evt, entity: this._bestiaryPage.dataList_[monId], mode: "add"}),
					children: [
						e_({
							tag: "span",
							clazz: `glyphicon glyphicon-plus`,
						}),
					],
				}),
				e_({
					tag: "button",
					title: `Subtract (SHIFT for 5)`,
					clazz: `ve-btn ve-btn-danger ve-btn-xs best-ecgen__btn-list`,
					click: evt => this._handleClick({evt, entity: this._bestiaryPage.dataList_[monId], mode: "subtract"}),
					children: [
						e_({
							tag: "span",
							clazz: `glyphicon glyphicon-minus`,
						}),
					],
				}),
			],
		});
	}

	getSublistButtonsMeta (sublistItem) {
		const $btnAdd = $(`<button title="Add (SHIFT for 5)" class="ve-btn ve-btn-success ve-btn-xs best-ecgen__btn-list"><span class="glyphicon glyphicon-plus"></span></button>`)
			.click(evt => this._handleClick({evt, entity: sublistItem.data.entity, mode: "add"}));

		const $btnSub = $(`<button title="Subtract (SHIFT for 5)" class="ve-btn ve-btn-danger ve-btn-xs best-ecgen__btn-list"><span class="glyphicon glyphicon-minus"></span></button>`)
			.click(evt => this._handleClick({evt, entity: sublistItem.data.entity, mode: "subtract"}));

		const $btnRandomize = $(`<button title="Randomize Monster" class="ve-btn ve-btn-default ve-btn-xs best-ecgen__btn-list"><span class="glyphicon glyphicon-random"></span></button>`)
			.click(evt => this._pHandleShuffleClick({evt, sublistItem}));

		const $btnLock = $(`<button title="Lock Monster against Randomizing/Adjusting" class="ve-btn ve-btn-default ve-btn-xs best-ecgen__btn-list"><span class="glyphicon glyphicon-lock"></span></button>`)
			.click(() => this._sublistManager.pSetDataEntry({sublistItem, key: "isLocked", value: !sublistItem.data.isLocked}))
			.toggleClass("active", sublistItem.data.isLocked);

		const $wrp = $$`<span class="best-ecgen__visible ve-col-1-5 no-wrap pl-0 ve-btn-group">
			${$btnAdd}
			${$btnSub}
			${$btnRandomize}
			${$btnLock}
		</span>`
			.click(evt => {
				evt.preventDefault();
				evt.stopPropagation();
			});

		return {
			$wrp,
			fnUpdate: () => $btnLock.toggleClass("active", sublistItem.data.isLocked),
		};
	}
}
