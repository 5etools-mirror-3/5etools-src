import {StatGenUiCompAsi} from "./statgen-ui-comp-asi.js";
import {StatGenUiRenderLevelOneBackground} from "./statgen-ui-comp-levelone-background.js";
import {StatGenUiRenderLevelOneRace} from "./statgen-ui-comp-levelone-race.js";
import {StatGenUiRenderableCollectionPbRules} from "./statgen-ui-comp-pbrules.js";
import {MAX_CUSTOM_FEATS, MODE_NONE} from "./statgen-ui-consts.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__ONE} from "../consts.js";

export class StatGenUi extends BaseComponent {
	static _STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
	static _PROP_PREFIX_COMMON = "common_";
	static _PROP_PREFIX_ROLLED = "rolled_";
	static _PROP_PREFIX_ARRAY = "array_";
	static _PROP_PREFIX_MANUAL = "manual_";
	static _MODES = [
		"rolled",
		"array",
		"pointbuy",
		"manual",
	];
	static _MODES_FVTT = [
		MODE_NONE,
		...this._MODES,
	];

	static _PROPS_CUSTOM = [
		"rolled_formula",
		"rolled_rollCount",

		"pb_rules",
		"pb_budget",
		"pb_isCustom",
	];

	/**
	 * @param opts
	 * @param opts.races
	 * @param opts.backgrounds
	 * @param opts.feats
	 * @param [opts.tabMetasAdditional]
	 * @param [opts.isCharacterMode] Disables some functionality (e.g. changing number of ability scores)
	 * @param [opts.isFvttMode]
	 * @param [opts.modalFilterRaces]
	 * @param [opts.modalFilterBackgrounds]
	 * @param [opts.modalFilterFeats]
	 * @param [opts.existingScores]
	 */
	constructor (opts) {
		super();
		opts = opts || {};

		TabUiUtilSide.decorate(this, {isInitMeta: true});

		this._races = opts.races;
		this._backgrounds = opts.backgrounds;
		this._feats = opts.feats;
		this._tabMetasAdditional = opts.tabMetasAdditional;
		this._isCharacterMode = opts.isCharacterMode;
		this._isFvttMode = opts.isFvttMode;

		this._MODES = this._isFvttMode ? StatGenUi._MODES_FVTT : StatGenUi._MODES;
		if (this._isFvttMode) {
			let cnt = 0;
			this._IX_TAB_NONE = cnt++;
			this._IX_TAB_ROLLED = cnt++;
			this._IX_TAB_ARRAY = cnt++;
			this._IX_TAB_PB = cnt++;
			this._IX_TAB_MANUAL = cnt;
		} else {
			this._IX_TAB_NONE = -1;
			let cnt = 0;
			this._IX_TAB_ROLLED = cnt++;
			this._IX_TAB_ARRAY = cnt++;
			this._IX_TAB_PB = cnt++;
			this._IX_TAB_MANUAL = cnt;
		}

		this._modalFilterRaces = opts.modalFilterRaces || new ModalFilterRaces({namespace: "statgen.races", isRadio: true, allData: this._races});
		this._modalFilterBackgrounds = opts.modalFilterBackgrounds || new ModalFilterBackgrounds({namespace: "statgen.backgrounds", isRadio: true, allData: this._backgrounds});
		this._modalFilterFeats = opts.modalFilterFeats || new ModalFilterFeats({namespace: "statgen.feats", isRadio: true, allData: this._feats});

		this._isLevelUp = !!opts.existingScores;
		this._existingScores = opts.existingScores;

		// region Rolled
		this._rollIptFormula = null;
		// endregion

		// region Point buy
		this._compAsi = new StatGenUiCompAsi({parent: this});
		// endregion

		this._isSettingStateFromOverwrite = false;
	}

	get MODES () { return this._MODES; }

	get ixActiveTab () { return this._getIxActiveTab(); }
	set ixActiveTab (ix) { this._setIxActiveTab({ixActiveTab: ix}); }

	// region Expose for external use
	addHookCustom (hook) { this.constructor._PROPS_CUSTOM.forEach(prop => this._addHookBase(prop, hook)); }

	addHookAbilityScores (hook) { Parser.ABIL_ABVS.forEach(ab => this._addHookBase(`common_export_${ab}`, hook)); }
	addHookPulseAsi (hook) { this._addHookBase("common_pulseAsi", hook); }
	getFormDataAsi () { return this._compAsi.getFormData(); }

	getMode (ix, namespace) {
		const {propMode} = this.getPropsAsi(ix, namespace);
		return this._state[propMode];
	}

	setIxFeat (ix, namespace, ixFeat) {
		const {propMode, propIxFeat} = this.getPropsAsi(ix, namespace);

		if (ixFeat == null && (this._state[propMode] === "asi" || this._state[propMode] == null)) {
			this._state[propIxFeat] = null;
			return;
		}

		this._state[propMode] = "feat";
		this._state[propIxFeat] = ixFeat;
	}

	setIxFeatSet (namespace, ixSet) {
		const {propIxSel} = this.getPropsAdditionalFeats_(namespace);
		this._state[propIxSel] = ixSet;
	}

	setIxFeatSetIxFeats (namespace, featsAdditionType, metaFeats) {
		const nxtState = {};
		metaFeats.forEach(({ix, ixFeat}) => {
			const {propIxFeat} = this.getPropsAdditionalFeatsFeatSet_(namespace, featsAdditionType, ix);
			nxtState[propIxFeat] = ixFeat;
		});
		this._proxyAssignSimple("state", nxtState);
	}

	set common_cntAsi (val) { this._state.common_cntAsi = val; }

	addHookIxRace (hook) { this._addHookBase("common_ixRace", hook); }
	get ixRace () { return this._state.common_ixRace; }
	set ixRace (ixRace) { this._state.common_ixRace = ixRace; }

	addHookIxBackground (hook) { this._addHookBase("common_ixBackground", hook); }
	get ixBackground () { return this._state.common_ixBackground; }
	set ixBackground (ixBackground) { this._state.common_ixBackground = ixBackground; }

	addCustomFeat () { this._state.common_cntFeatsCustom = Math.min(MAX_CUSTOM_FEATS, (this._state.common_cntFeatsCustom || 0) + 1); }
	setCntCustomFeats (val) { this._state.common_cntFeatsCustom = Math.min(MAX_CUSTOM_FEATS, val || 0); }
	// endregion

	// region Expose for ASI component
	get isCharacterMode () { return this._isCharacterMode; }
	get state () { return this._state; }
	get modalFilterFeats () { return this._modalFilterFeats; }
	get feats () { return this._feats; }
	addHookBase (prop, hook) { return this._addHookBase(prop, hook); }
	removeHookBase (prop, hook) { return this._removeHookBase(prop, hook); }
	proxyAssignSimple (hookProp, toObj, isOverwrite) { return this._proxyAssignSimple(hookProp, toObj, isOverwrite); }
	get race () { return this._races[this._state.common_ixRace]; }
	get background () { return this._backgrounds[this._state.common_ixBackground]; }
	get isLevelUp () { return this._isLevelUp; }
	isSettingStateFromOverwrite () { return this._isSettingStateFromOverwrite; }
	// endregion

	getTotals () {
		if (this._isLevelUp) {
			return {
				mode: "levelUp",
				totals: {
					levelUp: this._getTotals_levelUp(),
				},
			};
		}

		return {
			mode: this._MODES[this.ixActiveTab || 0],
			totals: {
				rolled: this._getTotals_rolled(),
				array: this._getTotals_array(),
				pointbuy: this._getTotals_pb(),
				manual: this._getTotals_manual(),
			},
		};
	}

