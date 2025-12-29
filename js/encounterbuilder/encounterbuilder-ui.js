import {EncounterBuilderRenderableCollectionPlayersSimple} from "./encounterbuilder-playerssimple.js";
import {EncounterBuilderRenderableCollectionColsExtraAdvanced} from "./encounterbuilder-colsextraadvanced.js";
import {EncounterBuilderRenderableCollectionPlayersAdvanced} from "./encounterbuilder-playersadvanced.js";
import {ScaleCreature} from "../scalecreature/scalecreature-scaler-cr.js";

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
			.addClass("py-1");
	}

	_populateRow ({comp, wrpRow, entity}) {
		// region Count
		const iptCountMinMaxMin = ComponentUiUtil.getIptInt(comp, "countMinMaxMin", 0, {min: 0})
			.addClass("ve-text-center")
			.tooltip("Minimum Number of Creatures");
		const iptCountMinMaxMax = ComponentUiUtil.getIptInt(comp, "countMinMaxMax", 1, {min: 1})
			.addClass("ve-text-center")
			.tooltip("Maximum Number of Creatures");

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
			.addClass("mr-2");

		const dispSpent = ee`<div class="ve-small ve-self-flex-end no-shrink w-140p ve-text-right no-wrap ve-overflow-x-hidden mr-2"></div>`;
		const setHtmlDispSpent = (html) => {
			dispSpent.html(html);
		};
		// endregion

		const btnDelete = ee`<button class="ve-btn ve-btn-danger ve-btn-xxs" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				this._utils.doDelete({entity});
			});

		ee(wrpRow)`
			<div class="ve-col-3 ve-flex-vh-center pr-1">
				${iptCountMinMaxMin}
				<div class="mx-1">\u2013</div>
				${iptCountMinMaxMax}
			</div>

			<div class="ve-col-9 ve-flex-vh-center pl-1">
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

class _RenderableCollectionViewerCreatures extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
		},
	) {
		super(comp, "creatureMetas", wrpRows);
	}

	_getWrpRow () {
		return super._getWrpRow()
			.addClass("py-1p")
			.addClass("px-1");
	}

	_populateRow ({comp, wrpRow, entity}) {
		const {wrp: wrpIptCount} = ComponentUiUtil.getIptNumber(comp, "count", 1, {min: 1, decorationRight: "ticker", asMeta: true});
		wrpIptCount
			.addClass("w-50p")
			.addClass("mr-2");

		const dispCreature = ee`<div class="mr-2 mr-auto ve-grow"></div>`;

		const pDoScaleCr = async ({targetCr}) => {
			// Fetch original
			const ent = await DataLoader.pCacheAndGetHash(
				UrlUtil.PG_BESTIARY,
				UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](comp._state.creature),
			);

			const baseCr = ent.cr.cr || ent.cr;
			if (baseCr == null) return;
			const baseCrNum = Parser.crToNumber(baseCr);
			const scaledToNum = comp._state.creature._isScaledCr ? comp._state._scaledCr : null;

			if (!Parser.isValidCr(targetCr)) {
				JqueryUtil.doToast({
					content: `"${targetCr}" is not a valid Challenge Rating! Please enter a valid CR (0-30). For fractions, "1/X" should be used.`,
					type: "danger",
				});

				iptCr.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			const targetCrNum = Parser.crToNumber(targetCr);

			if (targetCrNum === scaledToNum) return;

			const entScaled = await ScaleCreature.scale(ent, targetCrNum);

			// Merge state, if required
			const entityOther = this._comp._state[this._prop]
				.find(entityOther => {
					if (entityOther.id === entity.id) return false;
					return entityOther.getHash() === entity.getHash()
						&& MiscUtil.isNearStrictlyEqual(entityOther.getCustomHashId(), entity.getCustomHashId());
				});

			if (entityOther) {
				const cntToAdd = comp._state.count;
				this._utils.doDelete({entity});
				entityOther.setCount(entityOther.getCount() + cntToAdd);
				this._comp._triggerCollectionUpdate(this._prop);
				return;
			}

			comp._state.creature = entScaled;
		};

		let pScalingCr = null;
		const iptCr = ee`<input class="ve-text-center form-control form-control--minimal input-xs w-50p">`
			.onn("click", () => iptCr.selecte())
			.onn("change", async () => {
				await pScalingCr;
				pScalingCr = pDoScaleCr({targetCr: iptCr.val()});
				await pScalingCr;
				pScalingCr = null;
			});
		const stgCr = ee`<div class="mr-2 no-wrap ve-flex-v-center"><span class="mr-2">CR</span>${iptCr}</div>`;

		comp._addHookBase("creature", () => {
			// TODO(customHashId) this doesn't display the scaled creature on hover
			dispCreature.html(`${Renderer.get().render(`{@creature ${comp._state.creature.name}|${comp._state.creature.source}|${comp._state.creature._displayName || comp._state.creature.name}}`)}`);

			iptCr.val(comp._state.creature.cr?.cr || comp._state.creature.cr);

			stgCr.toggleVe(ScaleCreature.isCrInScaleRange(comp._state.creature));
		})();

		const btnShuffle = ee`<button title="Randomize Monster" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-random"></span></button>`
			.onn("click", () => {
				if (comp._state.isLocked) return;
				this._comp.doShuffleCreature({creatureMeta: entity});
			});

		const btnLock = ComponentUiUtil.getBtnBool(
			comp,
			"isLocked",
			{
				html: `<button title="Lock Monster against Randomizing/Adjusting" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-lock"></span></button>`,
			},
		);

		const btnDelete = ee`<button class="ve-btn ve-btn-danger ve-btn-xs" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				if (comp._state.isLocked) return;
				this._utils.doDelete({entity});
			});

		comp._addHookBase("isLocked", () => {
			btnShuffle.toggleClass("disabled", comp._state.isLocked);
			btnDelete.toggleClass("disabled", comp._state.isLocked);
		})();

		ee(wrpRow)`
			${wrpIptCount}
			${dispCreature}
			${stgCr}
			<div class="ve-btn-group no-wrap">
				${btnShuffle}
				${btnLock}
				${btnDelete}
			</div>
		`;
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
			this.wrpRowsSimple = null;
			this.wrpRowsAdvanced = null;
			this.wrpHeadersAdvanced = null;
			this.wrpFootersAdvanced = null;

			this._collectionPlayersSimple = null;
			this._collectionColsExtraAdvanced = null;
			this._collectionPlayersAdvanced = null;

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
	/** @type {EncounterBuilderShapesLookup} */
	_encounterShapesLookup;

	constructor ({cache, comp, rulesComps, encounterShapesLookup}) {
		super();

		this._cache = cache;
		this._comp = comp;
		this._rulesComps = rulesComps;
		this._rulesCompsLookup = Object.fromEntries(this._rulesComps.map(comp => [comp.rulesId, comp]));
		this._encounterShapesLookup = encounterShapesLookup;

		this._state.activeRulesId = this._rulesComps[0].rulesId;
	}

	addHookOnSave (hk) {
		const fns = [
			this._addHookAll("state", hk),
			...this._rulesComps
				.map(rulesComp => rulesComp.addHookOnSave(hk)),
		];
		return (...args) => fns.forEach(fn => fn(...args));
	}

	getSaveableState () {
		const out = super.getSaveableState();
		out.stateRulesComps = Object.fromEntries(
			this._rulesComps
				.map(rulesComp => [rulesComp.rulesId, rulesComp.getSaveableState()]),
		);
		return out;
	}

	setStateFrom (toLoad, isOverwrite = false) {
		if (!toLoad) return super.setStateFrom(toLoad, isOverwrite);

		if (toLoad.state) {
			if (!this._encounterShapesLookup[toLoad.state.activeRulesId]) toLoad.state.activeRulesId = this._rulesComps[0].rulesId;
		}

		const out = super.setStateFrom(toLoad, isOverwrite);
		Object.entries(toLoad?.stateRulesComps || {})
			.forEach(([rulesId, toLoadSub]) => {
				this._rulesCompsLookup[rulesId]?.setStateFrom(toLoadSub, isOverwrite);
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
	 */
	render (
		{
			stgSettings,
			stgRandomAndAdjust,
			stgViewer = null,
			stgShapeCustom,
			stgGroup,
			stgDifficulty,
		},
	) {
		const rdState = new this.constructor._RenderState();

		const {stgSettingsRules} = this._render_settings({rdState, stgSettings});

		this._render_viewer({rdState, stgViewer});
		const {stgGroupSummary} = this._render_group({rdState, stgGroup});
		this._render_shapeCustom({rdState, stgShapeCustom});

		this._rulesComps
			.forEach(rulesComp => {
				const {eles} = rulesComp.render({rdState, stgSettingsRules, stgRandomAndAdjust, stgGroupSummary, stgDifficulty});
				this._addHookBase("activeRulesId", () => {
					eles.forEach(ele => ele.toggleVe(this._state.activeRulesId === rulesComp.rulesId));
				})();
			});

		this._render_addHooks({rdState});

		return rdState;
	}

	_getActiveRulesComp () {
		return this._rulesCompsLookup[this._state.activeRulesId];
	}

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

		const stgSettingsRules = ee`<div class="ve-flex-col"></div>`;

		ee(stgSettings)`
			<h4 class="my-2">Settings</h4>
			<label class="ve-flex-v-center mb-2"><b class="mr-2">Rules:</b> ${selRulesId}</label>
			${stgSettingsRules}
		`;

		return {
			stgSettingsRules,
		};
	}

	_render_viewer ({rdState, stgViewer}) {
		this._addHookBase("activeRulesId", () => {
			this._comp.setActiveRulesComp(this._getActiveRulesComp());
		})();

		if (!stgViewer) return;

		const wrpOutput = ee`<div class="py-2 mt-5 ecgen-viewer__wrp-output"></div>`
			.hideVe();

		ee(stgViewer)`${wrpOutput}`;

		const renderableCollectionViewerCreatures = new _RenderableCollectionViewerCreatures({
			comp: this._comp,
			wrpRows: wrpOutput,
		});

		this._comp.addHookCreatureMetas(() => {
			wrpOutput.toggleVe(!!this._comp.creatureMetas.length);

			renderableCollectionViewerCreatures.render();
		})();
	}

	_render_group ({rdState, stgGroup}) {
		stgGroup.appends(`<h4 class="my-2">Group Info</h4>`);

		const {
			stg: stgSimple,
			wrpRows: wrpRowsSimple,
		} = this._renderGroupAndDifficulty_getGroupEles_simple();
		rdState.wrpRowsSimple = wrpRowsSimple;

		const {
			stg: stgAdvanced,
			wrpRows: wrpRowsAdvanced,
			wrpHeaders: wrpHeadersAdvanced,
			wrpFooters: wrpFootersAdvanced,
		} = this._renderGroupAndDifficulty_getGroupEles_advanced();
		rdState.wrpRowsAdvanced = wrpRowsAdvanced;
		rdState.wrpHeadersAdvanced = wrpHeadersAdvanced;
		rdState.wrpFootersAdvanced = wrpFootersAdvanced;

		const stgGroupSummary = ee`<div class="ve-flex-col w-40"></div>`;

		ee`<div class="ve-flex">
			<div class="ve-flex-col w-60">
				${stgSimple}
				${stgAdvanced}
			</div>

			${stgGroupSummary}
		</div>`
			.appendTo(stgGroup);

		rdState._collectionPlayersSimple = new EncounterBuilderRenderableCollectionPlayersSimple({
			comp: this._comp,
			rdState,
		});

		rdState._collectionColsExtraAdvanced = new EncounterBuilderRenderableCollectionColsExtraAdvanced({
			comp: this._comp,
			rdState,
		});

		rdState._collectionPlayersAdvanced = new EncounterBuilderRenderableCollectionPlayersAdvanced({
			comp: this._comp,
			rdState,
		});

		return {stgGroupSummary};
	}

	_renderGroupAndDifficulty_getGroupEles_simple () {
		const btnAddPlayers = ee`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Another Level</button>`
			.onn("click", () => this._comp.doAddPlayer());

		const wrpRows = ee`<div class="ve-flex-col w-100"></div>`;

		const stg = ee`<div class="ve-flex-col">
			<div class="ve-flex">
				<div class="w-80p">Players:</div>
				<div class="w-80p">Level:</div>
			</div>

			${wrpRows}

			<div class="mb-1 ve-flex">
				<div class="ecgen__wrp_add_players_btn_wrp">
					${btnAddPlayers}
				</div>
			</div>

			${this._renderGroupAndDifficulty_getPtAdvancedMode()}

		</div>`;

		this._comp.addHookIsAdvanced(() => {
			stg.toggleVe(!this._comp.isAdvanced);
		})();

		return {
			wrpRows,
			stg,
		};
	}

	_renderGroupAndDifficulty_getGroupEles_advanced () {
		const btnAddPlayers = ee`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Another Player</button>`
			.onn("click", () => this._comp.doAddPlayer());

		const btnAddAdvancedCol = ee`<button class="ve-btn ve-btn-primary ve-btn-xxs ecgen-player__btn-inline h-ipt-xs bl-0 bb-0 bbl-0 bbr-0 btl-0 ml-n1" title="Add Column" tabindex="-1"><span class="glyphicon glyphicon-list-alt"></span></button>`
			.onn("click", () => this._comp.doAddColExtraAdvanced());

		const wrpHeaders = ee`<div class="ve-flex"></div>`;
		const wrpFooters = ee`<div class="ve-flex"></div>`;

		const wrpRows = ee`<div class="ve-flex-col"></div>`;

		const stg = ee`<div class="ve-overflow-x-auto ve-flex-col">
			<div class="ve-flex-h-center mb-2 bb-1p small-caps ve-self-flex-start">
				<div class="w-100p mr-1 h-ipt-xs no-shrink">Name</div>
				<div class="w-40p ve-text-center mr-1 h-ipt-xs no-shrink">Level</div>
				${wrpHeaders}
				${btnAddAdvancedCol}
			</div>

			${wrpRows}

			<div class="mb-1 ve-flex">
				<div class="ecgen__wrp_add_players_btn_wrp no-shrink no-grow">
					${btnAddPlayers}
				</div>
				${wrpFooters}
			</div>

			${this._renderGroupAndDifficulty_getPtAdvancedMode()}

			<div class="row">
				<div class="w-100">
					${Renderer.get().render(`{@note Additional columns will be imported into the DM Screen.}`)}
				</div>
			</div>
		</div>`;

		this._comp.addHookIsAdvanced(() => {
			stg.toggleVe(this._comp.isAdvanced);
		})();

		return {
			stg,
			wrpRows,
			wrpHeaders,
			wrpFooters,
		};
	}

	_renderGroupAndDifficulty_getPtAdvancedMode () {
		const cbAdvanced = ComponentUiUtil.getCbBool(this._comp, "isAdvanced");

		return ee`<div class="ve-flex-v-center">
			<label class="ve-flex-v-center">
				<div class="mr-2">Advanced Mode</div>
				${cbAdvanced}
			</label>
		</div>`;
	}

	/* -------------------------------------------- */

	_render_shapeCustom ({rdState, stgShapeCustom}) {
		const btnAddGroup = ee`<button class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-plus"></span> Add Creature Group</button>`
			.onn("click", () => {
				if (this._comp.customShapeGroups.length >= this.constructor._CUSTOM_GROUPS_CNT_MAX) {
					JqueryUtil.doToast({type: "warning", content: "Maximum group limit reached! Please remove some existing groups first."});
					return;
				}

				this._comp.customShapeGroups = [
					...this._comp.customShapeGroups,
					this._comp.constructor.getDefaultCustomShapeGroup(),
				];
			});

		const btnClearGroups = ee`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Delete All Groups"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", async () => {
				if (
					this._comp.customShapeGroups?.length
					&& !await InputUiUtil.pGetUserBoolean({title: "Are you Sure?", htmlDescription: `Are you sure you want to creature delete ${this._comp.customShapeGroups.length} group${this._comp.customShapeGroups.length === 1 ? "" : "s"}?`})
				) return;

				this._comp.customShapeGroups = [];
			});

		const btnAutoAllocate = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Auto-Distribute Remaining Budget (SHIFT to Auto Distribute Entire Budget; CTRL to Auto Distribute Entire Budget by Number of Creature)"><span class="glyphicon glyphicon-equalizer"></span></button>`
			.onn("click", evt => {
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

		const dispSpent = ee`<div class="ml-auto ve-small ve-self-flex-end"></div>`;
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
				.html(`<span class="split-v-center w-140p no-shrink" title="The percentage of the encounter budget, for the currently-selected difficulty, allocated to encounter groups.">${htmlUnspentHeader}</span>`)
				.toggleClass("text-danger", !isComplete);

			const renderedCustomShapeGroups = this._comp._getRenderedCollection({prop: "customShapeGroups"});
			Object.entries(renderedCustomShapeGroups)
				.forEach(([id, meta]) => meta.setHtmlDispSpent(htmlRowsLookup[id]));
		};

		const wrpGroupsCustom = ee`<div class="pb-2 ve-flex-col"></div>`;
		const wrpGroupsCustomEmpty = ee`<div class="pb-2 ve-flex-vh-center">
			<i class="ve-muted pt-2">Add a Custom Creature Group to begin.</i>
		</div>`;

		const renderableCollectionCustomShapeGroups = new _RenderableCollectionCustomShapeGroups({
			comp: this._comp,
			wrpRows: wrpGroupsCustom,
		});

		const ratioState = new _RatioState();

		this._comp.addHookCustomShapeGroups(() => {
			btnAutoAllocate.toggleClass("disabled", !this._comp.customShapeGroups?.length);

			renderableCollectionCustomShapeGroups.render();

			wrpGroupsCustom.toggleVe(!!this._comp.customShapeGroups?.length);
			wrpGroupsCustomEmpty.toggleVe(!this._comp.customShapeGroups?.length);

			doUpdateDispSpent();

			const customShapeTemplate = this._comp.customShapeGroups?.length
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

			this._encounterShapesLookup.setCustomShapeTemplate(customShapeTemplate);

			this._render_shapeCustom_doUpdateRatios(ratioState);
		})();

		const hkOnNonGroupUpdate = () => {
			const isCustom = this._getActiveRulesComp().isCustomEncounterShape();
			stgShapeCustom.toggleVe(isCustom);

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

		ee(stgShapeCustom)`
			<div class="split-v-center my-2">
				<h4 class="my-0">Custom Encounter</h4>
				<div class="ve-btn-group">
					${btnAddGroup}
					${btnClearGroups}
				</div>
			</div>

			<div class="w-100 ve-flex bb-1p-trans pb-1p">
				<div class="ve-col-3 no-shrink small-caps pr-1">Creatures</div>
				<div class="w-100 small-caps px-1 split-v-center">
					<div class="ve-flex-v-center">
						<div class="mr-2">Budget Allocation</div>
						${btnAutoAllocate}
					</div>
					${dispSpent}
				</div>
				<div class="w-20p no-shrink"></div>
			</div>

			${wrpGroupsCustom}
			${wrpGroupsCustomEmpty}

			<hr class="hr-2">
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

	_render_addHooks ({rdState}) {
		this._comp.addHookPlayersSimple((valNotFirstRun) => {
			rdState._collectionPlayersSimple.render();

			if (valNotFirstRun == null) return;
			this._render_hk_triggerPulseDerivedPartyMeta();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookPlayersAdvanced((valNotFirstRun) => {
			rdState._collectionPlayersAdvanced.render();

			if (valNotFirstRun == null) return;
			this._render_hk_triggerPulseDerivedPartyMeta();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookIsAdvanced((valNotFirstRun) => {
			if (valNotFirstRun == null) return;
			this._render_hk_triggerPulseDerivedPartyMeta();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookCreatureMetas(() => {
			this._render_hk_triggerPulseDerivedPartyMeta();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookColsExtraAdvanced(() => {
			rdState._collectionColsExtraAdvanced.render();
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

	_getDefaultState () {
		return {
			activeRulesId: null,
		};
	}
}
