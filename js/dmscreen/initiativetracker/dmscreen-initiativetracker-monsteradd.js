import {OmnisearchBacking} from "../../omnisearch/omnisearch-backing.js";

class _MonstersToLoad {
	constructor (
		{
			count,
			name,
			source,
			isRollHp,
			displayName,
			customName,
			scaledCr,
			scaledSummonSpellLevel,
			scaledSummonClassLevel,
		},
	) {
		this.count = count;
		this.name = name;
		this.source = source;
		this.isRollHp = isRollHp;
		this.displayName = displayName;
		this.customName = customName;
		this.scaledCr = scaledCr;
		this.scaledSummonSpellLevel = scaledSummonSpellLevel;
		this.scaledSummonClassLevel = scaledSummonClassLevel;
	}
}

class _InitiativeTrackerMonsterAddCustomizer extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.cbDoClose = null;
		}
	};

	constructor ({mon}) {
		super();
		this._mon = mon;
	}

	async pGetShowModalResults () {
		const rdState = new this.constructor._RenderState();

		const {eleModalInner, eleModalFooter, doClose, pGetResolved} = UiUtil.getShowModal({
			title: `Customize Creature \u2014 ${this._mon.name}`,
			isHeaderBorder: true,
			hasFooter: true,
			isMinHeight0: true,
		});
		rdState.cbDoClose = doClose;

		const iptCustomName = ComponentUiUtil.getIptStr(this, "customName");

		ee(eleModalInner)`
			<div class="ve-flex-col ve-py-2 ve-w-100 ve-h-100 ve-overflow-y-auto">
				<label class="ve-split-v-center ve-mb-2">
					<span class="ve-w-200p ve-text-right ve-no-shrink ve-mr-2 ve-bold">Custom Name:</span>
					${iptCustomName}
				</label>
				${this._render_getEleRowScaler()}
			</div>
		`;

		ee(eleModalFooter)`
			${this._render_getEleFooter({rdState})}
		`;

		return pGetResolved();
	}

	_render_getEleRowScaler () {
		const isShowCrScaler = Parser.crToNumber(this._mon.cr) !== VeCt.CR_UNKNOWN;
		const isShowSpellLevelScaler = !isShowCrScaler && this._mon.summonedBySpellLevel != null;
		const isShowClassLevelScaler = !isShowSpellLevelScaler && (this._mon.summonedByClass != null || this._mon.summonedScaleByPlayerLevel);

		if (!isShowCrScaler && !isShowSpellLevelScaler && !isShowClassLevelScaler) return null;

		if (isShowSpellLevelScaler) {
			const sel = Renderer.monster.getSelSummonSpellLevel(this._mon)
				.onn("change", async () => {
					const val = Number(sel.val());
					this._state.scaledSummonSpellLevel = !~val ? null : val;
					if (this._state.scaledSummonSpellLevel == null) return delete this._state.displayName;
					this._state.displayName = (await ScaleSpellSummonedCreature.scale(this._mon, this._state.scaledSummonSpellLevel))._displayName;
				});

			return ee`<label class="ve-split-v-center ve-mb-2">
				<span class="ve-w-200p ve-text-right ve-no-shrink ve-mr-2 ve-bold">Spell Level:</span>
				${sel}
			</label>`;
		}

		if (isShowClassLevelScaler) {
			const sel = Renderer.monster.getSelSummonClassLevel(this._mon)
				.on("change", async () => {
					const val = Number(sel.val());
					this._state.scaledSummonClassLevel = !~val ? null : val;
					if (this._state.scaledSummonClassLevel == null) return delete this._state.displayName;
					this._state.displayName = (await ScaleClassSummonedCreature.scale(this._mon, this._state.scaledSummonClassLevel))._displayName;
				});

			return ee`<label class="ve-split-v-center ve-mb-2">
				<span class="ve-w-200p ve-text-right ve-no-shrink ve-mr-2 ve-bold">${this._mon.summonedByClass != null ? "Class Level" : "Level"}:</span>
				${sel}
			</label>`;
		}

		const dispScaledCr = ee`<span class="ve-inline-block"></span>`;
		this._addHookBase("scaledCr", () => dispScaledCr.txt(this._state.scaledCr ? Parser.numberToCr(this._state.scaledCr) : `${(this._mon.cr.cr || this._mon.cr)} (default)`))();

		const btnScaleCr = ee`<button class="ve-btn ve-btn-default ve-btn-xs ve-mr-2"><span class="glyphicon glyphicon-signal"></span></button>`
			.onn("click", async () => {
				const crBase = this._mon.cr.cr || this._mon.cr;

				const cr = await InputUiUtil.pGetUserScaleCr({default: crBase});
				if (cr == null) return;

				if (crBase === cr) {
					delete this._state.scaledCr;
					delete this._state.displayName;
					return;
				}
				this._state.scaledCr = Parser.crToNumber(cr);
				this._state.displayName = (await ScaleCreature.scale(this._mon, this._state.scaledCr))._displayName;
			});

		return ee`<label class="ve-split-v-center ve-mb-2">
			<span class="ve-w-200p ve-text-right ve-no-shrink ve-mr-2 ve-bold">CR:</span>
			<span class="ve-flex-v-center ve-mr-auto">
				${btnScaleCr}
				${dispScaledCr}
			</span>
		</label>`;
	}

	_render_getEleFooter ({rdState}) {
		const btnSave = ee`<button class="ve-btn ve-btn-primary ve-btn-sm ve-w-100">Save</button>`
			.onn("click", () => {
				rdState.cbDoClose(
					true,
					MiscUtil.copyFast(this.__state),
				);
			});

		return ee`<div class="ve-w-100 ve-py-3 ve-no-shrink">
			${btnSave}
		</div>`;
	}

	_getDefaultState () {
		return {
			customName: null,
			displayName: null,
			scaledCr: null,
			scaledSummonSpellLevel: null,
			scaledSummonClassLevel: null,
		};
	}
}