	_getTotals_rolled () { return Parser.ABIL_ABVS.mergeMap(ab => ({[ab]: this._rolled_getTotalScore(ab)})); }
	_getTotals_array () { return Parser.ABIL_ABVS.mergeMap(ab => ({[ab]: this._array_getTotalScore(ab)})); }
	_getTotals_pb () { return Parser.ABIL_ABVS.mergeMap(ab => ({[ab]: this._pb_getTotalScore(ab)})); }
	_getTotals_manual () { return Parser.ABIL_ABVS.mergeMap(ab => ({[ab]: this._manual_getTotalScore(ab)})); }
	_getTotals_levelUp () { return Parser.ABIL_ABVS.mergeMap(ab => ({[ab]: this._levelUp_getTotalScore(ab)})); }

	addHook (hookProp, prop, hook) { return this._addHook(hookProp, prop, hook); }
	addHookAll (hookProp, hook) {
		this._addHookAll(hookProp, hook);
		this._compAsi._addHookAll(hookProp, hook);
	}

	addHookActiveTag (hook) { this._addHookActiveTab(hook); }

	async pInit () {
		await this._modalFilterRaces.pPopulateHiddenWrapper();
		await this._modalFilterBackgrounds.pPopulateHiddenWrapper();
		await this._modalFilterFeats.pPopulateHiddenWrapper();
	}

	getPropsAsi (ix, namespace) {
		return {
			prefix: `common_asi_${namespace}_${ix}_`,
			propMode: `common_asi_${namespace}_${ix}_mode`,
			propIxAsiPointOne: `common_asi_${namespace}_${ix}_asiPointOne`,
			propIxAsiPointTwo: `common_asi_${namespace}_${ix}_asiPointTwo`,
			propIxFeat: `common_asi_${namespace}_${ix}_ixFeat`,
			propIxFeatAbility: `common_asi_${namespace}_${ix}_ixFeatAbility`,
			propFeatAbilityChooseFrom: `common_asi_${namespace}_${ix}_featAbilityChooseFrom`,

			// region Serialization/deserialization
			propSaveLoadFeatHash: `_common_asi_${namespace}_${ix}_hash`,
			// endregion
		};
	}

	getPropsAdditionalFeats_ (namespace) {
		return {
			propPrefix: `common_additionalFeats_${namespace}_`,
			propIxSel: `common_additionalFeats_${namespace}_ixSel`,
		};
	}

	getPropsAdditionalFeatsFeatSet_ (namespace, featsAdditionType, ix) {
		return {
			propIxFeat: `common_additionalFeats_${namespace}_${featsAdditionType}_${ix}_ixFeat`,
			propIxFeatAbility: `common_additionalFeats_${namespace}_${featsAdditionType}_${ix}_ixFeatAbility`,
			propFeatAbilityChooseFrom: `common_additionalFeats_${namespace}_${featsAdditionType}_${ix}_featAbilityChooseFrom`,
		};
	}

	async _roll_pGetRolledStats () {
		const wrpTree = Renderer.dice.lang.getTree3(this._state.rolled_formula);
		if (!wrpTree) {
			this._rollIptFormula.addClass("form-control--error");
			return;
		}

		const rolls = [];
		for (let i = 0; i < this._state.rolled_rollCount; i++) {
			const meta = {};
			meta.total = wrpTree.tree.evl(meta);
			rolls.push(meta);
		}
		rolls.sort((a, b) => SortUtil.ascSort(b.total, a.total));

		return rolls.map(r => ({total: r.total, txt: (r.text || []).join("")}));
	}

	render (parent) {
		parent.empty().addClass("statgen");

		const iptTabMetas = this._isLevelUp
			? [
				new TabUiUtil.TabMeta({name: "Existing", icon: this._isFvttMode ? `fas fa-fw fa-user` : `far fa-fw fa-user`, hasBorder: true}),
				...this._tabMetasAdditional || [],
			]
			: [
				this._isFvttMode ? new TabUiUtil.TabMeta({name: "Select...", icon: this._isFvttMode ? `fas fa-fw fa-square` : `far fa-fw fa-square`, hasBorder: true, isNoPadding: this._isFvttMode}) : null,
				new TabUiUtil.TabMeta({name: "Roll", icon: this._isFvttMode ? `fas fa-fw fa-dice` : `far fa-fw fa-dice`, hasBorder: true, isNoPadding: this._isFvttMode}),
				new TabUiUtil.TabMeta({name: "Standard Array", icon: this._isFvttMode ? `fas fa-fw fa-signal` : `far fa-fw fa-signal-bars`, hasBorder: true, isNoPadding: this._isFvttMode}),
				new TabUiUtil.TabMeta({name: "Point Buy", icon: this._isFvttMode ? `fas fa-fw fa-chart-bar` : `far fa-fw fa-chart-bar`, hasBorder: true, isNoPadding: this._isFvttMode}),
				new TabUiUtil.TabMeta({name: "Manual", icon: this._isFvttMode ? `fas fa-fw fa-screwdriver-wrench` : `far fa-fw fa-screwdriver-wrench`, hasBorder: true, isNoPadding: this._isFvttMode}),
				...this._tabMetasAdditional || [],
			].filter(Boolean);

		const tabMetas = this._renderTabs(iptTabMetas, {eleParent: this._isFvttMode ? null : parent});
		if (this._isFvttMode) {
			if (!this._isLevelUp) {
				const {propActive: propActiveTab, propProxy: propProxyTabs} = this._getTabProps();
				const selMode = ComponentUiUtil.getSelEnum(
					this,
					propActiveTab,
					{
						values: iptTabMetas.map((_, ix) => ix),
						fnDisplay: ix => iptTabMetas[ix].name,
						propProxy: propProxyTabs,
					},
				)
					.addClass("max-w-200p");
				ee`<div class="ve-flex-v-center statgen-shared__wrp-header">
					<div class="mr-2"><b>Mode</b></div>
					${selMode}
				</div>`
					.appendTo(parent);
				ee`<hr class="hr-2">`
					.appendTo(parent);
			}

			tabMetas.forEach(it => it.wrpTab.appendTo(parent));
		}

		const wrpAll = ee`<div class="ve-flex-col w-100 h-100"></div>`;
		this._render_all(wrpAll);

		const hkTab = () => {
			tabMetas[this.ixActiveTab || 0].wrpTab.appends(wrpAll);
		};
		this._addHookActiveTab(hkTab);
		hkTab();

		this._addHookBase("common_cntAsi", () => this._state.common_pulseAsi = !this._state.common_pulseAsi);
		this._addHookBase("common_cntFeatsCustom", () => this._state.common_pulseAsi = !this._state.common_pulseAsi);
	}

