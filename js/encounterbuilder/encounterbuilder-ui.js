import {RenderableCollectionViewerCreatures} from "./encounterbuilder-ui-creatures.js";

class _RenderableCollectionCustomShapeGroups extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
		},
	) {
		super(comp, "customShapeGroups", wrpRows);
	}

	/* -------------------------------------------- */

	_getWrpRow () {
		return super._getWrpRow()
			.vee.addClass("ve-py-1");
	}

	_populateRow ({comp, wrpRow, entity}) {
		// region Count
		const iptCountMinMaxMin = ComponentUiUtil.getIptInt(comp, "countMinMaxMin", 0, {min: 0})
			.vee.addClass("ve-text-center")
			.vee.tooltip("Minimum Number of Creatures");
		const iptCountMinMaxMax = ComponentUiUtil.getIptInt(comp, "countMinMaxMax", 1, {min: 1})
			.vee.addClass("ve-text-center")
			.vee.tooltip("Maximum Number of Creatures");

		const hkCountMinMax = () => {
			if (comp._state.countMinMaxMin <= comp._state.countMinMaxMax) return;

			[comp._state.countMinMaxMin, comp._state.countMinMaxMax] = [comp._state.countMinMaxMax, comp._state.countMinMaxMin];
		};

		comp._addHookBase("countMinMaxMin", hkCountMinMax);
		comp._addHookBase("countMinMaxMax", hkCountMinMax);

		hkCountMinMax();
		// endregion

		// region Ratio
		const sldRatio = ComponentUiUtil.getSliderNumber(comp, "ratioPercentage", {min: 0, max: 100, step: 1})
			.vee.addClass("ve-mr-2");

		const dispSpent = veT`<div class="ve-small ve-self-flex-end ve-no-shrink ve-w-140p ve-text-right ve-no-wrap ve-overflow-x-hidden ve-mr-2"></div>`;
		const setHtmlDispSpent = (html) => {
			dispSpent.vee.html(html);
		};
		// endregion

		const btnDelete = veT`<button class="ve-btn ve-btn-danger ve-btn-xxs" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => {
				this._utils.doDelete({entity});
			});

		veT(wrpRow)`
			<div class="ve-col-3 ve-flex-vh-center ve-pr-1">
				${iptCountMinMaxMin}
				<div class="ve-mx-1">\u2013</div>
				${iptCountMinMaxMax}
			</div>

			<div class="ve-col-9 ve-flex-vh-center ve-pl-1">
				${sldRatio}
				${dispSpent}
				${btnDelete}
			</div>
		`;

		return {
			setHtmlDispSpent,
		};
	}
}

class _RatioState {
	constructor ({ratiosPrev = null, cntRotate = 0} = {}) {
		this.ratiosPrev = ratiosPrev;
		this.cntRotate = cntRotate;
	}

	setState ({ratiosPrev = null, cntRotate = 0} = {}) {
		this.ratiosPrev = ratiosPrev;
		this.cntRotate = cntRotate;
	}
}

export class EncounterBuilderUi extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.renderableCollectionViewerCreatures = null;
		}
	};

	static _CUSTOM_GROUPS_CNT_MAX = 50;

	/* -------------------------------------------- */

	/** @type {EncounterBuilderCacheBase} */
	_cache;
	/** @type {EncounterBuilderComponent} */
	_comp;
	/** @type {Array<EncounterBuilderRulesBase>} */
	_rulesComps;
	/** @type {Array<EncounterBuilderPartyBase>} */
	_partyComps;
	/** @type {EncounterBuilderShapesLookup} */
	_encounterShapesLookup;
	/** @type {typeof RenderableCollectionViewerCreatures} */
	_ClsRenderableCollectionViewerCreatures;

	constructor (
		{
			cache,
			comp,
			rulesComps,
			partyComps,
			encounterShapesLookup,
			rendererWrapped,
			ClsRenderableCollectionViewerCreatures = null,

			headerTextSettings = "Settings",
		},
	) {
		if (!rendererWrapped) throw new Error(`Missing required "rendererWrapped" option!`);

		ClsRenderableCollectionViewerCreatures ??= RenderableCollectionViewerCreatures;

		super();

		this._cache = cache;
		this._comp = comp;
		this._rulesComps = rulesComps;
		this._rulesCompsLookup = Object.fromEntries(this._rulesComps.map(comp => [comp.rulesId, comp]));
		this._partyComps = partyComps;
		this._partyCompsLookup = Object.fromEntries(this._partyComps.map(comp => [comp.partyId, comp]));
		this._encounterShapesLookup = encounterShapesLookup;
		this._rendererWrapped = rendererWrapped;
		this._ClsRenderableCollectionViewerCreatures = ClsRenderableCollectionViewerCreatures;

		this._headerTextSettings = headerTextSettings;

		this._state.activeRulesId = this._rulesComps[0].rulesId;
		this._state.activePartyId = this._partyComps[0].partyId;
	}

	addHookOnSave (hk) {
		const fns = [
			this._addHookAllBase(hk),

			...this._rulesComps
				.map(rulesComp => rulesComp.addHookOnSave(hk)),
			...this._partyComps
				.map(partyComp => partyComp.addHookOnSave(hk)),
		];
		return (...args) => fns.forEach(fn => fn(...args));
	}

	getActivePartyId () { return this._state.activePartyId; }
	setActivePartyId (val) {
		if (!this._partyCompsLookup[val]) return;
		this._state.activePartyId = val;
	}

	getSaveableState () {
		const out = super.getSaveableState();
		out.stateRulesComps = Object.fromEntries(
			this._rulesComps
				.map(rulesComp => [rulesComp.rulesId, rulesComp.getSaveableState()]),
		);
		out.statePartyComps = Object.fromEntries(
			this._partyComps
				.map(partyComp => [partyComp.partyId, partyComp.getSaveableState()]),
		);
		return out;
	}

	setStateFrom (toLoad, isOverwrite = false) {
		if (!toLoad) return super.setStateFrom(toLoad, isOverwrite);

		if (toLoad.state) {
			if (!this._rulesCompsLookup[toLoad.state.activeRulesId]) toLoad.state.activeRulesId = this._rulesComps[0].rulesId;
			if (!this._partyCompsLookup[toLoad.state.activePartyId]) toLoad.state.activePartyId = this._partyComps[0].partyId;
		}

		const out = super.setStateFrom(toLoad, isOverwrite);

		Object.entries(toLoad?.stateRulesComps || {})
			.forEach(([rulesId, toLoadSub]) => {
				this._rulesCompsLookup[rulesId]?.setStateFrom(toLoadSub, isOverwrite);
			});
		Object.entries(toLoad?.statePartyComps || {})
			.forEach(([partyId, toLoadSub]) => {
				this._partyCompsLookup[partyId]?.setStateFrom(toLoadSub, isOverwrite);
			});
		return out;
	}

	/**
	 * @param {HTMLElementExtended} stgSettings
	 * @param {HTMLElementExtended} stgRandomAndAdjust
	 * @param {?HTMLElementExtended} stgViewer
	 * @param {HTMLElementExtended} stgShapeCustom
	 * @param {HTMLElementExtended} stgGroup
	 * @param {HTMLElementExtended} stgDifficulty
	 * @param {?HTMLElementExtended} stgFooter
	 */
	render (
		{
			stgSettings,
			stgRandomAndAdjust,
			stgViewer = null,
			stgShapeCustom,
			stgGroup,
			stgDifficulty,
			stgFooter = null,
		},
	) {
		const rdState = new this.constructor._RenderState();

		const {stgSettingsRules} = this._render_settings({rdState, stgSettings});

		this._render_viewer({rdState, stgViewer});
		const {stgGroupSummary} = this._render_group({stgGroup});
		this._render_shapeCustom({rdState, stgShapeCustom});

		this._rulesComps
			.forEach(rulesComp => {
				const {eles} = rulesComp.render({rdState, stgSettingsRules, stgRandomAndAdjust, stgGroupSummary, stgDifficulty});
				this._addHookBase("activeRulesId", () => {
					eles.forEach(ele => ele.vee.toggle(this._state.activeRulesId === rulesComp.rulesId));
				})();
			});

		this._render_footer({rdState, stgFooter});

		this._render_addHooks();

		return rdState;
	}

	_getActiveRulesComp () {
		return this._rulesCompsLookup[this._state.activeRulesId];
	}

	_getActivePartyComp () {
		return this._partyCompsLookup[this._state.activePartyId];
	}

	/* -------------------------------------------- */
	/* -------------------------------------------- */

	_render_settings ({stgSettings}) {
		const selRulesId = ComponentUiUtil.getSelEnum(
			this,
			"activeRulesId",
			{
				values: this._rulesComps.map(({rulesId}) => rulesId),
				fnDisplay: val => this._rulesCompsLookup[val]?.displayName,
			},
		);

		const stgSettingsRules = veT`<div class="ve-flex-col"></div>`;

		veT(stgSettings)`
			<h4 class="ve-my-2">${this._headerTextSettings}</h4>
			<label class="ve-flex-v-center ve-mb-2"><b class="ve-mr-2">Rules:</b> ${selRulesId}</label>
			${stgSettingsRules}
		`;

		return {
			stgSettingsRules,
		};
	}

	/**
	 * @param {_RenderState} rdState
	 * @param {?HTMLElementExtended} stgViewer
	 */
	_render_viewer ({rdState, stgViewer}) {
		this._addHookBase("activeRulesId", () => {
			this._comp.setActiveRulesComp(this._getActiveRulesComp());
		})();

		if (!stgViewer) return;

		const wrpRows = veT`<div class="ve-py-2 ve-overflow-y-auto ve-min-h-0 ve-flex-col ve-h-100"></div>`;
		const dispEmpty = veT`<div class="ve-muted ve-italic ve-text-center ve-p-2">Add a creature to begin.</div>`;

		const wrpOutput = veT`<div class="ecgen-viewer__wrp-output ve-relative">
			${wrpRows}
			${dispEmpty}
		</div>`;

		UiUtil.getEleDragVerticalResize({
			wrpContainer: wrpOutput,
			heightPxSaved: this._state.viewerHeightPx || 130,
			fnSetHeightPxSaved: heightPx => this._state.viewerHeightPx = heightPx,
		})
			.vee.addClass("ecgen-viewer__ele-resize")
			.vee.appendTo(wrpOutput);

		veT(stgViewer)`
			<hr class="ve-hr-2">
			${wrpOutput}
		`;

		rdState.renderableCollectionViewerCreatures = new this._ClsRenderableCollectionViewerCreatures({
			comp: this._comp,
			wrpRows,
			rendererWrapped: this._rendererWrapped,
		});

		this._comp.addHookCreatureGroups(() => {
			wrpRows.vee.toggle(!!this._comp.creatureGroups.length);
			dispEmpty.vee.toggle(!this._comp.creatureGroups.length);

			rdState.renderableCollectionViewerCreatures.render();
		})();
	}

	_render_group ({stgGroup}) {
		const selPartyId = ComponentUiUtil.getSelEnum(
			this,
			"activePartyId",
			{
				values: this._partyComps.map(({partyId}) => partyId),
				fnDisplay: val => this._partyCompsLookup[val]?.displayName,
			},
		)
			.vee.addClass("ve-w-120p");

		const stgParty = veT`<div class="ve-flex-col"></div>`;

		const stgGroupSummary = veT`<div class="ve-flex-col ve-w-40"></div>`;

		veT(stgGroup)`
			<h4 class="ve-my-2">Group Info</h4>
			<label class="ve-flex-v-center ve-mb-2"><b class="ve-mr-2">Mode:</b> ${selPartyId}</label>
			<hr class="ve-hr-2 ve-mt-0">
			<div class="ve-flex">
				<div class="ve-flex-col ve-w-60">
					${stgParty}
				</div>

				${stgGroupSummary}
			</div>
		`;

		this._partyComps
			.forEach(partyComp => {
				const {eles} = partyComp.render({stgGroup: stgParty});
				this._addHookBase("activePartyId", () => {
					eles.forEach(ele => ele.vee.toggle(this._state.activePartyId === partyComp.partyId));
				})();
			});

		this._addHookBase("activePartyId", (valNotFirstRun) => {
			this._comp.setActivePartyComp(this._getActivePartyComp());

			if (valNotFirstRun == null) return;
			this._render_hk_triggerPulseDerivedPartyMeta();
			this._render_hk_doUpdateExternalStates();
		})();

		return {stgGroupSummary};
	}

	/* -------------------------------------------- */

	_getCustomShapeTemplate () {
		return this._comp.customShapeGroups?.length
			? {
				groups: this._comp.customShapeGroups
					.map(customShapeGroup => {
						const {entity} = customShapeGroup;

						return {
							count: entity.countMinMaxMin === entity.countMinMaxMax
								? {exact: entity.countMinMaxMin}
								: {min: entity.countMinMaxMin, max: entity.countMinMaxMax},
							ratio: {exact: entity.ratioPercentage / 100},
						};
					}),
			}
			: null;
	}

	_setCustomShapeGroupsFromShapeTemplate (shapeTemplate) {
		if (!shapeTemplate?.groups) return 0;

		const groupsConvertable = shapeTemplate.groups
			.filter(group => (
				group.ratio?.exact != null
				&& group.count?.min != null
				&& group.count?.max != null
			));

		if (!groupsConvertable.length) return 0;

		this._comp.customShapeGroups = groupsConvertable
			.map(group => (
				this._comp.constructor.getDefaultCustomShapeGroup({
					countMinMaxMin: group.count.min,
					countMinMaxMax: group.count.max,
					ratioPercentage: group.ratio.exact * 100,
				})
			));

		return groupsConvertable.length;
	}

	_render_shapeCustom ({rdState, stgShapeCustom}) {
		const btnAddGroup = veT`<button class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-plus"></span> Add Creature Group</button>`
			.vee.onn("click", () => {
				if (this._comp.customShapeGroups.length >= this.constructor._CUSTOM_GROUPS_CNT_MAX) {
					JqueryUtil.doToast({type: "warning", content: "Maximum group limit reached! Please remove some existing groups first."});
					return;
				}

				this._comp.customShapeGroups = [
					...this._comp.customShapeGroups,
					this._comp.constructor.getDefaultCustomShapeGroup(),
				];
			});

		const btnClearGroups = veT`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Delete All Groups"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", async () => {
				if (
					this._comp.customShapeGroups?.length
					&& !await InputUiUtil.pGetUserBoolean({title: "Are you Sure?", htmlDescription: `Are you sure you want to creature delete ${this._comp.customShapeGroups.length} group${this._comp.customShapeGroups.length === 1 ? "" : "s"}?`})
				) return;

				this._comp.customShapeGroups = [];
			});

		const btnExportCustomShapeGroups = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Export Creature Group Configuration"><span class="glyphicon glyphicon-download"></span></button>`
			.vee.onn("click", () => {
				DataUtil.userDownload(`custom-encounter-config`, this._getCustomShapeTemplate(), {fileType: "encounterbuilder-custom-shape-template"});
			});

		const btnImportCustomShapeGroups = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Import Creature Group Configuration"><span class="glyphicon glyphicon-upload"></span></button>`
			.vee.onn("click", async () => {
				const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["encounterbuilder-custom-shape-template"]});

				DataUtil.doHandleFileLoadErrorsGeneric(errors);

				if (!jsons?.length) return;

				const [json] = jsons;

				const cntSet = this._setCustomShapeGroupsFromShapeTemplate(json);
				if (!cntSet) return JqueryUtil.doToast({content: `Failed to import creature groups! Please ensure the file contains a valid list of exported creature groups.`, type: "warning"});

				JqueryUtil.doToast({content: `Imported ${cntSet} creature group${cntSet === 1 ? "" : "s"}!`});
			});

		const btnAutoAllocate = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Auto-Distribute Remaining Budget (SHIFT to Auto Distribute Entire Budget; CTRL to Auto Distribute Entire Budget by Number of Creature)"><span class="glyphicon glyphicon-equalizer"></span></button>`
			.vee.onn("click", evt => {
				if (!this._comp.customShapeGroups?.length) return;

				if (evt.shiftKey || EventUtil.isCtrlMetaKey(evt)) {
					const ratiosCur = this._comp.customShapeGroups
						.map(() => 0);

					this._doAdjustRatios({
						deltaRatio: 100,
						ratioState: new _RatioState({ratiosPrev: ratiosCur}),
						ratiosCur,
						direction: 1,
						isRespectCreatureCount: EventUtil.isCtrlMetaKey(evt),
					});

					this._comp.customShapeGroups
						.forEach(({entity}, i) => entity.ratioPercentage = ratiosCur[i]);
					this._comp.customShapeGroups = [...this._comp.customShapeGroups];
					return;
				}

				const ratiosCur = this._comp.customShapeGroups
					.map(({entity}) => entity.ratioPercentage);
				const ratioPercentageTotal = ratiosCur.sum();

				this._doAdjustRatios({
					deltaRatio: 100 - ratioPercentageTotal,
					ratioState: new _RatioState({ratiosPrev: ratiosCur}),
					ratiosCur,
					direction: 1,
				});

				this._comp.customShapeGroups
					.forEach(({entity}, i) => entity.ratioPercentage = ratiosCur[i]);
				this._comp.customShapeGroups = [...this._comp.customShapeGroups];
			});

		const dispSpent = veT`<div class="ve-ml-auto ve-small ve-self-flex-end"></div>`;
		const getUnspentInfo = () => {
			const ratioPercentageTotal = this._comp.customShapeGroups
				.map(({entity}) => entity.ratioPercentage)
				.sum();

			const activeRulesComp = this._getActiveRulesComp();
			const partyMeta = activeRulesComp.getEncounterPartyMeta();

			return {
				html: activeRulesComp
					.getDisplayBudgetSpent({
						ratioSpent: ratioPercentageTotal / 100,
						partyMeta,
					}),
				htmlRowsLookup: Object.fromEntries(
					this._comp.customShapeGroups
						.map(customShapeGroup => {
							return [
								customShapeGroup.id,
								activeRulesComp
									.getDisplayGroupBudgetSpent({
										ratioSpent: customShapeGroup.entity.ratioPercentage / 100,
										partyMeta,
										cntMin: customShapeGroup.entity.countMinMaxMin,
										cntMax: customShapeGroup.entity.countMinMaxMax,
									}),
							];
						}),
				),
				isComplete: !(100 - ratioPercentageTotal),
			};
		};
		const doUpdateDispSpent = () => {
			const {
				html: htmlUnspentHeader,
				htmlRowsLookup,
				isComplete,
			} = getUnspentInfo();
			dispSpent
				.vee.html(`<span class="ve-split-v-center ve-w-140p ve-no-shrink" title="The percentage of the encounter budget, for the currently-selected difficulty, allocated to encounter groups.">${htmlUnspentHeader}</span>`)
				.vee.toggleClass("text-danger", !isComplete);

			const renderedCustomShapeGroups = this._comp._getRenderedCollection({prop: "customShapeGroups"});
			Object.entries(renderedCustomShapeGroups)
				.forEach(([id, meta]) => meta.setHtmlDispSpent(htmlRowsLookup[id]));
		};

		const wrpGroupsCustom = veT`<div class="ve-pb-2 ve-flex-col"></div>`;
		const wrpGroupsCustomEmpty = veT`<div class="ve-pb-2 ve-flex-vh-center">
			<i class="ve-muted ve-pt-2">Add a Custom Creature Group to begin.</i>
		</div>`;

		const renderableCollectionCustomShapeGroups = new _RenderableCollectionCustomShapeGroups({
			comp: this._comp,
			wrpRows: wrpGroupsCustom,
		});

		const ratioState = new _RatioState();

		this._comp.addHookCustomShapeGroups(() => {
			btnAutoAllocate.vee.toggleClass("ve-disabled", !this._comp.customShapeGroups?.length);

			renderableCollectionCustomShapeGroups.render();

			wrpGroupsCustom.vee.toggle(!!this._comp.customShapeGroups?.length);
			wrpGroupsCustomEmpty.vee.toggle(!this._comp.customShapeGroups?.length);

			doUpdateDispSpent();

			this._encounterShapesLookup.setCustomShapeTemplate(this._getCustomShapeTemplate());

			this._render_shapeCustom_doUpdateRatios(ratioState);
		})();

		const hkOnNonGroupUpdate = () => {
			const isCustom = this._getActiveRulesComp().isCustomEncounterShape();
			stgShapeCustom.vee.toggle(isCustom);

			if (!isCustom) return;

			doUpdateDispSpent();
		};

		this._addHookBase("activeRulesId", hkOnNonGroupUpdate);
		this._comp.addHookPulseDeriverPartyMeta(hkOnNonGroupUpdate);
		hkOnNonGroupUpdate();

		this._rulesComps
			.forEach(rulesComp => {
				rulesComp.addHookTierRandom(() => {
					const activeRulesComp = this._getActiveRulesComp();
					if (activeRulesComp !== rulesComp) return;

					hkOnNonGroupUpdate();
				});

				rulesComp.addHookShapeHashRandom(() => {
					const activeRulesComp = this._getActiveRulesComp();
					if (activeRulesComp !== rulesComp) return;

					hkOnNonGroupUpdate();
				})();
			});

		veT(stgShapeCustom)`
			<div class="ve-split-v-center ve-my-2">
				<h4 class="ve-my-0">Custom Encounter</h4>
				<div class="ve-flex-v-center">
					<div class="ve-btn-group ve-flex-v-center ve-mr-2">
						${btnAddGroup}
						${btnClearGroups}
					</div>
					<div class="ve-btn-group ve-flex-v-center">
						${btnExportCustomShapeGroups}
						${btnImportCustomShapeGroups}
					</div>
				</div>
			</div>

			<div class="ve-w-100 ve-flex ve-bb-1p-trans ve-pb-1p">
				<div class="ve-col-3 ve-no-shrink ve-small-caps ve-pr-1">Creatures</div>
				<div class="ve-w-100 ve-small-caps ve-px-1 ve-split-v-center">
					<div class="ve-flex-v-center">
						<div class="ve-mr-2">Budget Allocation</div>
						${btnAutoAllocate}
					</div>
					${dispSpent}
				</div>
				<div class="ve-w-20p ve-no-shrink"></div>
			</div>

			${wrpGroupsCustom}
			${wrpGroupsCustomEmpty}

			<hr class="ve-hr-2">
		`;
	}

	/**
	 * @param {_RatioState} ratioState
	 * @private
	 */
	_render_shapeCustom_doUpdateRatios (ratioState) {
		if (!this._comp.customShapeGroups.length) {
			return ratioState.setState();
		}

		const ratiosCur = this._comp.customShapeGroups
			.map(({entity}) => entity.ratioPercentage);

		if (ratioState.ratiosPrev == null) {
			return ratioState.setState({ratiosPrev: ratiosCur});
		}

		if (
			// We deleted a row, so total spent ratio can only decrease
			ratiosCur.length < ratioState.ratiosPrev.length
			// We added a row, which has 0% of the ratio by default, so total spend doesn't change
			|| ratiosCur.length > ratioState.ratiosPrev.length
		) {
			return ratioState.setState({ratiosPrev: ratiosCur});
		}

		// Ratios are the same, or have decreased
		if (ratiosCur.length === ratioState.ratiosPrev.length && ratiosCur.every((ratio, i) => ratio <= ratioState.ratiosPrev[i])) {
			return ratioState.setState({ratiosPrev: ratiosCur, cntRotate: ratioState.cntRotate});
		}

		// Ratios have increased
		// If total ratio is >100, reduce ratios of un-changed indices
		// We cap at `_CUSTOM_GROUPS_CNT_MAX` rows, so this should always work
		const ttlRatio = ratiosCur.sum();
		if (ttlRatio <= 100) {
			return ratioState.setState({ratiosPrev: ratiosCur, cntRotate: ratioState.cntRotate});
		}

		this._doAdjustRatios({
			deltaRatio: ttlRatio - 100,
			ratioState,
			ratiosCur,
			direction: -1,
		});

		ratioState.ratiosPrev = ratiosCur;
		this._comp.customShapeGroups
			.forEach(({entity}, i) => entity.ratioPercentage = ratiosCur[i]);
		this._comp.customShapeGroups = [...this._comp.customShapeGroups];
	}

	_doAdjustRatios ({deltaRatio, ratioState, ratiosCur, direction, isRespectCreatureCount = false}) {
		if (deltaRatio < 0 || deltaRatio > 100) throw new Error(`"deltaRaio" should be in range 0-100, inclusive!`);
		if (![1, -1].includes(direction)) throw new Error(`"direction" must be -1 or 1!`);

		const ixsModify = ratioState.ratiosPrev
			.map((_, i) => i)
			.filter(i => {
				return ratioState.ratiosPrev[i] === ratiosCur[i]
					&& ((ratiosCur[i] && !~direction) || (ratiosCur[i] < 100 && ~direction));
			});
		if (!ixsModify.length) throw new Error(`No "ixsModify" \u2014 should never occur!`);

		ixsModify.rotateRight(++ratioState.cntRotate);
		if (ratioState.cntRotate >= Number.MAX_SAFE_INTEGER) ratioState.cntRotate = 0;

		const cntCreatures = ixsModify
			.map(ix => {
				return [
					this._comp.customShapeGroups[ix].entity.countMinMaxMin,
					this._comp.customShapeGroups[ix].entity.countMinMaxMax,
				]
					.mean();
			})
			.sum();

		outer: while (deltaRatio) {
			const deltaRatioCache = deltaRatio;

			for (let i = ixsModify.length - 1; i >= 0; --i) {
				const ix = ixsModify[i];

				const adjustAmount = this._doAdjustRatios_getAdjustAmount({
					isRespectCreatureCount,
					deltaRatioCache,
					cntCreatures,
					ixsModify,
					ix,
				});

				if (ratiosCur[ix] < 0 || ratiosCur[ix] > 100) throw new Error(`Out-of-bounds "ratiosCur[${ix}]"=${ratiosCur[ix]} \u2014 should never occur!`);

				const adjustAmountForRatio = ~direction
					? Math.min(adjustAmount, 100 - ratiosCur[ix])
					: Math.min(adjustAmount, ratiosCur[ix]);
				if (!adjustAmountForRatio) continue;

				ratiosCur[ix] += adjustAmountForRatio * direction;
				if (
					(!ratiosCur[ix] && ~direction)
					|| (ratiosCur[ix] === 100 && !~direction)
				) ixsModify.splice(i, 1);

				deltaRatio -= adjustAmountForRatio;
				if (deltaRatio < 0) throw new Error(`Negative "deltaRatio"=${deltaRatio} \u2014 should never occur!`);
				if (!deltaRatio) break outer;
			}
		}
	}

	_doAdjustRatios_getAdjustAmount (
		{
			isRespectCreatureCount,
			deltaRatioCache,
			cntCreatures,
			ixsModify,
			ix,
		},
	) {
		if (!isRespectCreatureCount) return Math.floor(deltaRatioCache / ixsModify.length) || 1;

		const sliced = Math.floor(deltaRatioCache / cntCreatures);
		if (!sliced) {
			return 1;
		}

		return Math.floor(
			sliced
				* [
					this._comp.customShapeGroups[ix].entity.countMinMaxMin,
					this._comp.customShapeGroups[ix].entity.countMinMaxMax,
				]
					.mean(),
		);
	}

	/* -------------------------------------------- */

	_render_footer ({rdState, stgFooter}) { /* Implement as required */ }

	/* -------------------------------------------- */

	_render_addHooks () {
		this._partyComps
			.forEach(partyComp => partyComp.addHookOnPartyChange((valNotFirstRun) => {
				if (valNotFirstRun == null) return;
				this._render_hk_triggerPulseDerivedPartyMeta();
				this._render_hk_doUpdateExternalStates();
			}));

		this._comp.addHookCreatureGroups(() => {
			this._render_hk_triggerPulseDerivedPartyMeta();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookCustomShapeGroups((valNotFirstRun) => {
			if (valNotFirstRun == null) return;
			this._render_hk_doUpdateExternalStates();
		})();
	}

	_render_hk_triggerPulseDerivedPartyMeta () {
		this._comp.pulseDerivedPartyMeta();
	}

	_render_hk_doUpdateExternalStates () {
		/* Implement as required */
	}

	/* -------------------------------------------- */

	doCleanup () {
		this._rulesComps
			.forEach(comp => comp.doCleanup());
		this._partyComps
			.forEach(comp => comp.doCleanup());
	}

	/* -------------------------------------------- */

	_getDefaultState () {
		return {
			activeRulesId: null,
			activePartyId: null,

			viewerHeightPx: null,
		};
	}
}
