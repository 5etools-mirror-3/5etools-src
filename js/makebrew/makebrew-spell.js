import {SpellSourceLookupBuilder} from "../converter/converterutils-spell-sources.js";
import {BuilderBase} from "./makebrew-builder-base.js";
import {BuilderUi} from "./makebrew-builderui.js";
import {TagCondition} from "../converter/converterutils-tags.js";
import {RenderSpells} from "../render-spells.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";

const _SPELL_RANGE_TYPES = [
	{type: Parser.RNG_POINT, hasDistance: true, isRequireAmount: false},

	{type: Parser.RNG_LINE, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_CUBE, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_CONE, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_EMANATION, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_RADIUS, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_SPHERE, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_HEMISPHERE, hasDistance: true, isRequireAmount: true},
	{type: Parser.RNG_CYLINDER, hasDistance: true, isRequireAmount: true},

	{type: Parser.RNG_SPECIAL, hasDistance: false, isRequireAmount: false},
];

const _SPELL_DIST_TYPES = [
	{type: Parser.RNG_SELF, hasAmount: false},
	{type: Parser.RNG_TOUCH, hasAmount: false},

	{type: Parser.UNT_FEET, hasAmount: true},
	{type: Parser.UNT_YARDS, hasAmount: true},
	{type: Parser.UNT_MILES, hasAmount: true},

	{type: Parser.RNG_SIGHT, hasAmount: false},
	{type: Parser.RNG_UNLIMITED_SAME_PLANE, hasAmount: false},
	{type: Parser.RNG_UNLIMITED, hasAmount: false},
];