	_render_getStgRolledHeader () {
		this._rollIptFormula = ComponentUiUtil.getIptStr(this, "rolled_formula")
			.addClass("ve-text-center")
			.addClass("max-w-100p")
			.onn("keydown", evt => {
				if (evt.key === "Enter") setTimeout(() => btnRoll.trigger("click")); // Defer to allow `.change` to fire first
			})
			.onn("change", () => this._rollIptFormula.removeClass("form-control--error"));

		const iptRollCount = this._isCharacterMode ? null : ComponentUiUtil.getIptInt(this, "rolled_rollCount", 1, {min: 1, fallbackOnNaN: 1, html: `<input type="text" class="form-control input-xs form-control--minimal ve-text-center max-w-100p">`})
			.onn("keydown", evt => {
				if (evt.key === "Enter") setTimeout(() => btnRoll.trigger("click")); // Defer to allow `.change` to fire first
			})
			.onn("change", () => this._rollIptFormula.removeClass("form-control--error"));

		const lockRoll = new VeLock();
		const btnRoll = ee`<button class="ve-btn ve-btn-primary bold">Roll</button>`
			.onn("click", async () => {
				try {
					await lockRoll.pLock();
					this._state.rolled_rolls = await this._roll_pGetRolledStats();
				} finally {
					lockRoll.unlock();
				}
			});

		const btnRandom = ee`<button class="ve-btn ve-btn-xs ve-btn-default mt-2">Randomly Assign</button>`
			.hideVe()
			.onn("click", () => {
				const abs = [...Parser.ABIL_ABVS].shuffle();
				abs.forEach((ab, i) => {
					const {propAbilSelectedRollIx} = this.constructor._rolled_getProps(ab);
					this._state[propAbilSelectedRollIx] = i;
				});
			});

		const wrpRolled = ee`<div class="ve-flex-v-center mr-auto statgen-rolled__wrp-results py-1"></div>`;
		const wrpTotal = ee`<div class="ve-muted ve-small italic ve-text-right pr-1 help-subtle" title="The sum total of the above rolls."></div>`;
		const wrpRolledOuter = ee`<div class="ve-flex-col">
			<div class="ve-flex-v-center mb-1"><div class="mr-2">=</div>${wrpRolled}</div>
			${wrpTotal}
		</div>`;

		const hkRolled = () => {
			wrpRolledOuter.toggleVe(this._state.rolled_rolls.length);
			btnRandom.toggleVe(this._state.rolled_rolls.length);

			wrpRolled.html(this._state.rolled_rolls.map((it, i) => {
				const cntPrevRolls = this._state.rolled_rolls.slice(0, i).filter(r => r.total === it.total).length;
				return `<div class="px-3 py-1 help-subtle ve-flex-vh-center" title="${it.text}"><div class="ve-muted">[</div><div class="ve-flex-vh-center statgen-rolled__disp-result">${it.total}${cntPrevRolls ? Parser.numberToSubscript(cntPrevRolls) : ""}</div><div class="ve-muted">]</div></div>`;
			}));
			wrpTotal.txt(`Total: ${this._state.rolled_rolls.map(roll => roll.total).sum()}`);
		};
		this._addHookBase("rolled_rolls", hkRolled);
		hkRolled();

		return ee`<div class="ve-flex-col mb-3 mr-auto">
			<div class="ve-flex mb-2">
				<div class="ve-flex-col ve-flex-h-center mr-3">
					<label class="ve-flex-v-center"><div class="mr-2 no-shrink w-100p">Formula:</div>${this._rollIptFormula}</label>

					${this._isCharacterMode ? null : ee`<label class="ve-flex-v-center mt-2"><div class="mr-2 no-shrink w-100p">Number of rolls:</div>${iptRollCount}</label>`}
				</div>
				${btnRoll}
			</div>

			${wrpRolledOuter}

			<div class="ve-flex-v-center">${btnRandom}</div>
		</div>`;
	}

	_render_getStgArrayHeader () {
		const btnRandom = ee`<button class="ve-btn ve-btn-xs ve-btn-default">Randomly Assign</button>`
			.onn("click", () => {
				const abs = [...Parser.ABIL_ABVS].shuffle();
				abs.forEach((ab, i) => {
					const {propAbilSelectedScoreIx} = this.constructor._array_getProps(ab);
					this._state[propAbilSelectedScoreIx] = i;
				});
			});

		return ee`<div class="ve-flex-col mb-3 mr-auto">
			<div class="mb-2">Assign these numbers to your abilities as desired:</div>
			<div class="bold mb-2">${StatGenUi._STANDARD_ARRAY.join(", ")}</div>
			<div class="ve-flex">${btnRandom}</div>
		</div>`;
	}

	_render_getStgManualHeader () {
		return ee`<div class="ve-flex-col mb-3 mr-auto">
			<div>Enter your desired ability scores in the &quot;Base&quot; column below.</div>
		</div>`;
	}

	_doReset () {
		if (this._isLevelUp) return; // Should never occur

		const nxtState = this._getDefaultStateCommonResettable();

		switch (this.ixActiveTab) {
			case this._IX_TAB_NONE: Object.assign(nxtState, this._getDefaultStateNoneResettable()); break;
			case this._IX_TAB_ROLLED: Object.assign(nxtState, this._getDefaultStateRolledResettable()); break;
			case this._IX_TAB_ARRAY: Object.assign(nxtState, this._getDefaultStateArrayResettable()); break;
			case this._IX_TAB_PB: Object.assign(nxtState, this._getDefaultStatePointBuyResettable()); break;
			case this._IX_TAB_MANUAL: Object.assign(nxtState, this._getDefaultStateManualResettable()); break;
		}

		this._proxyAssignSimple("state", nxtState);
	}

	doResetAll () {
		this._proxyAssignSimple("state", this._getDefaultState(), true);
	}

	_render_getStgPbHeader () {
		const iptBudget = ComponentUiUtil.getIptInt(
			this,
			"pb_budget",
			0,
			{
				html: `<input type="text" class="form-control statgen-pb__ipt-budget ve-text-center statgen-shared__ipt">`,
				min: 0,
				fallbackOnNaN: 0,
			},
		);
		const hkIsCustom = () => {
			iptBudget.attr("readonly", !this._state.pb_isCustom);
		};
		this._addHookBase("pb_isCustom", hkIsCustom);
		hkIsCustom();

		const iptRemaining = ComponentUiUtil.getIptInt(
			this,
			"pb_points",
			0,
			{
				html: `<input type="text" class="form-control statgen-pb__ipt-budget ve-text-center statgen-shared__ipt">`,
				min: 0,
				fallbackOnNaN: 0,
			},
		).attr("readonly", true);

		const hkPoints = () => {
			this._state.pb_points = this._pb_getPointsRemaining(this._state);
			iptRemaining.toggleClass(`statgen-pb__ipt-budget--error`, this._state.pb_points < 0);
		};
		this._addHookAll("state", hkPoints);
		hkPoints();

		const btnReset = ee`<button class="ve-btn ve-btn-default">Reset</button>`
			.onn("click", () => this._doReset());

		const btnRandom = ee`<button class="ve-btn ve-btn-default">Random</button>`
			.onn("click", () => {
				this._doReset();

				let canIncrease = Parser.ABIL_ABVS.map(it => `pb_${it}`);
				const cpyBaseState = canIncrease.mergeMap(it => ({[it]: this._state[it]}));
				const cntRemaining = this._pb_getPointsRemaining(cpyBaseState);
				if (cntRemaining <= 0) return;

				for (let step = 0; step < 10000; ++step) {
					if (!canIncrease.length) break;

					const prop = RollerUtil.rollOnArray(canIncrease);
					if (!this._state.pb_rules.some(rule => rule.entity.score === cpyBaseState[prop] + 1)) {
						canIncrease = canIncrease.filter(it => it !== prop);
						continue;
					}

					const draftCpyBaseState = MiscUtil.copy(cpyBaseState);
					draftCpyBaseState[prop]++;

					const cntRemaining = this._pb_getPointsRemaining(draftCpyBaseState);

					if (cntRemaining > 0) {
						Object.assign(cpyBaseState, draftCpyBaseState);
					} else if (cntRemaining === 0) {
						this._proxyAssignSimple("state", draftCpyBaseState);
						break;
					} else {
						canIncrease = canIncrease.filter(it => it !== prop);
					}
				}
			});

		return ee`<div class="ve-flex mobile-sm__ve-flex-col mb-2">
			<div class="ve-flex-v-center">
				<div class="statgen-pb__cell mr-4 mobile-sm__hidden"></div>

				<label class="ve-flex-col mr-2">
					<div class="mb-1 ve-text-center">Budget</div>
					${iptBudget}
				</label>

				<label class="ve-flex-col mr-2">
					<div class="mb-1 ve-text-center">Remain</div>
					${iptRemaining}
				</label>
			</div>

			<div class="ve-flex-v-center mobile-sm__mt-2">
				<div class="ve-flex-col mr-2">
					<div class="mb-1 ve-text-center mobile-sm__hidden">&nbsp;</div>
					${btnReset}
				</div>

				<div class="ve-flex-col">
					<div class="mb-1 ve-text-center mobile-sm__hidden">&nbsp;</div>
					${btnRandom}
				</div>
			</div>
		</div>`;
	}