export class InitiativeTrackerMonsterAdd extends BaseComponent {
	static _RESULTS_MAX_DISPLAY = 75; // hard cap at 75 results

	static _RenderState = class {
		constructor () {
			this.cbDoClose = null;
		}
	};

	constructor ({board, isRollHp}) {
		super();
		this._board = board;

		this._state.isRollHp = isRollHp;
	}

	_getDefaultState () {
		return {
			isRollHp: false,
			cntToAdd: 1,
			cntToAddCustom: 13,
		};
	}

	_getCntToAdd () {
		return this._state.cntToAdd === -1
			? Math.max(1, this._state.cntToAddCustom)
			: this._state.cntToAdd;
	}

	/* -------------------------------------------- */

	_getCbCntToAdd ({cnt}) {
		const cb = ee`<input type="radio" class="ve-ui-search__ipt-search-sub-ipt">`;
		cb.onn("change", () => {
			this._state.cntToAdd = cnt;
		});
		this._addHookBase("cntToAdd", () => cb.prop("checked", this._state.cntToAdd === cnt))();
		return cb;
	}

	_getIptCntToAddCustom () {
		const iptCntToAddCustom = ComponentUiUtil.getIptInt(
			this,
			"cntToAddCustom",
			1,
			{
				html: `<input type="number" class="ve-form-control ve-ui-search__ipt-search-sub-ipt-custom">`,
				min: 1,
			},
		);

		this._addHookBase("cntToAdd", () => {
			if (this._state.cntToAdd !== -1) return;
			iptCntToAddCustom.selecte();
		})();

		iptCntToAddCustom.onn("click", () => {
			this._state.cntToAdd = -1;
		});

		return iptCntToAddCustom;
	}