export class SpellBuilder extends BuilderBase {
	constructor () {
		super({
			prop: "spell",
			pFnGetFluff: Renderer.spell.pGetFluff.bind(Renderer.spell),
		});

		this._subclassLookup = {};

		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);
	}

	async pHandleClickLoadExisting () {
		const result = await SearchWidget.pGetUserSpellSearch();
		if (result) {
			const spell = MiscUtil.copy(await DataLoader.pCacheAndGet(result.page, result.source, result.hash));
			return this.pHandleLoadExistingData(spell);
		}
	}

	/**
	 * @param spell
	 * @param [opts]
	 * @param [opts.meta]
	 */
	async pHandleLoadExistingData (spell, opts) {
		opts = opts || {};

		spell.name = `${spell.name} (Copy)`;
		spell.source = this._ui.source;

		delete spell.srd;
		delete spell.srd52;
		delete spell.basicRules;
		delete spell.basicRules2024;
		delete spell.uniqueId;
		delete spell.reprintedAs;

		const meta = {...(opts.meta || {}), ...this._getInitialMetaState({nameOriginal: spell.name, isModified: true})};

		this.setStateFromLoaded({s: spell, m: meta});

		this.renderInput();
		this.renderOutput();
	}

	async _pInit () {
		this._subclassLookup = await DataUtil.class.pGetSubclassLookup();
	}

	_getInitialState () {
		return {
			...super._getInitialState(),
			name: "New Spell",
			level: 1,
			school: "A",
			time: [
				{
					number: 1,
					unit: "action",
				},
			],
			range: {
				type: "point",
				distance: {
					type: "self",
				},
			},
			duration: [
				{
					type: "instant",
				},
			],
			classes: {
				fromClassList: [
					{
						name: "Wizard",
						source: VetoolsConfig.get("styleSwitcher", "style") === SITE_STYLE__CLASSIC ? Parser.SRC_PHB : Parser.SRC_XPHB,
					},
				],
			},
			entries: [],
			source: this._ui ? this._ui.source : "",
		};
	}

	setStateFromLoaded (state) {
		if (!state?.s || !state?.m) return;

		this._doResetProxies();

		if (!state.s.uniqueId) state.s.uniqueId = CryptUtil.uid();

		this.__state = state.s;
		this.__meta = state.m;
	}

	doHandleSourcesAdd () {
		this._doHandleSourcesAdd_handleSelProp("classSources");
		this._doHandleSourcesAdd_handleSelProp("subclassSources");
	}

	_doHandleSourcesAdd_handleSelProp (prop) {
		(this._compsSource[prop] || [])
			.forEach(comp => {
				comp.onUpdateValues();
			});
	}

	_renderInputImpl () {
		this._doCreateProxies();
		this._doBindHeaderElements();
		this._renderInputMain();
	}

	_renderInputMain () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const wrp = this._ui.wrpInput.vee.empty();

		const _cb = () => {
			// Prefer numerical pages if possible
			if (!isNaN(this._state.page)) this._state.page = Number(this._state.page);

			// do post-processing
			TagCondition.tryTagConditions(this._state, {isTagInflicted: true, isInflictedAddOnly: true, styleHint: this._meta.styleHint});

			this.renderOutput();
			this.doUiSave();
			this._meta.isModified = true;
		};
		const cb = MiscUtil.debounce(_cb, 33);
		this._cbCache = cb; // cache for use when updating sources

		// initialise tabs
		this._resetTabs({tabGroup: "input"});

		const tabOptsShared = {hasBorder: true, hasBackground: true};
		const tabs = this._renderTabs(
			[
				new TabUiUtil.TabMeta({...tabOptsShared, name: "Info"}),
				new TabUiUtil.TabMeta({...tabOptsShared, name: "Details"}),
				new TabUiUtil.TabMeta({...tabOptsShared, name: "Sources"}),
				new TabUiUtil.TabMeta({...tabOptsShared, name: "Flavor/Misc"}),
			],
			{
				tabGroup: "input",
				cbTabChange: this.doUiSave.bind(this),
			},
		);
		const [infoTab, detailsTab, sourcesTab, miscTab] = tabs;
		veT`<div class="ve-flex-v-center ve-w-100 ve-no-shrink ve-ui-tab__wrp-tab-heads--border">${tabs.map(it => it.btnTab)}</div>`.vee.appendTo(wrp);
		tabs.forEach(it => it.wrpTab.vee.appendTo(wrp));

		// INFO
		BuilderUi.getStateIptString("Name", cb, this._state, {nullable: false}, "name").vee.appendTo(infoTab.wrpTab);
		this._selSource = this.getSourceInput(cb).vee.appendTo(infoTab.wrpTab);
		this.__getOtherSourcesInput(cb).vee.appendTo(infoTab.wrpTab);
		BuilderUi.getStateIptString("Page", cb, this._state, {}, "page").vee.appendTo(infoTab.wrpTab);
		BuilderUi.getStateIptEnum("Level", cb, this._state, {nullable: false, fnDisplay: (it) => Parser.spLevelToFull(it), vals: [...new Array(21)].map((_, i) => i)}, "level").vee.appendTo(infoTab.wrpTab);
		BuilderUi.getStateIptEnum("School", cb, this._state, {nullable: false, fnDisplay: (it) => Parser.spSchoolAbvToFull(it), vals: [...Parser.SKL_ABVS]}, "school").vee.appendTo(infoTab.wrpTab);
		BuilderUi.getStateIptStringArray(
			"Subschools",
			cb,
			this._state,
			{
				shortName: "Subschool",
				title: "Found in some homebrew, for example the 'Clockwork' sub-school.",
			},
			"subschools",
		).vee.appendTo(infoTab.wrpTab);

		// TEXT
		this.__getTimeInput(cb).vee.appendTo(detailsTab.wrpTab);
		this.__getRangeInput(cb).vee.appendTo(detailsTab.wrpTab);
		this.__getComponentInput(cb).vee.appendTo(detailsTab.wrpTab);
		this.__getMetaInput(cb).vee.appendTo(detailsTab.wrpTab);
		this.__getDurationInput(cb).vee.appendTo(detailsTab.wrpTab);
		BuilderUi.getStateIptEntries("Text", cb, this._state, {fnPostProcess: BuilderUi.fnPostProcessDice}, "entries").vee.appendTo(detailsTab.wrpTab);
		const iptEntriesHigherLevelMeta = BuilderUi.getStateIptEntries(
			"&quot;Higher-Level Spell Slot&quot; Text",
			cb,
			this._state,
			{
				nullable: true,
				fnGetHeader: state => {
					if (this._meta.styleHint === "classic") return "At Higher Levels";
					return state.level === 0 ? "Cantrip Upgrade" : "Using a Higher-Level Spell Slot";
				},
				fnPostProcess: BuilderUi.fnPostProcessDice,
				asMeta: true,
			},
			"entriesHigherLevel",
		);
		this._addHook("state", "level", () => iptEntriesHigherLevelMeta.vee.onChange());
		iptEntriesHigherLevelMeta.row.vee.appendTo(detailsTab.wrpTab);

		// SOURCES
		const [
			{row: rowClasses, doRefresh: doRefreshClasses},
			{row: rowSubclasses, doRefresh: doRefreshSubclasses},
		] = this.__getClassesInputs(cb);
		rowClasses.vee.appendTo(sourcesTab.wrpTab);
		rowSubclasses.vee.appendTo(sourcesTab.wrpTab);
		const {row: rowRaces, doRefresh: doRefreshRaces} = this.__getRaces(cb);
		rowRaces.vee.appendTo(sourcesTab.wrpTab);
		const {row: rowBackgrounds, doRefresh: doRefreshBackgrounds} = this.__getBackgrounds(cb);
		rowBackgrounds.vee.appendTo(sourcesTab.wrpTab);
		const {row: rowOptionalFeatures, doRefresh: doRefreshOptionalFeatures} = this.__getOptionalfeatures(cb);
		rowOptionalFeatures.vee.appendTo(sourcesTab.wrpTab);
		const {row: rowFeats, doRefresh: doRefreshFeats} = this.__getFeats(cb);
		rowFeats.vee.appendTo(sourcesTab.wrpTab);
		const {row: rowChatoptions, doRefresh: doRefreshChatoptions} = this.__getCharoptions(cb);
		rowChatoptions.vee.appendTo(sourcesTab.wrpTab);
		const {row: rowRewards, doRefresh: doRefreshRewards} = this.__getRewards(cb);
		rowRewards.vee.appendTo(sourcesTab.wrpTab);
		const fnsDoRefreshSources = [
			doRefreshClasses,
			doRefreshSubclasses,
			doRefreshRaces,
			doRefreshBackgrounds,
			doRefreshOptionalFeatures,
			doRefreshFeats,
			doRefreshChatoptions,
			doRefreshRewards,
		];
		this.__getSourcesGenerated(cb, fnsDoRefreshSources).vee.appendTo(sourcesTab.wrpTab);

		// FLAVOR/MISC
		this.getFluffInput(cb).vee.appendTo(miscTab.wrpTab);
		veT`<div class="ve-flex-vh-center ve-w-100 ve-mb-2"><i>Note: the following data is used by filters on the Spells page.</i></div>`.vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Damage Inflicted",
			cb,
			this._state,
			{
				vals: MiscUtil.copy(Parser.DMG_TYPES),
				nullable: true,
				fnDisplay: StrUtil.uppercaseFirst,
			},
			"damageInflict",
		).vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Conditions Inflicted",
			cb,
			this._state,
			{
				vals: MiscUtil.copy(Parser.CONDITIONS),
				nullable: true,
				fnDisplay: StrUtil.uppercaseFirst,
			},
			"conditionInflict",
		).vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Spell Attack Type",
			cb,
			this._state,
			{
				vals: ["M", "R", "O"],
				nullable: true,
				fnDisplay: Parser.spAttackTypeToFull,
			},
			"spellAttack",
		).vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Saving Throw",
			cb,
			this._state,
			{
				vals: Object.values(Parser.ATB_ABV_TO_FULL).map(it => it.toLowerCase()),
				nullable: true,
				fnDisplay: StrUtil.uppercaseFirst,
			},
			"savingThrow",
		).vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Ability Check",
			cb,
			this._state,
			{
				vals: Object.values(Parser.ATB_ABV_TO_FULL).map(it => it.toLowerCase()),
				nullable: true,
				fnDisplay: StrUtil.uppercaseFirst,
			},
			"abilityCheck",
		).vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Area Type",
			cb,
			this._state,
			{
				vals: Object.keys(Parser.SPELL_AREA_TYPE_TO_FULL),
				nullable: true,
				fnDisplay: Parser.spAreaTypeToFull,
			},
			"areaTags",
		).vee.appendTo(miscTab.wrpTab);
		BuilderUi.getStateIptBooleanArray(
			"Misc Tags",
			cb,
			this._state,
			{
				vals: Object.keys(Parser.SP_MISC_TAG_TO_FULL),
				nullable: true,
				fnDisplay: Parser.spMiscTagToFull,
			},
			"miscTags",
		).vee.appendTo(miscTab.wrpTab);

		// The following aren't included, as they are not used in the site:
		/*
		damageResist
		damageImmune
		damageVulnerable
		 */
	}

	__getOtherSourcesInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Other Sources", {isMarked: true, title: "For example, various spells in Xanathar's Guide to Everything can also be found in the Elemental Evil Player's Companion."});

		const doUpdateState = () => {
			const out = otherSourceRows.map(row => row.getOtherSource()).filter(Boolean);
			if (out.length) this._state.otherSources = out;
			else delete this._state.otherSources;
			cb();
		};

		const otherSourceRows = [];

		const wrpRows = veT`<div></div>`.vee.appendTo(rowInner);
		(this._state.otherSources || []).forEach(it => this.__getOtherSourcesInput__getOtherSourceRow(doUpdateState, otherSourceRows, it).wrp.vee.appendTo(wrpRows));

		const wrpBtnAdd = veT`<div></div>`.vee.appendTo(rowInner);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add Other Source</button>`
			.vee.appendTo(wrpBtnAdd)
			.vee.onn("click", () => {
				this.__getOtherSourcesInput__getOtherSourceRow(doUpdateState, otherSourceRows, null).wrp.vee.appendTo(wrpRows);
				doUpdateState();
			});

		return row;
	}

	__getOtherSourcesInput__getOtherSourceRow (doUpdateState, otherSourceRows, os) {
		const getOtherSource = () => {
			const out = {source: compSelSource.getValue()};
			const pageRaw = iptPage.vee.val();
			if (pageRaw) {
				const page = !isNaN(pageRaw) ? UiUtil.strToInt(pageRaw) : pageRaw;
				if (page) {
					out.page = page;
					iptPage.vee.val(page);
				}
			}
			return out;
		};

		const iptPage = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(os && os.page ? os.page : null);

		const compSelSource = this._getCompSelSource("otherSourceSources", doUpdateState, os ? os.source.escapeQuotes() : this._meta.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_PHB : Parser.SRC_XPHB);

		const out = {getOtherSource};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Source</span>${compSelSource.getWrp()}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Page</span>${iptPage}</div>
			${wrpBtnRemove}
		</div>`;
		this.constructor.getBtnRemoveRow(doUpdateState, otherSourceRows, out, wrp, "Other Source").vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		otherSourceRows.push(out);
		return out;
	}

	__getTimeInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Casting Time", {isMarked: true});

		const doUpdateState = () => {
			this._state.time = timeRows.map(row => row.getTime());
			cb();
		};

		const timeRows = [];

		const wrpRows = veT`<div></div>`.vee.appendTo(rowInner);
		this._state.time.forEach(time => SpellBuilder.__getTimeInput__getTimeRow(doUpdateState, timeRows, time).wrp.vee.appendTo(wrpRows));

		const wrpBtnAdd = veT`<div></div>`.vee.appendTo(rowInner);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add Casting Time</button>`
			.vee.appendTo(wrpBtnAdd)
			.vee.onn("click", () => {
				SpellBuilder.__getTimeInput__getTimeRow(doUpdateState, timeRows, {number: 1, unit: Parser.SP_TM_ACTION}).wrp.vee.appendTo(wrpRows);
				doUpdateState();
			});

		return row;
	}

	static __getTimeInput__getTimeRow (doUpdateState, timeRows, time) {
		const keys = Object.keys(Parser.SP_TIME_TO_FULL);

		const getTime = () => {
			const out = {number: UiUtil.strToInt(iptNum.vee.val()), unit: keys[selUnit.vee.val()]};
			const condition = iptCond.vee.val().trim();
			if (condition) out.condition = condition;

			iptNum.vee.val(out.number);

			return out;
		};

		const iptNum = veT`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-2">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(time.number);

		const ixInitial = keys.indexOf(time.unit);
		const selUnit = veT`<select class="ve-form-control ve-input-xs">
			${keys.map((it, i) => `<option value="${i}">${Parser.spTimeUnitToFull(it)}</option>`).join("")}
		</select>`
			.vee.val(~ixInitial ? `${ixInitial}` : "0")
			.vee.onn("change", () => {
				doUpdateState();
			});

		const iptCond = veT`<input class="ve-form-control form-control--minimal ve-input-xs" placeholder="which you take when...">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(time.condition);

		const out = {getTime};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">
			<div class="ve-flex-v-center ve-mb-2">${iptNum}${selUnit}</div>
			<div class="ve-flex-v-center ve-mb-2">
				<span class="ve-mr-2 mkbru__sub-name--33">Condition</span>${iptCond}
			</div>
			${wrpBtnRemove}
		</div>`;
		this.getBtnRemoveRow(doUpdateState, timeRows, out, wrp, "Time", {isProtectLast: true}).vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		timeRows.push(out);
		return out;
	}

	__getRangeInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Range", {isMarked: true});

		const isInitialDistance = !!this._state.range.distance;
		const isInitialAmount = this._state.range.distance && this._state.range.distance.amount != null;

		const doUpdateState = () => {
			const rangeMeta = _SPELL_RANGE_TYPES[selRange.vee.val()];
			const out = {type: rangeMeta.type};
			if (rangeMeta.hasDistance) {
				const distMeta = _SPELL_DIST_TYPES[selDistance.vee.val()];
				out.distance = {type: distMeta.type};
				if (distMeta.hasAmount) {
					out.distance.amount = UiUtil.strToInt(iptAmount.vee.val());
					iptAmount.vee.val(out.distance.amount);
				}
			}
			this._state.range = out;
			cb();
		};

		const ixInitialRange = _SPELL_RANGE_TYPES.findIndex(it => it.type === this._state.range.type);
		const selRange = veT`<select class="ve-form-control ve-input-xs">
			${_SPELL_RANGE_TYPES.map((it, i) => `<option value="${i}">${Parser.spRangeTypeToFull(it.type)}</option>`).join("")}
		</select>`
			.vee.val(~ixInitialRange ? `${ixInitialRange}` : "0")
			.vee.onn("change", () => {
				const metaRangeType = _SPELL_RANGE_TYPES[selRange.vee.val()];
				stageDistance.vee.toggle(metaRangeType.hasDistance);
				stageAmount.vee.toggle(metaRangeType.hasDistance);

				if (metaRangeType.isRequireAmount && !_SPELL_DIST_TYPES[selDistance.vee.val()].hasAmount) {
					selDistance.vee.val(`${_SPELL_DIST_TYPES.findIndex(it => it.hasAmount)}`).vee.trigger("change");
				} else doUpdateState();
			});
		veT`<div class="ve-flex-v-center">
			<span class="ve-mr-2 mkbru__sub-name--33">Range Type</span>
			${selRange}
		</div>`.vee.appendTo(rowInner);

		// DISTANCE TYPE
		const ixInitialDist = this._state.range.distance ? _SPELL_DIST_TYPES.findIndex(it => it.type === this._state.range.distance.type) : -1;
		const selDistance = veT`<select class="ve-form-control ve-input-xs">
			${_SPELL_DIST_TYPES.map((it, i) => `<option value="${i}">${Parser.spDistanceTypeToFull(it.type)}</option>`).join("")}
		</select>`
			.vee.val(~ixInitialDist ? `${ixInitialDist}` : "0")
			.vee.onn("change", () => {
				const metaDistType = _SPELL_DIST_TYPES[selDistance.vee.val()];
				stageAmount.vee.toggle(metaDistType.hasAmount);

				if (!metaDistType.hasAmount && _SPELL_RANGE_TYPES[selRange.vee.val()].isRequireAmount) {
					selDistance.vee.val(`${_SPELL_DIST_TYPES.findIndex(it => it.hasAmount)}`).vee.trigger("change");
				} else doUpdateState();
			});
		const stageDistance = veT`<div class="ve-flex-v-center ve-mt-2">
			<span class="ve-mr-2 mkbru__sub-name--33">Distance Type</span>
			${selDistance}
		</div>`.vee.appendTo(rowInner).vee.toggle(isInitialDistance);

		// AMOUNT
		const initialAmount = MiscUtil.get(this._state, "range", "distance", "amount");
		const iptAmount = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(initialAmount);
		const stageAmount = veT`<div class="ve-flex-v-center ve-mt-2">
			<span class="ve-mr-2 mkbru__sub-name--33">Distance Amount</span>
			${iptAmount}
		</div>`.vee.appendTo(rowInner).vee.toggle(isInitialAmount);

		return row;
	}

	__getComponentInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Components", {isMarked: true});

		const initialMaterialMode = (!this._state.components || this._state.components.m == null)
			? "0"
			: (this._state.components.m.consume != null || this._state.components.m.cost != null || this._state.components.m.text != null)
				? "2"
				: typeof this._state.components.m === "string" ? "1" : "3";

		const doUpdateState = () => {
			const out = {};
			if (cbVerbal.vee.prop("checked")) out.v = true;
			if (cbSomatic.vee.prop("checked")) out.s = true;
			if (cbRoyalty.vee.prop("checked")) out.r = true;

			const materialMode = selMaterial.vee.val();
			// Use spaces
			switch (materialMode) {
				case "1": out.m = iptMaterial.vee.val().trim() || true; break;
				case "2": {
					out.m = {
						text: iptMaterial.vee.val().trim() || true,
					};
					// TODO add support for "optional" consume type
					if (cbConsumed.vee.prop("checked")) out.m.consume = true;
					if (iptCost.vee.val().trim()) {
						out.m.cost = UiUtil.strToInt(iptCost.vee.val());
						iptCost.vee.val(out.m.cost);
					}
					break;
				}
				case "3": out.m = true; break;
			}

			if (Object.keys(out).length) this._state.components = out;
			else delete this._state.components;
			cb();
		};

		const cbVerbal = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(this._state.components && this._state.components.v))
			.vee.onn("change", () => doUpdateState());
		const cbSomatic = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(this._state.components && this._state.components.s))
			.vee.onn("change", () => doUpdateState());
		const cbRoyalty = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(this._state.components && this._state.components.r))
			.vee.onn("change", () => doUpdateState());
		const iptMaterial = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.val(initialMaterialMode === "1" ? this._state.components.m : initialMaterialMode === "2" ? this._state.components.m.text : null)
			.vee.onn("change", () => doUpdateState());

		const selMaterial = veT`<select class="ve-form-control ve-input-xs">
			<option value="0">(None)</option>
			<option value="1">Has Material Component</option>
			<option value="2">Has Consumable/Costed Material Component</option>
			<option value="3">Has Generic Material Component</option>
		</select>`.vee.val(initialMaterialMode).vee.onn("change", () => {
				switch (selMaterial.vee.val()) {
					case "0": stageMaterial.vee.hide(); stageMaterialConsumable.vee.hide(); break;
					case "1": stageMaterial.vee.show(); stageMaterialConsumable.vee.hide(); break;
					case "2": stageMaterial.vee.show(); stageMaterialConsumable.vee.show(); break;
					case "3": stageMaterial.vee.hide(); stageMaterialConsumable.vee.hide(); break;
				}

				doUpdateState();
			});

		veT`<div>
			<div class="ve-flex-v-center ve-mb-2"><div class="ve-mr-2 mkbru__sub-name--33">Verbal</div>${cbVerbal}</div>
			<div class="ve-flex-v-center ve-mb-2"><div class="ve-mr-2 mkbru__sub-name--33">Somatic</div>${cbSomatic}</div>
			<div class="ve-flex-v-center ve-mt-2"><div class="ve-mr-2 mkbru__sub-name--33">Royalty</div>${cbRoyalty}</div>
			<div class="ve-flex-v-center"><div class="ve-mr-2 mkbru__sub-name--33">Material Type</div>${selMaterial}</div>
		</div>`.vee.appendTo(rowInner);

		// BASIC MATERIAL
		const stageMaterial = veT`<div class="ve-flex-v-center ve-mt-2"><div class="ve-mr-2 mkbru__sub-name--33">Materials</div>${iptMaterial}</div>`.vee.appendTo(rowInner).vee.toggle(initialMaterialMode === "1" || initialMaterialMode === "2");

		// CONSUMABLE MATERIAL
		const cbConsumed = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(this._state.components && this._state.components.m && this._state.components.m.consume))
			.vee.onn("change", () => doUpdateState());
		const iptCost = veT`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-1">`
			.vee.val(this._state.components && this._state.components.m && this._state.components.m.cost ? this._state.components.m.cost : null)
			.vee.onn("change", () => doUpdateState());
		const TITLE_FILTERS_EXTERNAL = "Used in filtering/external applications. The full text of the material component should be entered in the &quot;Materials&quot; field, above.";
		const stageMaterialConsumable = veT`<div class="ve-mt-2">
			<div class="ve-flex-v-center ve-mb-2"><div class="ve-mr-2 mkbru__sub-name--33 ve-help" title="${TITLE_FILTERS_EXTERNAL}">Is Consumed</div>${cbConsumed}</div>
			<div class="ve-flex-v-center"><div class="ve-mr-2 mkbru__sub-name--33 ve-help" title="${TITLE_FILTERS_EXTERNAL} Specified in copper pieces (1gp = 100cp).">Component Cost</div>${iptCost}<div>cp</div></div>
		</div>`.vee.appendTo(rowInner).vee.toggle(initialMaterialMode === "2");

		return row;
	}

	__getMetaInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Tags", {isMarked: true});

		const doUpdateState = () => {
			const out = {};
			if (cbRitual.vee.prop("checked")) out.ritual = true;
			if (cbTechnomagic.vee.prop("checked")) out.technomagic = true;

			if (Object.keys(out).length) this._state.meta = out;
			else delete this._state.meta;
			cb();
		};

		const cbRitual = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(this._state.meta && this._state.meta.ritual))
			.vee.onn("change", () => doUpdateState());
		const cbTechnomagic = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(this._state.meta && this._state.meta.technomagic))
			.vee.onn("change", () => doUpdateState());

		veT`<div>
			<div class="ve-flex-v-center ve-mb-2"><div class="ve-mr-2 mkbru__sub-name--33">Ritual</div>${cbRitual}</div>
			<div class="ve-flex-v-center"><div class="ve-mr-2 mkbru__sub-name--33">Technomagic</div>${cbTechnomagic}</div>
		</div>`.vee.appendTo(rowInner);

		return row;
	}

	__getDurationInput (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Duration", {isMarked: true});

		const doUpdateState = () => {
			this._state.duration = durationRows.map(row => row.getDuration());
			cb();
		};

		const durationRows = [];

		const wrpRows = veT`<div></div>`.vee.appendTo(rowInner);
		this._state.duration.forEach(duration => SpellBuilder.__getDurationInput__getDurationRow(doUpdateState, durationRows, duration).wrp.vee.appendTo(wrpRows));

		const wrpBtnAdd = veT`<div></div>`.vee.appendTo(rowInner);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add Duration</button>`
			.vee.appendTo(wrpBtnAdd)
			.vee.onn("click", () => {
				SpellBuilder.__getDurationInput__getDurationRow(doUpdateState, durationRows, {type: "instant"}).wrp.vee.appendTo(wrpRows);
				doUpdateState();
			});

		return row;
	}

	static __getDurationInput__getDurationRow (doUpdateState, durationRows, duration) {
		const DURATION_TYPES = Parser.DURATION_TYPES;
		const AMOUNT_TYPES = Parser.DURATION_AMOUNT_TYPES;

		const typeInitial = DURATION_TYPES.find(it => it.type === duration.type);

		const getDuration = () => {
			const ixType = selDurationType.vee.val();
			const out = {type: DURATION_TYPES[ixType].type};

			switch (ixType) {
				case "1": {
					out.duration = {
						type: AMOUNT_TYPES[selAmountType.vee.val()],
						amount: UiUtil.strToInt(iptAmount.vee.val()),
					};
					iptAmount.vee.val(out.duration.amount);
					if (cbConc.vee.prop("checked")) out.concentration = true;
					if (cbUpTo.vee.prop("checked")) out.duration.upTo = true;
					break;
				}
				case "2": {
					if (endRows.length) out.ends = endRows.map(it => it.getEnd());
				}
			}

			return out;
		};

		const ixInitialDuration = DURATION_TYPES.findIndex(it => it.type === duration.type);
		const selDurationType = veT`<select class="ve-form-control ve-input-xs">
			${DURATION_TYPES.map((it, i) => `<option value="${i}">${it.full || it.type.toTitleCase()}</option>`).join("")}
		</select>`.vee.val(~ixInitialDuration ? `${ixInitialDuration}` : "0").vee.onn("change", () => {
		const meta = DURATION_TYPES[selDurationType.vee.val()];
		stageAmount.vee.toggle(!!meta.hasAmount);
		stageEnds.vee.toggle(!!meta.hasEnds);
		doUpdateState();
	});

		// AMOUNT
		const ixInitialAmount = duration.duration ? `${AMOUNT_TYPES.indexOf(duration.duration.type)}` : "0";
		const selAmountType = veT`<select class="ve-form-control ve-input-xs">
			${AMOUNT_TYPES.map((it, i) => `<option value="${i}">${it.toTitleCase()}s</option>`).join("")}
		</select>`.vee.val(ixInitialAmount).vee.onn("change", () => doUpdateState());
		const iptAmount = veT`<input class="ve-form-control form-control--minimal ve-input-xs ve-mr-2">`
			.vee.val(duration.duration ? duration.duration.amount : null)
			.vee.onn("change", () => doUpdateState());
		const cbConc = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!duration.concentration)
			.vee.onn("change", () => doUpdateState());
		const cbUpTo = veT`<input type="checkbox" class="mkbru__ipt-cb--plain">`
			.vee.prop("checked", !!(duration.duration ? duration.duration.upTo : false))
			.vee.onn("change", () => doUpdateState());
		const stageAmount = veT`<div class="ve-flex-col ve-mb-2">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Concentration</span>${cbConc}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33 ve-help" title="For a spell with Concentration, this has no effect, as it is assumed that the spell can be ended at any time by ending concentration.">Up To...</span>${cbUpTo}</div>
			<div class="ve-flex-v-center">${iptAmount}${selAmountType}</div>
		</div>`.vee.toggle(!!typeInitial.hasAmount);

		// ENDS
		const endRows = [];
		const wrpEndRows = veT`<div class="ve-flex-col"></div>`;
		const btnAddEnd = veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add &quot;Until&quot; Clause</button>`
			.vee.onn("click", () => {
				SpellBuilder.__getDurationInput__getDurationRow__getEndRow(doUpdateState, endRows, "dispel").wrp.vee.appendTo(wrpEndRows);
				doUpdateState();
			});
		const stageEnds = veT`<div class="ve-mb-2">
			${wrpEndRows}
			<div class="ve-text-right">${btnAddEnd}</div>
		</div>`.vee.toggle(!!typeInitial.hasEnds);
		if (duration.ends) duration.ends.forEach(end => SpellBuilder.__getDurationInput__getDurationRow__getEndRow(doUpdateState, endRows, end).wrp.vee.appendTo(wrpEndRows));

		const out = {getDuration};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Duration Type</span>${selDurationType}</div>
			${stageAmount}
			${stageEnds}
			${wrpBtnRemove}
		</div>`;
		this.getBtnRemoveRow(doUpdateState, durationRows, out, wrp, "Duration", {isProtectLast: true}).vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		durationRows.push(out);
		return out;
	}

	static __getDurationInput__getDurationRow__getEndRow (doUpdateState, endRows, end) {
		const keys = Object.keys(Parser.SP_END_TYPE_TO_FULL);

		const getEnd = () => keys[selEndType.vee.val()];

		const ixInitialEnd = end ? keys.indexOf(end) : "0";
		const selEndType = veT`<select class="ve-form-control ve-input-xs ve-mr-2">
			${keys.map((it, i) => `<option value="${i}">Until ${Parser.spEndTypeToFull(it)}</option>`).join("")}
		</select>`.vee.val(ixInitialEnd).vee.onn("change", () => doUpdateState());

		const out = {getEnd};

		const wrpBtnRemove = veT`<div></div>`;
		const wrp = veT`<div class="ve-flex">
			<div class="mkbru__sub-name--33 ve-mr-2"></div>
			<div class="ve-mb-2 ve-flex-v-center ve-w-100">${selEndType}${wrpBtnRemove}</div>
		</div>`;
		this.getBtnRemoveRow(doUpdateState, endRows, out, wrp, "Until Clause", {isExtraSmall: true}).vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		endRows.push(out);
		return out;
	}

	__getClassesInputs (cb) {
		const DEFAULT_CLASS = this._meta.styleHint === SITE_STYLE__CLASSIC
			? {name: "Wizard", source: Parser.SRC_PHB}
			: {name: "Wizard", source: Parser.SRC_XPHB};
		const DEFAULT_SUBCLASS = this._meta.styleHint === SITE_STYLE__CLASSIC
			? {name: "Evocation", shortName: "Evocation", source: Parser.SRC_PHB}
			: {name: "Evoker", shortName: "Evoker", source: Parser.SRC_XPHB};

		const [rowCls, rowInnerCls] = BuilderUi.getLabelledRowTuple("Classes", {isMarked: true});
		const [rowSc, rowInnerSc] = BuilderUi.getLabelledRowTuple("Subclasses", {isMarked: true});

		const classRows = [];
		const subclassRows = [];

		const doUpdateState = () => {
			const out = {fromClassList: classRows.map(it => it.getClass())};
			const subclasses = subclassRows.map(it => it.getSubclass()).filter(Boolean);
			if (subclasses.length) out.fromSubclass = subclasses;
			this._state.classes = out;
			cb();
		};

		// CLASSES
		const wrpRowsCls = veT`<div></div>`.vee.appendTo(rowInnerCls);
		const doRefreshCls = () => {
			wrpRowsCls.vee.empty();
			classRows.splice(0, classRows.length);
			((this._state.classes || {}).fromClassList || []).forEach(cls => this.__getClassesInputs__getClassRow(doUpdateState, classRows, cls).wrp.vee.appendTo(wrpRowsCls));
		};
		doRefreshCls();

		const wrpBtnAddCls = veT`<div></div>`.vee.appendTo(rowInnerCls);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add Class</button>`
			.vee.appendTo(wrpBtnAddCls)
			.vee.onn("click", () => {
				this.__getClassesInputs__getClassRow(doUpdateState, classRows, MiscUtil.copy(DEFAULT_CLASS)).wrp.vee.appendTo(wrpRowsCls);
				doUpdateState();
			});

		// SUBCLASSES
		const wrpRowsSc = veT`<div></div>`.vee.appendTo(rowInnerSc);
		const doRefreshSc = () => {
			wrpRowsSc.vee.empty();
			subclassRows.splice(0, subclassRows.length);
			((this._state.classes || {}).fromSubclass || []).forEach(sc => this.__getClassesInputs__getSubclassRow(doUpdateState, subclassRows, sc).wrp.vee.appendTo(wrpRowsSc));
		};
		doRefreshSc();

		const wrpBtnAddSc = veT`<div></div>`.vee.appendTo(rowInnerSc);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add Subclass</button>`
			.vee.appendTo(wrpBtnAddSc)
			.vee.onn("click", () => {
				this.__getClassesInputs__getSubclassRow(doUpdateState, subclassRows, {class: MiscUtil.copy(DEFAULT_CLASS), subclass: MiscUtil.copy(DEFAULT_SUBCLASS)}).wrp.vee.appendTo(wrpRowsSc);
				doUpdateState();
			});

		return [{row: rowCls, doRefresh: doRefreshCls}, {row: rowSc, doRefresh: doRefreshSc}];
	}

	__getClassesInputs__getClassRow (doUpdateState, classRows, cls) {
		const getClass = () => {
			return {
				name: iptClass.vee.val().trim(),
				source: compSelSource.getValue(),
			};
		};

		const iptClass = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(cls.name);
		const compSelSource = this._getCompSelSource("classSources", doUpdateState, cls.source);

		const out = {getClass};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows mkbru__wrp-rows--removable">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Class Name</span>${iptClass}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Class Source</span>${compSelSource.getWrp()}</div>
			${wrpBtnRemove}
		</div>`;
		this.constructor.getBtnRemoveRow(doUpdateState, classRows, out, wrp, "Class").vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		classRows.push(out);
		return out;
	}

	__getClassesInputs__getSubclassRow (doUpdateState, subclassRows, subclass) {
		const getSubclass = () => {
			const className = iptClass.vee.val().trim();
			const subclassName = iptSubclass.vee.val().trim();
			const subclassShortName = iptSubclassShort.vee.val().trim();
			if (!className || !subclassName) return null;
			const out = {
				class: {
					name: className,
					source: compSelSourceClass.getValue(),
				},
				subclass: {
					name: iptSubclass.vee.val(),
					shortName: iptSubclassShort.vee.val(),
					source: compSelSourceSubclass.getValue(),
				},
			};
			const subSubclassName = iptSubSubclass.vee.val().trim();
			if (subSubclassName) out.subclass.subSubclass = subSubclassName;
			return out;
		};

		const iptClass = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(subclass.class.name);
		const compSelSourceClass = this._getCompSelSource("classSources", doUpdateState, subclass.class.source);

		const iptSubclass = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(subclass.subclass.name);
		const iptSubclassShort = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(subclass.subclass.shortName);
		const compSelSourceSubclass = this._getCompSelSource("subclassSources", doUpdateState, subclass.subclass.source);

		const iptSubSubclass = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(subclass.subclass.subSubclass ? subclass.subclass.subSubclass : null);

		const out = {getSubclass};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Class Name</span>${iptClass}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Class Source</span>${compSelSourceClass.getWrp()}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Subclass Name</span>${iptSubclass}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Subclass Short Name</span>${iptSubclassShort}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Subclass Source</span>${compSelSourceSubclass.getWrp()}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33 ve-help" title="For example, for a Circle of the Coast Land Druid, enter &quot;Coast&quot;">Sub-Subclass Name</span>${iptSubSubclass}</div>
			${wrpBtnRemove}
		</div>`;
		this.constructor.getBtnRemoveRow(doUpdateState, subclassRows, out, wrp, "Subclass").vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		subclassRows.push(out);
		return out;
	}

	__getRaces (cb) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Species", {isMarked: true});

		const doUpdateState = () => {
			const races = raceRows.map(row => row.getRace()).filter(Boolean);
			if (races.length) this._state.races = races;
			else delete this._state.races;
			cb();
		};

		const raceRows = [];

		const wrpRows = veT`<div></div>`.vee.appendTo(rowInner);

		const doRefresh = () => {
			wrpRows.vee.empty();
			raceRows.splice(0, raceRows.length);
			(this._state.races || []).forEach(race => this.__getRaces__getRaceRow(doUpdateState, raceRows, race).wrp.vee.appendTo(wrpRows));
		};
		doRefresh();

		const wrpBtnAdd = veT`<div></div>`.vee.appendTo(rowInner);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add Species</button>`
			.vee.appendTo(wrpBtnAdd)
			.vee.onn("click", () => {
				this.__getRaces__getRaceRow(doUpdateState, raceRows, null).wrp.vee.appendTo(wrpRows);
				doUpdateState();
			});

		return {row, doRefresh};
	}

	__getRaces__getRaceRow (doUpdateState, raceRows, race) {
		const getRace = () => {
			const raceName = iptRace.vee.val().trim();
			if (raceName) {
				const out = {
					name: raceName,
					source: compSelSource.getValue(),
				};
				const baseRaceName = iptBaseRace.vee.val().trim();
				if (baseRaceName) {
					out.baseName = baseRaceName;
					out.baseSource = compSelSourceBase.getValue();
				}
				return out;
			} else return null;
		};

		const iptRace = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(race ? race.name : null);
		const iptBaseRace = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(race ? race.baseName : null);

		const compSelSource = this._getCompSelSource("raceSources", doUpdateState, race ? race.source : this._meta.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_PHB : Parser.SRC_XPHB);
		const compSelSourceBase = this._getCompSelSource("baseRaceSources", doUpdateState, race && race.baseSource ? race.baseSource : this._meta.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_PHB : Parser.SRC_XPHB);

		const out = {getRace};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Name</span>${iptRace}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Source</span>${compSelSource.getWrp()}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33 ve-help" title="The name of the base race, e.g. &quot;Elf&quot;. This is used in filtering.">Base Name</span>${iptBaseRace}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33 ve-help" title="For example, the &quot;Elf&quot; base race has a source of &quot;${Parser.SRC_PHB}&quot;">Base Source</span>${compSelSourceBase.getWrp()}</div>
			${wrpBtnRemove}
		</div>`;
		this.constructor.getBtnRemoveRow(doUpdateState, raceRows, out, wrp, "Species").vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		raceRows.push(out);
		return out;
	}

	__getSimpleSource ({cb, nameSingle, namePlural, prop, propTracker}) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple(namePlural, {isMarked: true});

		const doUpdateState = () => {
			const identObjs = rows.map(row => row.getIdentObject()).filter(Boolean);
			if (identObjs.length) this._state[prop] = identObjs;
			else delete this._state[prop];
			cb();
		};

		const optsRow = {nameSingle, propTracker};
		const rows = [];

		const wrpRows = veT`<div></div>`.vee.appendTo(rowInner);

		const doRefresh = () => {
			wrpRows.vee.empty();
			rows.splice(0, rows.length);
			(this._state[prop] || []).forEach(idObj => this.__getSimpleSource__getIdentRow(doUpdateState, rows, idObj, optsRow).wrp.vee.appendTo(wrpRows));
		};
		doRefresh();

		const wrpBtnAdd = veT`<div></div>`.vee.appendTo(rowInner);
		veT`<button class="ve-btn ve-btn-xs ve-btn-default">Add ${nameSingle}</button>`
			.vee.appendTo(wrpBtnAdd)
			.vee.onn("click", () => {
				this.__getSimpleSource__getIdentRow(doUpdateState, rows, null, optsRow).wrp.vee.appendTo(wrpRows);
				doUpdateState();
			});

		return {row, doRefresh};
	}

	__getSimpleSource__getIdentRow (doUpdateState, rows, identObj, {nameSingle, propTracker}) {
		const getIdentObject = () => {
			const name = iptName.vee.val().trim();
			if (!name) return null;

			return {
				name: name,
				source: compSelSource.getValue(),
			};
		};

		const iptName = veT`<input class="ve-form-control form-control--minimal ve-input-xs">`
			.vee.onn("change", () => doUpdateState())
			.vee.val(identObj ? identObj.name : null);

		const compSelSource = this._getCompSelSource(propTracker, doUpdateState, identObj ? identObj.source : this._meta.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_PHB : Parser.SRC_XPHB);

		const out = {getIdentObject};

		const wrpBtnRemove = veT`<div class="ve-text-right ve-mb-2"></div>`;
		const wrp = veT`<div class="ve-flex-col mkbru__wrp-rows">
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Name</span>${iptName}</div>
			<div class="ve-flex-v-center ve-mb-2"><span class="ve-mr-2 mkbru__sub-name--33">Source</span>${compSelSource.getWrp()}</div>
			${wrpBtnRemove}
		</div>`;
		this.constructor.getBtnRemoveRow(doUpdateState, rows, out, wrp, nameSingle).vee.appendTo(wrpBtnRemove);

		out.wrp = wrp;
		rows.push(out);
		return out;
	}

	__getBackgrounds (cb) {
		return this.__getSimpleSource({
			cb,
			nameSingle: "Background",
			namePlural: "Backgrounds",
			prop: "backgrounds",
			propTracker: "backgroundSources",
		});
	}

	__getOptionalfeatures (cb) {
		return this.__getSimpleSource({
			cb,
			nameSingle: "Optional Feature",
			namePlural: "Optional Features",
			prop: "optionalfeatures",
			propTracker: "optionalfeatureSources",
		});
	}

	__getFeats (cb) {
		return this.__getSimpleSource({
			cb,
			nameSingle: "Feat",
			namePlural: "Feats",
			prop: "feats",
			propTracker: "featSources",
		});
	}

	__getCharoptions (cb) {
		return this.__getSimpleSource({
			cb,
			nameSingle: "Character Creation Option",
			namePlural: "Character Creation Options",
			prop: "charoptions",
			propTracker: "charoptionSources",
		});
	}

	__getRewards (cb) {
		return this.__getSimpleSource({
			cb,
			nameSingle: "Supernatural Gift/Reward",
			namePlural: "Supernatural Gifts and Rewards",
			prop: "rewards",
			propTracker: "rewardSources",
		});
	}

	// TODO use this in creature builder
	_getCompSelSource (propTracker, doUpdateState, initialVal) {
		const comp = BaseComponent.fromObject({source: initialVal});

		const getValues = () => [
			...Object.entries(Parser.SOURCE_JSON_TO_FULL)
				.sort(([, vA], [, vB]) => SortUtil.ascSortLower(vA, vB))
				.map(([k]) => k),
			...this._ui.allSources,
			// Allow selection of prerelease sources, as these are non-entity source selectors
			...PrereleaseUtil.getSources()
				.sort((a, b) => SortUtil.ascSortLower(a.full, b.full))
				.map(it => it.json),
		];

		const meta = ComponentUiUtil.getSelSearchable(
			comp,
			"source",
			{
				values: getValues(),
				fnDisplay: val => Parser.sourceJsonToFull(val),
				displayNullAs: "\u2014",
				asMeta: true,
			},
		);

		comp._addHookBase("source", () => doUpdateState());

		comp.onUpdateValues = () => {
			meta.setValues(getValues(), {isResetOnMissing: true});
		};

		(this._compsSource[propTracker] ||= []).push(comp);

		comp.getValue = () => comp._state.source;

		comp.getWrp = () => meta.wrp;

		return comp;
	}

	__getSourcesGenerated (cb, fnsDoRefreshSources) {
		const [row, rowInner] = BuilderUi.getLabelledRowTuple("Generated", {isMarked: true});

		const getBtnAdd = () => {
			const btn = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Generate additional spell sources based on the spell's current sources (for example, Eldritch Knight Fighter for a Wizard spell).">Generate Additional</button>`
				.vee.onn("click", async () => {
					try {
						btn.vee.prop("disabled", true);

						const cpySp = MiscUtil.copyFast(this._state);

						const fauxSpellSourceLookup = {};
						// TODO(Future) expand to things beyond `class`?
						if (cpySp.classes?.fromClassList?.length) MiscUtil.set(fauxSpellSourceLookup, cpySp.source, cpySp.name, "class", cpySp.classes.fromClassList.map(({name, source}) => ({name, source})));

						const sourceLookup = await SpellSourceLookupBuilder.pGetLookup({
							spells: [
								// Load the default spell set to ensure all filters are populated
								...MiscUtil.copyFast(await DataUtil.spell.pLoadAll()),
								cpySp,
							],
							spellSourceLookupAdditional: fauxSpellSourceLookup,
						});

						const cache = {};
						DataUtil.spell.PROPS_SPELL_SOURCE.forEach(prop => {
							cpySp[prop] ||= MiscUtil.copyFast(this._state[prop]);
							cache[prop] = MiscUtil.copyFast(this._state[prop]);
							// Avoid duplicating existing values
							delete cpySp[prop];
						});
						DataUtil.spell.mutEntityBrewBuilder(cpySp, sourceLookup);

						DataUtil.spell.PROPS_SPELL_SOURCE
							.forEach(prop => this._state[prop] = cpySp[prop] || cache[prop]);

						cb();
						fnsDoRefreshSources.forEach(fn => fn());
					} finally {
						btn.vee.prop("disabled", false);
					}
				});

			return btn;
		};

		const btnAdd = getBtnAdd();

		veT`<div class="ve-flex-v-center">
			${btnAdd}
		</div>`.vee.appendTo(rowInner);

		return row;
	}

	renderOutput () {
		this._renderOutputDebounced();
	}

	_renderOutput () {
		const wrp = this._ui.wrpOutput.vee.empty();

		// initialise tabs
		this._resetTabs({tabGroup: "output"});

		const tabs = this._renderTabs(
			[
				new TabUiUtil.TabMeta({name: "Spell"}),
				new TabUiUtil.TabMeta({name: "Info"}),
				new TabUiUtil.TabMeta({name: "Images"}),
				new TabUiUtil.TabMeta({name: "Data"}),
				new TabUiUtil.TabMeta({name: "Markdown"}),
			],
			{
				tabGroup: "output",
				cbTabChange: this.doUiSave.bind(this),
			},
		);
		const [spellTab, infoTab, imageTab, dataTab, markdownTab] = tabs;
		veT`<div class="ve-flex-v-center ve-w-100 ve-no-shrink">${tabs.map(it => it.btnTab)}</div>`.vee.appendTo(wrp);
		tabs.forEach(it => it.wrpTab.vee.appendTo(wrp));

		// Spell
		const tblSpell = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(spellTab.wrpTab);
		// Make a copy of the spell, and add the data that would be displayed in the spells page
		const procSpell = MiscUtil.copy(this._state);
		Renderer.spell.initBrewSources(procSpell);
		tblSpell.vee.appends(RenderSpells.getRenderedSpell(procSpell, {subclassLookup: this._subclassLookup, isSkipExcludesRender: true}));

		// Info
		const tblInfo = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(infoTab.wrpTab);
		Renderer.utils.pBuildFluffTab({
			isImageTab: false,
			wrpContent: tblInfo,
			entity: this._state,
			pFnGetFluff: Renderer.spell.pGetFluff,
		});

		// Images
		const tblImages = veT`<table class="ve-w-100 ve-stats"></table>`.vee.appendTo(imageTab.wrpTab);
		Renderer.utils.pBuildFluffTab({
			isImageTab: true,
			wrpContent: tblImages,
			entity: this._state,
			pFnGetFluff: Renderer.spell.pGetFluff,
		});

		// Data
		const tblData = veT`<table class="ve-w-100 ve-stats ve-stats--book mkbru__wrp-output-tab-data"></table>`.vee.appendTo(dataTab.wrpTab);
		const asCode = Renderer.get().render({
			type: "entries",
			entries: [
				{
					type: "code",
					name: `Data`,
					preformatted: JSON.stringify(DataUtil.cleanJson(MiscUtil.copy(this._state)), null, "\t"),
				},
			],
		});
		tblData.vee.appends(Renderer.utils.getBorderTr());
		tblData.vee.appends(`<tr><td colspan="6">${asCode}</td></tr>`);
		tblData.vee.appends(Renderer.utils.getBorderTr());

		// Markdown
		const tblMarkdown = veT`<table class="ve-w-100 ve-stats ve-stats--book mkbru__wrp-output-tab-data"></table>`.vee.appendTo(markdownTab.wrpTab);
		tblMarkdown.vee.appends(Renderer.utils.getBorderTr());
		tblMarkdown.vee.appends(`<tr><td colspan="6">${this._getRenderedMarkdownCode()}</td></tr>`);
		tblMarkdown.vee.appends(Renderer.utils.getBorderTr());
	}
}