	_render_getStgPbCustom () {
		const btnAddLower = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Add Lower Score</button>`
			.onn("click", () => {
				const prevSecondLowest = this._state.pb_rules[1];
				const prevLowest = this._state.pb_rules[0];
				const score = prevLowest.entity.score - 1;
				const deltaCostEstimate = prevSecondLowest ? prevLowest.entity.cost - prevSecondLowest.entity.cost : null;
				const deltaCost = deltaCostEstimate != null && deltaCostEstimate <= 0 ? deltaCostEstimate : 0;
				const cost = Math.max(prevLowest.entity.cost + deltaCost, 0);
				this._state.pb_rules = [this._getDefaultState_pb_rule(score, cost), ...this._state.pb_rules];
			});

		const btnAddHigher = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Add Higher Score</button>`
			.onn("click", () => {
				const prevSecondHighest = this._state.pb_rules.at(-2);
				const prevHighest = this._state.pb_rules.at(-1);
				const score = prevHighest.entity.score + 1;
				const deltaCostEstimate = prevSecondHighest ? prevHighest.entity.cost - prevSecondHighest.entity.cost : null;
				const deltaCost = deltaCostEstimate != null && deltaCostEstimate >= 0 ? deltaCostEstimate : 1;
				const cost = prevHighest.entity.cost + deltaCost;
				this._state.pb_rules = [...this._state.pb_rules, this._getDefaultState_pb_rule(score, cost)];
			});

		const btnResetRules = ee`<button class="ve-btn ve-btn-danger ve-btn-xs mr-2">Reset</button>`
			.onn("click", () => {
				this._state.pb_rules = this._getDefaultStatePointBuyCosts().pb_rules;
			});

		const menuCustom = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Export as Code",
				async () => {
					await MiscUtil.pCopyTextToClipboard(this._serialize_pb_rules());
					JqueryUtil.showCopiedEffect(btnContext);
				},
			),
			new ContextUtil.Action(
				"Import from Code",
				async () => {
					const raw = await InputUiUtil.pGetUserString({title: "Enter Code", isCode: true});
					if (raw == null) return;
					const parsed = this._deserialize_pb_rules(raw);
					if (parsed == null) return;

					const {pb_rules, pb_budget} = parsed;
					this._proxyAssignSimple(
						"state",
						{
							pb_rules,
							pb_budget,
							pb_isCustom: true,
						},
					);
					JqueryUtil.doToast("Imported!");
				},
			),
		]);

		const btnContext = ee`<button class="ve-btn ve-btn-default ve-btn-xs" title="Menu"><span class="glyphicon glyphicon-option-vertical"></span></button>`
			.onn("click", evt => ContextUtil.pOpenMenu(evt, menuCustom));

		const stgCustomCostControls = ee`<div class="ve-flex-col mb-auto ml-2 mobile-sm__ml-0 mobile-sm__mt-3">
			<div class="ve-btn-group-vertical ve-flex-col mb-2">${btnAddLower}${btnAddHigher}</div>
			<div class="ve-flex-v-center">
				${btnResetRules}
				${btnContext}
			</div>
		</div>`;

		const stgCostRows = ee`<div class="ve-flex-col"></div>`;

		const renderableCollectionRules = new StatGenUiRenderableCollectionPbRules(
			this,
			stgCostRows,
		);
		const hkRules = () => {
			renderableCollectionRules.render();

			// region Clamp values between new min/max scores
			const {min: minScore, max: maxScore} = this._pb_getMinMaxScores();
			Parser.ABIL_ABVS.forEach(it => {
				const prop = `pb_${it}`;
				this._state[prop] = Math.min(maxScore, Math.max(minScore, this._state[prop]));
			});
			// endregion
		};
		this._addHookBase("pb_rules", hkRules);
		hkRules();

		let lastIsCustom = this._state.pb_isCustom;
		const hkIsCustomReset = () => {
			stgCustomCostControls.toggleVe(this._state.pb_isCustom);

			if (lastIsCustom === this._state.pb_isCustom) return;
			lastIsCustom = this._state.pb_isCustom;

			// On resetting to non-custom, reset the rules
			if (!this._state.pb_isCustom) this._state.pb_rules = this._getDefaultStatePointBuyCosts().pb_rules;
		};
		this._addHookBase("pb_isCustom", hkIsCustomReset);
		hkIsCustomReset();

		return ee`<div class="ve-flex-col">
			<h4>Ability Score Point Cost</h4>

			<div class="ve-flex-col">
				<div class="ve-flex mobile-sm__ve-flex-col">
					<div class="ve-flex-col mr-3mobile-sm__mr-0">
						<div class="ve-flex-v-center mb-1">
							<div class="statgen-pb__col-cost ve-flex-vh-center bold">Score</div>
							<div class="statgen-pb__col-cost ve-flex-vh-center bold">Modifier</div>
							<div class="statgen-pb__col-cost ve-flex-vh-center bold">Point Cost</div>
							<div class="statgen-pb__col-cost-delete"></div>
						</div>

						${stgCostRows}
					</div>

					${stgCustomCostControls}
				</div>
			</div>

			<hr class="hr-4 mb-2">

			<label class="ve-flex-v-center">
				<div class="mr-2">Custom Rules</div>
				${ComponentUiUtil.getCbBool(this, "pb_isCustom")}
			</label>
		</div>`;
	}

	_serialize_pb_rules () {
		const out = [
			this._state.pb_budget,
			...MiscUtil.copyFast(this._state.pb_rules).map(it => [it.entity.score, it.entity.cost]),
		];
		return JSON.stringify(out);
	}

	static _DESERIALIZE_MSG_INVALID = "Code was not valid!";

	_deserialize_pb_rules (raw) {
		let json;
		try {
			json = JSON.parse(raw);
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to decode JSON! ${e.message}`});
			return null;
		}

		if (!(json instanceof Array)) return void JqueryUtil.doToast({type: "danger", content: this.constructor._DESERIALIZE_MSG_INVALID});

		const [budget, ...rules] = json;

		if (isNaN(budget)) return void JqueryUtil.doToast({type: "danger", content: this.constructor._DESERIALIZE_MSG_INVALID});

		if (
			!rules
				.every(it => it instanceof Array && it[0] != null && !isNaN(it[0]) && it[1] != null && !isNaN(it[1]))
		) return void JqueryUtil.doToast({type: "danger", content: this.constructor._DESERIALIZE_MSG_INVALID});

		return {
			pb_budget: budget,
			pb_rules: rules.map(it => this._getDefaultState_pb_rule(it[0], it[1])),
		};
	}

	_render_all (wrpTab) {
		if (this._isLevelUp) return this._render_isLevelUp(wrpTab);
		this._render_isLevelOne(wrpTab);
	}

	_render_isLevelOne (wrpTab) {
		let stgNone;
		let stgMain;
		const elesRolled = [];
		const elesArray = [];
		const elesPb = [];
		const elesManual = [];

		// region Rolled header
		const stgRolledHeader = this._render_getStgRolledHeader();
		const hkStgRolled = () => stgRolledHeader.toggleVe(this.ixActiveTab === this._IX_TAB_ROLLED);
		this._addHookActiveTab(hkStgRolled);
		hkStgRolled();
		// endregion

		// region Point Buy stages
		const stgPbHeader = this._render_getStgPbHeader();
		const stgPbCustom = this._render_getStgPbCustom();
		const vrPbCustom = ee`<div class="vr-5 mobile-lg__hidden"></div>`;
		const hrPbCustom = ee`<hr class="hr-5 mobile-lg__visible">`;
		const hkStgPb = () => {
			stgPbHeader.toggleVe(this.ixActiveTab === this._IX_TAB_PB);
			stgPbCustom.toggleVe(this.ixActiveTab === this._IX_TAB_PB);
			vrPbCustom.toggleVe(this.ixActiveTab === this._IX_TAB_PB);
			hrPbCustom.toggleVe(this.ixActiveTab === this._IX_TAB_PB);
		};
		this._addHookActiveTab(hkStgPb);
		hkStgPb();
		// endregion

		// region Array header
		const stgArrayHeader = this._render_getStgArrayHeader();
		const hkStgArray = () => stgArrayHeader.toggleVe(this.ixActiveTab === this._IX_TAB_ARRAY);
		this._addHookActiveTab(hkStgArray);
		hkStgArray();
		// endregion

		// region Manual header
		const stgManualHeader = this._render_getStgManualHeader();
		const hkStgManual = () => stgManualHeader.toggleVe(this.ixActiveTab === this._IX_TAB_MANUAL);
		this._addHookActiveTab(hkStgManual);
		hkStgManual();
		// endregion

		// region Other elements
		const hkElesMode = () => {
			stgNone.toggleVe(this.ixActiveTab === this._IX_TAB_NONE);
			stgMain.toggleVe(this.ixActiveTab !== this._IX_TAB_NONE);

			elesRolled.forEach(ele => ele.toggleVe(this.ixActiveTab === this._IX_TAB_ROLLED));
			elesArray.forEach(ele => ele.toggleVe(this.ixActiveTab === this._IX_TAB_ARRAY));
			elesPb.forEach(ele => ele.toggleVe(this.ixActiveTab === this._IX_TAB_PB));
			elesManual.forEach(ele => ele.toggleVe(this.ixActiveTab === this._IX_TAB_MANUAL));
		};
		this._addHookActiveTab(hkElesMode);
		// endregion

		const btnResetRolledOrArrayOrManual = ee`<button class="ve-btn ve-btn-default ve-btn-xxs relative statgen-shared__btn-reset" title="Reset"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", () => this._doReset());
		const hkRolledOrArray = () => btnResetRolledOrArrayOrManual.toggleVe(this.ixActiveTab === this._IX_TAB_ROLLED || this.ixActiveTab === this._IX_TAB_ARRAY || this.ixActiveTab === this._IX_TAB_MANUAL);
		this._addHookActiveTab(hkRolledOrArray);
		hkRolledOrArray();

		const wrpsBase = Parser.ABIL_ABVS.map(ab => {
			// region Rolled
			const {propAbilSelectedRollIx} = this.constructor._rolled_getProps(ab);

			const selRolled = ee`<select class="form-control input-xs form-control--minimal statgen-shared__ipt statgen-shared__ipt--sel"></select>`
				.onn("change", () => {
					const ix = Number(selRolled.val());

					const nxtState = {
						...Parser.ABIL_ABVS
							.map(ab => this.constructor._rolled_getProps(ab).propAbilSelectedRollIx)
							.filter(prop => ix != null && this._state[prop] === ix)
							.mergeMap(prop => ({[prop]: null})),
						[propAbilSelectedRollIx]: ~ix ? ix : null,
					};
					this._proxyAssignSimple("state", nxtState);
				});
			e_({tag: "option", value: -1, txt: "\u2014"}).appendTo(selRolled);

			let optionsRolled = [];
			const hkRolls = () => {
				optionsRolled.forEach(opt => opt.remove());

				this._state.rolled_rolls.forEach((it, i) => {
					const cntPrevRolls = this._state.rolled_rolls.slice(0, i).filter(r => r.total === it.total).length;
					const opt = e_({tag: "option", value: i, txt: `${it.total}${cntPrevRolls ? Parser.numberToSubscript(cntPrevRolls) : ""}`}).appendTo(selRolled);
					optionsRolled.push(opt);
				});

				let nxtSelIx = this._state[propAbilSelectedRollIx];
				if (nxtSelIx >= this._state.rolled_rolls.length) nxtSelIx = null;
				selRolled.val(`${nxtSelIx == null ? -1 : nxtSelIx}`);
				if ((nxtSelIx) !== this._state[propAbilSelectedRollIx]) this._state[propAbilSelectedRollIx] = nxtSelIx;
			};
			this._addHookBase("rolled_rolls", hkRolls);
			hkRolls();

			const hookIxRolled = () => {
				const ix = this._state[propAbilSelectedRollIx] == null ? -1 : this._state[propAbilSelectedRollIx];
				selRolled.val(`${ix}`);
			};
			this._addHookBase(propAbilSelectedRollIx, hookIxRolled);
			hookIxRolled();

			elesRolled.push(selRolled);
			// endregion

			// region Array
			const {propAbilSelectedScoreIx} = this.constructor._array_getProps(ab);

			const selArray = ee`<select class="form-control input-xs form-control--minimal statgen-shared__ipt statgen-shared__ipt--sel"></select>`
				.onn("change", () => {
					const ix = Number(selArray.val());

					const nxtState = {
						...Parser.ABIL_ABVS
							.map(ab => this.constructor._array_getProps(ab).propAbilSelectedScoreIx)
							.filter(prop => ix != null && this._state[prop] === ix)
							.mergeMap(prop => ({[prop]: null})),
						[propAbilSelectedScoreIx]: ~ix ? ix : null,
					};
					this._proxyAssignSimple("state", nxtState);
				});
			e_({tag: "option", value: -1, txt: "\u2014"}).appendTo(selArray);

			StatGenUi._STANDARD_ARRAY.forEach((it, i) => e_({tag: "option", value: i, txt: it}).appendTo(selArray));

			const hookIxArray = () => {
				const ix = this._state[propAbilSelectedScoreIx] == null ? -1 : this._state[propAbilSelectedScoreIx];
				selArray.val(`${ix}`);
			};
			this._addHookBase(propAbilSelectedScoreIx, hookIxArray);
			hookIxArray();

			elesArray.push(selArray);
			// endregion

			// region Point buy
			const propPb = `pb_${ab}`;
			const iptPb = ComponentUiUtil.getIptInt(
				this,
				propPb,
				0,
				{
					fallbackOnNaN: 0,
					min: 0,
					html: `<input class="form-control form-control--minimal statgen-shared__ipt ve-text-right" type="number">`,
				},
			);

			const hkPb = () => {
				const {min: minScore, max: maxScore} = this._pb_getMinMaxScores();
				this._state[propPb] = Math.min(maxScore, Math.max(minScore, this._state[propPb]));
			};
			this._addHookBase(propPb, hkPb);
			hkPb();

			elesPb.push(iptPb);
			// endregion

			// region Manual
			const {propAbilValue} = this.constructor._manual_getProps(ab);
			const iptManual = ComponentUiUtil.getIptInt(
				this,
				propAbilValue,
				0,
				{
					fallbackOnNaN: 0,
					html: `<input class="form-control form-control--minimal statgen-shared__ipt ve-text-right" type="number">`,
				},
			);

			elesManual.push(iptManual);
			// endregion

			return ee`<label class="my-1 statgen-pb__cell">
				${selRolled}
				${selArray}
				${iptPb}
				${iptManual}
			</label>`;
		});

		const wrpsUser = this._render_getWrpsUser();

		const metasTotalAndMod = this._render_getMetasTotalAndMod();

		const {
			wrpOuter: wrpRaceOuter,
			stgSel: stgRaceSel,
			dispPreview: dispPreviewRace,
			hrPreview: hrPreviewRaceTashas,
			dispTashas,
		} = this._renderLevelOneRace.render();

		const {
			wrpOuter: wrpBackgroundOuter,
			stgSel: stgBackgroundSel,
			dispPreview: dispPreviewBackground,
			hrPreview: hrPreviewBackground,
		} = this._renderLevelOneBackground.render();

		const wrpAsi = this._render_getWrpAsi();

		stgNone = ee`<div class="ve-flex-col w-100 h-100">
			<div class="ve-flex-v-center"><i>Please select a mode.</i></div>
		</div>`;

		stgMain = ee`<div class="ve-flex-col w-100 h-100">
			${stgRolledHeader}
			${stgArrayHeader}
			${stgManualHeader}

			<div class="ve-flex mobile-lg__ve-flex-col w-100 px-3">
				<div class="ve-flex-col">
					${stgPbHeader}

					<div class="ve-flex">
						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header"></div>
							<div class="my-1 statgen-pb__header ve-flex-h-right">${btnResetRolledOrArrayOrManual}</div>

							${Parser.ABIL_ABVS.map(it => `<div class="my-1 bold statgen-pb__cell ve-flex-v-center ve-flex-h-right" title="${Parser.attAbvToFull(it)}">${it.toUpperCase()}</div>`)}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header"></div>
							<div class="my-1 bold statgen-pb__header ve-flex-vh-center">Base</div>
							${wrpsBase}
						</div>

						${wrpBackgroundOuter}
						${wrpRaceOuter}

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header"></div>
							<div class="my-1 statgen-pb__header ve-flex-vh-center help ve-muted" title="Input any additional/custom bonuses here">User</div>
							${wrpsUser}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header"></div>
							<div class="my-1 statgen-pb__header ve-flex-vh-center">Total</div>
							${metasTotalAndMod.map(it => it.wrpIptTotal)}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header"></div>
							<div class="my-1 statgen-pb__header ve-flex-vh-center" title="Modifier">Mod.</div>
							${metasTotalAndMod.map(it => it.wrpIptMod)}
						</div>
					</div>

					${stgBackgroundSel}
					${stgRaceSel}
				</div>

				${vrPbCustom}
				${hrPbCustom}

				${stgPbCustom}
			</div>

			<hr class="hr-3">

			${dispPreviewBackground}

			${hrPreviewBackground}

			${dispPreviewRace}
			${hrPreviewRaceTashas}
			${dispTashas}

			${wrpAsi}
		</div>`;

		hkElesMode();

		wrpTab
			.appends(stgMain)
			.appends(stgNone);
	}

	_renderLevelOneRace = new StatGenUiRenderLevelOneRace({parent: this});

	_renderLevelOneBackground = new StatGenUiRenderLevelOneBackground({parent: this});

	_render_isLevelUp (wrpTab) {
		const wrpsExisting = Parser.ABIL_ABVS.map(ab => {
			const iptExisting = ee`<input class="form-control form-control--minimal statgen-shared__ipt ve-text-right" type="number" readonly>`
				.val(this._existingScores[ab]);

			return ee`<label class="my-1 statgen-pb__cell">
				${iptExisting}
			</label>`;
		});

		const wrpsUser = this._render_getWrpsUser();

		const metasTotalAndMod = this._render_getMetasTotalAndMod();

		const wrpAsi = this._render_getWrpAsi();

		ee(wrpTab)`
			<div class="ve-flex mobile-lg__ve-flex-col w-100 px-3">
				<div class="ve-flex-col">
					<div class="ve-flex">
						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header"></div>

							${Parser.ABIL_ABVS.map(it => `<div class="my-1 bold statgen-pb__cell ve-flex-v-center ve-flex-h-right" title="${Parser.attAbvToFull(it)}">${it.toUpperCase()}</div>`)}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 bold statgen-pb__header ve-flex-vh-center" title="Current">Curr.</div>
							${wrpsExisting}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header ve-flex-vh-center help ve-muted" title="Input any additional/custom bonuses here">User</div>
							${wrpsUser}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header ve-flex-vh-center">Total</div>
							${metasTotalAndMod.map(it => it.wrpIptTotal)}
						</div>

						<div class="ve-flex-col mr-3">
							<div class="my-1 statgen-pb__header ve-flex-vh-center" title="Modifier">Mod.</div>
							${metasTotalAndMod.map(it => it.wrpIptMod)}
						</div>
					</div>
				</div>
			</div>

			<hr class="hr-3">

			${wrpAsi}
		`;
	}

	_render_getWrpsUser () {
		return Parser.ABIL_ABVS.map(ab => {
			const {propUserBonus} = this.constructor._common_getProps(ab);
			const ipt = ComponentUiUtil.getIptInt(
				this,
				propUserBonus,
				0,
				{
					fallbackOnNaN: 0,
					html: `<input class="form-control form-control--minimal statgen-shared__ipt ve-text-right" type="number">`,
				},
			);
			return ee`<label class="my-1 statgen-pb__cell">${ipt}</label>`;
		});
	}

	_render_getMetasTotalAndMod () {
		return Parser.ABIL_ABVS.map(ab => {
			const iptTotal = ee`<input class="form-control form-control--minimal statgen-shared__ipt ve-text-center" type="text" readonly>`;
			const iptMod = ee`<input class="form-control form-control--minimal statgen-shared__ipt ve-text-center" type="text" readonly>`;

			const wrpIptTotal = ee`<label class="my-1 statgen-pb__cell">${iptTotal}</label>`;
			const wrpIptMod = ee`<label class="my-1 statgen-pb__cell">${iptMod}</label>`;

			const exportedStateProp = `common_export_${ab}`;

			const getTotalScore = () => {
				if (this._isLevelUp) return this._levelUp_getTotalScore(ab);
				switch (this.ixActiveTab) {
					case this._IX_TAB_ROLLED: return this._rolled_getTotalScore(ab);
					case this._IX_TAB_ARRAY: return this._array_getTotalScore(ab);
					case this._IX_TAB_PB: return this._pb_getTotalScore(ab);
					case this._IX_TAB_MANUAL: return this._manual_getTotalScore(ab);
					default: return 0;
				}
			};

			const hk = () => {
				const totalScore = getTotalScore();

				const isOverLimit = totalScore > 20;
				iptTotal
					.val(totalScore)
					.toggleClass("form-control--error", isOverLimit)
					.tooltip(isOverLimit ? `In general, you can't increase an ability score above 20.` : "");
				iptMod.val(Parser.getAbilityModifier(totalScore));

				this._state[exportedStateProp] = totalScore;
			};
			this._addHookAll("state", hk);
			this._addHookActiveTab(hk);
			hk();

			return {
				wrpIptTotal,
				wrpIptMod,
			};
		});
	}

	_render_getWrpAsi () {
		const wrpAsi = ee`<div class="ve-flex-col w-100"></div>`;
		this._compAsi.render(wrpAsi);
		return wrpAsi;
	}

	static _common_getProps (ab) {
		return {
			propUserBonus: `${StatGenUi._PROP_PREFIX_COMMON}${ab}_user`,
		};
	}

	static _rolled_getProps (ab) {
		return {
			propAbilSelectedRollIx: `${StatGenUi._PROP_PREFIX_ROLLED}${ab}_abilSelectedRollIx`,
		};
	}

	static _array_getProps (ab) {
		return {
			propAbilSelectedScoreIx: `${StatGenUi._PROP_PREFIX_ARRAY}${ab}_abilSelectedScoreIx`,
		};
	}

	static _manual_getProps (ab) {
		return {
			propAbilValue: `${StatGenUi._PROP_PREFIX_MANUAL}${ab}_abilValue`,
		};
	}

	_pb_getRaceAbilityList () {
		const race = this.race;
		if (!race?.ability?.length) return null;

		return race.ability
			.map(fromRace => {
				if (
					this._state.common_isTashas
					&& this._state.common_isAllowTashasRules
				) {
					const weights = [];

					if (fromRace.choose && fromRace.choose.weighted && fromRace.choose.weighted.weights) {
						weights.push(...fromRace.choose.weighted.weights);
					}

					Parser.ABIL_ABVS.forEach(it => {
						if (fromRace[it]) weights.push(fromRace[it]);
					});

					if (fromRace.choose && fromRace.choose.from) {
						const count = fromRace.choose.count || 1;
						const amount = fromRace.choose.amount || 1;
						for (let i = 0; i < count; ++i) weights.push(amount);
					}

					weights.sort((a, b) => SortUtil.ascSort(b, a));

					fromRace = {
						choose: {
							weighted: {
								from: [...Parser.ABIL_ABVS],
								weights,
							},
						},
					};
				}

				return fromRace;
			});
	}

	_pb_getBackgroundAbilityList () {
		const background = this.background;
		if (!background?.ability?.length) return null;
		return background.ability;
	}

	_pb_getRaceAbility () {
		return this._pb_getRaceAbilityList()?.[this._state.common_ixAbilityScoreSetRace || 0];
	}

	_pb_getBackgroundAbility () {
		return this._pb_getBackgroundAbilityList()?.[this._state.common_ixAbilityScoreSetBackground || 0];
	}

	_pb_getPointsRemaining (baseState) {
		const spent = Parser.ABIL_ABVS.map(it => {
			const prop = `pb_${it}`;
			const score = baseState[prop];
			const rule = this._state.pb_rules.find(it => it.entity.score === score);
			if (!rule) return 0;
			return rule.entity.cost;
		}).reduce((a, b) => a + b, 0);

		return this._state.pb_budget - spent;
	}

	_rolled_getTotalScore (ab) {
		const {propAbilSelectedRollIx} = this.constructor._rolled_getProps(ab);
		const {propUserBonus} = this.constructor._common_getProps(ab);
		return (this._state.rolled_rolls[this._state[propAbilSelectedRollIx]] || {total: 0}).total + this._state[propUserBonus] + this._getTotalScore_getBonuses(ab);
	}

	_array_getTotalScore (ab) {
		const {propAbilSelectedScoreIx} = this.constructor._array_getProps(ab);
		const {propUserBonus} = this.constructor._common_getProps(ab);
		return (StatGenUi._STANDARD_ARRAY[this._state[propAbilSelectedScoreIx]] || 0) + this._state[propUserBonus] + this._getTotalScore_getBonuses(ab);
	}

	_pb_getTotalScore (ab) {
		const prop = `pb_${ab}`;
		const {propUserBonus} = this.constructor._common_getProps(ab);
		return this._state[prop] + this._state[propUserBonus] + this._getTotalScore_getBonuses(ab);
	}

	_manual_getTotalScore (ab) {
		const {propAbilValue} = this.constructor._manual_getProps(ab);
		const {propUserBonus} = this.constructor._common_getProps(ab);
		return (this._state[propAbilValue] || 0) + this._state[propUserBonus] + this._getTotalScore_getBonuses(ab);
	}

	_levelUp_getTotalScore (ab) {
		const {propUserBonus} = this.constructor._common_getProps(ab);
		return (this._existingScores[ab] || 0) + this._state[propUserBonus] + this._getTotalScore_getBonuses(ab);
	}

	_getTotalScore_getBonuses (ab) {
		let total = 0;

		if (!this._isLevelUp) {
			const handleEntityAbility = ({fromEntity, propChoiceMetasFrom, propChoiceWeighted}) => {
				if (fromEntity) {
					if (fromEntity[ab]) total += fromEntity[ab];

					if (fromEntity.choose && fromEntity.choose.from) {
						total += this._state[propChoiceMetasFrom]
							.filter(it => it.ability === ab)
							.map(it => it.amount)
							.reduce((a, b) => a + b, 0);
					}

					if (fromEntity.choose && fromEntity.choose.weighted && fromEntity.choose.weighted.weights) {
						total += this._state[propChoiceWeighted]
							.filter(it => it.ability === ab)
							.map(it => it.amount)
							.reduce((a, b) => a + b, 0);
					}
				}
			};

			handleEntityAbility({
				fromEntity: this._pb_getRaceAbility(),
				propChoiceMetasFrom: "common_raceChoiceMetasFrom",
				propChoiceWeighted: "common_raceChoiceMetasWeighted",
			});

			handleEntityAbility({
				fromEntity: this._pb_getBackgroundAbility(),
				propChoiceMetasFrom: "common_backgroundChoiceMetasFrom",
				propChoiceWeighted: "common_backgroundChoiceMetasWeighted",
			});
		}

		const formDataAsi = this._compAsi.getFormData();
		if (formDataAsi) total += formDataAsi.data[ab] || 0;

		return total;
	}

	getSaveableState () {
		const out = super.getSaveableState();

		const handleEntity = ({propIxEntity, page, propData, propHash}) => {
			if (out.state[propIxEntity] == null || !~this._state[propIxEntity]) return;

			out.state[propHash] = UrlUtil.URL_TO_HASH_BUILDER[page](this[propData][out.state[propIxEntity]]);
			delete out.state[propIxEntity];
		};

		handleEntity({
			propIxEntity: "common_ixRace",
			page: UrlUtil.PG_RACES,
			propData: "_races",
			propHash: "_pb_raceHash",
		});

		handleEntity({
			propIxEntity: "common_ixBackground",
			page: UrlUtil.PG_BACKGROUNDS,
			propData: "_backgrounds",
			propHash: "_pb_backgroundHash",
		});

		for (let i = 0; i < (out.state.common_cntFeatsCustom || 0); ++i) {
			const {propIxFeat, propSaveLoadFeatHash} = this.getPropsAsi(i, "custom");

			if (out.state[propIxFeat] == null || !~this._state[propIxFeat]) continue;

			out.state[propSaveLoadFeatHash] = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](this._feats[out.state[propIxFeat]]);
			delete out.state[propIxFeat];
		}

		return out;
	}

	// region External use
	getSaveableStateCustom () {
		const base = this.getSaveableState();
		return {
			state: Object.fromEntries(
				this.constructor._PROPS_CUSTOM
					.map(k => [k, base.state[k]]),
			),
		};
	}
	// endregion

	setStateFrom (saved, isOverwrite = false) {
		saved = MiscUtil.copy(saved);

		MiscUtil.getOrSet(saved, "state", {});

		saved.state.common_isAllowTashasRules = VetoolsConfig.get("styleSwitcher", "style") !== SITE_STYLE__ONE;

		const handleEntityHash = ({propHash, page, propData, propIxEntity}) => {
			if (!saved.state?.[propHash]) return;

			const ixEntity = this[propData].findIndex(ent => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](ent);
				return hash === saved.state[propHash];
			});
			if (~ixEntity) saved.state[propIxEntity] = ixEntity;
		};

		handleEntityHash({
			propHash: "_pb_raceHash",
			page: UrlUtil.PG_RACES,
			propData: "_races",
			propIxEntity: "common_ixRace",
		});

		handleEntityHash({
			propHash: "_pb_backgroundHash",
			page: UrlUtil.PG_BACKGROUNDS,
			propData: "_backgrounds",
			propIxEntity: "common_ixBackground",
		});

		for (let i = 0; i < (saved.state.common_cntFeatsCustom || 0); ++i) {
			const {propIxFeat, propSaveLoadFeatHash} = this.getPropsAsi(i, "custom");

			if (!saved.state?.[propSaveLoadFeatHash]) continue;

			const ixEntity = this._feats.findIndex(ent => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](ent);
				return hash === saved.state[propSaveLoadFeatHash];
			});
			if (~ixEntity) saved.state[propIxFeat] = ixEntity;
		}

		const validKeys = new Set(Object.keys(this._getDefaultState()));
		const validKeyPrefixes = [
			StatGenUi._PROP_PREFIX_COMMON,
			StatGenUi._PROP_PREFIX_ROLLED,
			StatGenUi._PROP_PREFIX_ARRAY,
			StatGenUi._PROP_PREFIX_MANUAL,
		];

		Object.keys(saved.state).filter(k => !validKeys.has(k) && !validKeyPrefixes.some(it => k.startsWith(it))).forEach(k => delete saved.state[k]);

		// region Trim the ASI/feat state to the max count of ASIs/feats
		for (let i = saved.state.common_cntAsi || 0; i < 1000; ++i) {
			const {propMode, prefix} = this.getPropsAsi(i, "ability");
			if (saved.state[propMode]) Object.keys(saved.state).filter(k => k.startsWith(prefix)).forEach(k => delete saved.state[k]);
		}

		for (let i = saved.state.common_cntFeatsCustom || 0; i < 1000; ++i) {
			const {propMode, prefix} = this.getPropsAsi(i, "custom");
			if (saved.state[propMode]) Object.keys(saved.state).filter(k => k.startsWith(prefix)).forEach(k => delete saved.state[k]);
		}
		// endregion

		this._isSettingStateFromOverwrite = isOverwrite;
		try {
			super.setStateFrom(saved, isOverwrite);
		} finally {
			this._isSettingStateFromOverwrite = false;
		}
	}

	_pb_getMinMaxScores () {
		return {
			min: Math.min(...this._state.pb_rules.map(it => it.entity.score)),
			max: Math.max(...this._state.pb_rules.map(it => it.entity.score)),
		};
	}

	_getDefaultStateCommonResettable () {
		return {
			...Parser.ABIL_ABVS.mergeMap(ab => ({[this.constructor._common_getProps(ab).propUserBonus]: 0})),

			common_raceChoiceMetasFrom: [],
			common_raceChoiceMetasWeighted: [],

			common_backgroundChoiceMetasFrom: [],
			common_backgroundChoiceMetasWeighted: [],
		};
	}

	_getDefaultStateNoneResettable () { return {}; }

	_getDefaultStateRolledResettable () {
		return {
			...Parser.ABIL_ABVS.mergeMap(ab => ({[this.constructor._rolled_getProps(ab).propAbilSelectedRollIx]: null})),
		};
	}

	_getDefaultStateArrayResettable () {
		return {
			...Parser.ABIL_ABVS.mergeMap(ab => ({[this.constructor._array_getProps(ab).propAbilSelectedScoreIx]: null})),
		};
	}

	_getDefaultStatePointBuyResettable () {
		return {
			pb_str: 8,
			pb_dex: 8,
			pb_con: 8,
			pb_int: 8,
			pb_wis: 8,
			pb_cha: 8,
		};
	}

	_getDefaultStatePointBuyCosts () {
		return {
			pb_rules: [
				{score: 8, cost: 0},
				{score: 9, cost: 1},
				{score: 10, cost: 2},
				{score: 11, cost: 3},
				{score: 12, cost: 4},
				{score: 13, cost: 5},
				{score: 14, cost: 7},
				{score: 15, cost: 9},
			].map(({score, cost}) => this._getDefaultState_pb_rule(score, cost)),
		};
	}

	_getDefaultState_pb_rule (score, cost) {
		return {
			id: CryptUtil.uid(),
			entity: {
				score,
				cost,
			},
		};
	}

	_getDefaultStateManualResettable () {
		return {
			...Parser.ABIL_ABVS.mergeMap(ab => ({[this.constructor._manual_getProps(ab).propAbilValue]: null})),
		};
	}

	_getDefaultState () {
		return {
			// region Common
			common_isPreviewRace: false,
			common_isAllowTashasRules: VetoolsConfig.get("styleSwitcher", "style") !== SITE_STYLE__ONE,
			common_isTashas: false,
			common_isShowTashasRules: false,
			common_ixRace: null,
			common_ixAbilityScoreSetRace: 0,

			common_isPreviewBackground: false,
			common_ixBackground: null,
			common_ixAbilityScoreSetBackground: 0,

			common_pulseAsi: false, // Used as a general pulse for all changes in form data
			common_cntAsi: 0,
			common_cntFeatsCustom: 0,

			// region Used to allow external components to hook onto score changes
			common_export_str: null,
			common_export_dex: null,
			common_export_con: null,
			common_export_int: null,
			common_export_wis: null,
			common_export_cha: null,
			// endregion

			...this._getDefaultStateCommonResettable(),
			// endregion

			// region Rolled stats
			rolled_formula: "4d6dl1",
			rolled_rollCount: 6,
			rolled_rolls: [],
			...this._getDefaultStateRolledResettable(),
			// endregion

			// region Standard array
			...this._getDefaultStateArrayResettable(),
			// endregion

			// region Point buy
			...this._getDefaultStatePointBuyResettable(),
			...this._getDefaultStatePointBuyCosts(),

			pb_points: 27,
			pb_budget: 27,

			pb_isCustom: false,
			// endregion

			// region Manual
			...this._getDefaultStateManualResettable(),
			// endregion
		};
	}
}