	/**
	 * @return {Promise<[boolean, _MonstersToLoad]>}
	 */
	async pGetShowModalResults () {
		const rdState = new this.constructor._RenderState();

		const flags = {
			doClickFirst: false,
			isWait: false,
		};

		const {eleModalInner, doClose, pGetResolved} = UiUtil.getShowModal();
		rdState.cbDoClose = doClose;

		const iptSearch = ee`<input class="ve-ui-search__ipt-search search ve-form-control" autocomplete="off" placeholder="Search...">`;

		ee`<div class="ve-split ve-no-shrink">
			${iptSearch}

			<div class="ve-ui-search__ipt-search-sub-wrp ve-flex-v-center ve-pr-0">
				<div class="ve-mr-1">Add</div>
				<label class="ve-ui-search__ipt-search-sub-lbl">${this._getCbCntToAdd({cnt: 1})} 1</label>
				<label class="ve-ui-search__ipt-search-sub-lbl">${this._getCbCntToAdd({cnt: 2})} 2</label>
				<label class="ve-ui-search__ipt-search-sub-lbl">${this._getCbCntToAdd({cnt: 3})} 3</label>
				<label class="ve-ui-search__ipt-search-sub-lbl">${this._getCbCntToAdd({cnt: 5})} 5</label>
				<label class="ve-ui-search__ipt-search-sub-lbl">${this._getCbCntToAdd({cnt: 8})} 8</label>
				<label class="ve-ui-search__ipt-search-sub-lbl">${this._getCbCntToAdd({cnt: -1})} ${this._getIptCntToAddCustom()}</label>
			</div>

			<label class="ve-ui-search__ipt-search-sub-wrp ve-flex-vh-center">${ComponentUiUtil.getCbBool(this, "isRollHp").addClass("ve-mr-1")} <span>Roll HP</span></label>
		</div>`.appendTo(eleModalInner);

		const wrpResults = ee`<div class="ve-ui-search__wrp-results"></div>`.appendTo(eleModalInner);

		const showMsgIpt = () => {
			flags.isWait = true;
			wrpResults.empty().appends(SearchWidget.getSearchEnter());
		};

		const showMsgDots = () => wrpResults.empty().appends(SearchWidget.getSearchLoading());

		const showNoResults = () => {
			flags.isWait = true;
			wrpResults.empty().appends(SearchWidget.getSearchNoResults());
		};

		const ptrRows = {_: []};

		const pDoSearch = async () => {
			const searchTerm = iptSearch.val().trim();

			const index = this._board.availContent["Creature"];
			const results = await OmnisearchBacking.pGetFilteredResults(
				index.search(searchTerm, {
					fields: {
						n: {boost: 5, expand: true},
						s: {expand: true},
					},
					bool: "AND",
					expand: true,
				}),
				{
					searchTerm,
				},
			);
			const resultCount = results.length ? results.length : index.documentStore.length;
			const toProcess = results.length ? results : Object.values(index.documentStore.docs).slice(0, 75).map(it => ({doc: it}));

			wrpResults.empty();
			ptrRows._ = [];
			if (toProcess.length) {
				if (flags.doClickFirst) {
					await this._render_pHandleClickRow({rdState}, toProcess[0]);
					flags.doClickFirst = false;
					return;
				}

				const results = toProcess.slice(0, this.constructor._RESULTS_MAX_DISPLAY);

				results.forEach(res => {
					const row = this._render_getSearchRow({rdState, res}).appendTo(wrpResults);
					SearchWidget.bindRowHandlers({result: res, row, ptrRows, fnHandleClick: this._render_pHandleClickRow.bind(this, {rdState}), iptSearch});
					ptrRows._.push(row);
				});

				if (resultCount > this.constructor._RESULTS_MAX_DISPLAY) {
					const diff = resultCount - this.constructor._RESULTS_MAX_DISPLAY;
					wrpResults.appends(`<div class="ve-ui-search__row ve-ui-search__row--readonly">...${diff} more result${diff === 1 ? " was" : "s were"} hidden. Refine your search!</div>`);
				}
			} else {
				if (!searchTerm.trim()) showMsgIpt();
				else showNoResults();
			}
		};

		SearchWidget.bindAutoSearch(iptSearch, {
			flags,
			pFnSearch: pDoSearch,
			fnShowWait: showMsgDots,
			ptrRows,
		});

		iptSearch.focuse();
		await pDoSearch();

		return pGetResolved();
	}

	async _render_pHandleClickRow ({rdState}, res) {
		await rdState.cbDoClose(
			true,
			new _MonstersToLoad({
				count: this._getCntToAdd(),
				name: res.doc.n,
				source: res.doc.s,
				isRollHp: this._state.isRollHp,
			}),
		);
	}

	_render_getSearchRow ({rdState, res}) {
		const btnCustomize = ee`<button class="ve-btn ve-btn-default ve-btn-xxs" title="Customize"><span class="glyphicon glyphicon-stats"></span></button>`
			.onn("click", async evt => {
				evt.stopPropagation();
				await this._render_pHandleClickCustomize({rdState, res});
			});

		return ee`
			<div class="ve-ui-search__row ve-flex-v-center" tabindex="0">
				<span>${res.doc.n}</span>
				<div class="ve-flex-vh-center">
					<span class="ve-mr-2">${res.doc.s ? `<i title="${Parser.sourceJsonToFull(res.doc.s)}">${Parser.sourceJsonToAbv(res.doc.s)}${res.doc.p ? ` p${res.doc.p}` : ""}</i>` : ""}</span>
					${btnCustomize}
				</div>
			</div>
		`;
	}

	async _render_pHandleClickCustomize ({rdState, res}) {
		const mon = await DataLoader.pCacheAndGet(UrlUtil.PG_BESTIARY, res.doc.s, res.doc.u);
		if (!mon) return;

		const comp = new _InitiativeTrackerMonsterAddCustomizer({mon});

		const resModal = await comp.pGetShowModalResults();
		if (resModal == null) return;

		const [isDataEntered, data] = resModal;
		if (!isDataEntered) return;

		await rdState.cbDoClose(
			true,
			new _MonstersToLoad({
				count: this._getCntToAdd(),
				name: res.doc.n,
				source: res.doc.s,
				isRollHp: this._state.isRollHp,
				...data,
			}),
		);
	}
}
