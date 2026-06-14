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
			.addClass("ve-py-1");
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
			.addClass("ve-mr-2");

		const dispSpent = ee`<div class="ve-small ve-self-flex-end ve-no-shrink ve-w-140p ve-text-right ve-no-wrap ve-overflow-x-hidden ve-mr-2"></div>`;
		const setHtmlDispSpent = (html) => {
			dispSpent.html(html);
		};
		// endregion

		const btnDelete = ee`<button class="ve-btn ve-btn-danger ve-btn-xxs" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`
			.onn("click", () => {
				this._utils.doDelete({entity});
			});

		ee(wrpRow)`
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

class _RenderableCollectionViewerCreatures extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
			rendererWrapped,
		},
	) {
		super(comp, "creatureMetas", wrpRows);
		if (!rendererWrapped) throw new Error(`Missing required "rendererWrapped" option!`);
		this._rendererWrapped = rendererWrapped;
	}

	_getWrpRow () {
		return super._getWrpRow()
			.addClass("ve-py-1p")
			.addClass("ve-px-1");
	}

	_populateRow ({comp, wrpRow, entity}) {
		const {wrp: wrpIptCount} = ComponentUiUtil.getIptNumber(comp, "count", 1, {min: 0, decorationRight: "ticker", asMeta: true});
		wrpIptCount
			.addClass("ve-w-50p")
			.addClass("ve-mr-2")
			.addClass("ve-no-shrink");
		comp._addHookBase("count", () => {
			if (comp._state.count > 0) return;
			if (comp._state.isLocked) return comp._state.count = 1;
			this._utils.doDelete({entity});
		});

		const dispCreature = ee`<div class="ve-mr-2 ve-mr-auto ve-grow"></div>`;

		const pDoScaleCr = async ({targetCr = null} = {}) => {
			// Fetch original
			const ent = await DataLoader.pCacheAndGetHash(
				UrlUtil.PG_BESTIARY,
				UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](comp._state.creature),
				{isCopy: true},
			);

			const baseCr = ent.cr.cr || ent.cr;
			if (baseCr == null) return;

			const baseCrNum = Parser.crToNumber(baseCr);
			const scaledToNum = comp._state.creature._isScaledCr ? comp._state.creature._scaledCr : null;

			if (targetCr == null) {
				comp._state.creature = ent;
				iptCr.val(Parser.numberToCr(baseCrNum));
				return;
			}

			if (!targetCr) {
				iptCr.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			if (!Parser.isValidCr(targetCr)) {
				JqueryUtil.doToast({
					content: `"${targetCr}" is not a valid Challenge Rating! Please enter a valid CR (0-30). For fractions, "1/X" should be used.`,
					type: "danger",
				});

				iptCr.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			const targetCrNum = Parser.crToNumber(targetCr);

			if (targetCrNum === scaledToNum) {
				iptCr.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			if (targetCrNum === baseCrNum) {
				comp._state.creature = ent;
				iptCr.val(Parser.numberToCr(baseCrNum));
				return;
			}

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
		const iptCr = ee`<input class="ve-text-center ve-form-control form-control--minimal ve-input-xs ve-w-50p">`
			.onn("click", () => iptCr.selecte())
			.onn("change", async () => {
				try {
					await pScalingCr;
				} catch (e) { setTimeout(() => { throw e; }); }

				pScalingCr = pDoScaleCr({targetCr: iptCr.val().trim()});
				await pScalingCr;
				pScalingCr = null;
			});

		const btnResetCr = ee`<button title="Reset CR" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-refresh"></span></button>`
			.onn("click", async () => {
				try {
					await pScalingCr;
				} catch (e) { setTimeout(() => { throw e; }); }

				pScalingCr = pDoScaleCr();
				await pScalingCr;
				pScalingCr = null;
			});
		comp._addHookBase("creature", () => {
			btnResetCr.prop("disabled", !comp._state.creature._isScaledCr);
		})();

		const stgCr = ee`<div class="ve-mr-2 ve-no-wrap ve-no-shrink ve-flex-v-center">
			<span class="ve-mr-2">CR</span>
			<div class="ve-flex-v-center ve-input-group">
				${iptCr}
				${btnResetCr}
			</div>
		</div>`;

		comp._addHookBase("creature", () => {
			iptCr.val(comp._state.creature.cr?.cr || comp._state.creature.cr);

			stgCr.toggleVe(ScaleCreature.isCrInScaleRange(comp._state.creature));

			if (!Renderer.monster.isScaled(comp._state.creature)) {
				dispCreature.html(`${this._rendererWrapped.er(`{@creature ${comp._state.creature.name}|${comp._state.creature.source}|${comp._state.creature._displayName || comp._state.creature.name}}`)}`);
				return;
			}

			dispCreature.empty().append(
				ee`<span class="ve-help ve-help--hover">${comp._state.creature._displayName || comp._state.creature.name}</span>`
					.onn("mouseover", evt => {
						return Renderer.hover.pHandleLinkMouseOver(
							evt,
							evt.currentTarget,
							{
								isSpecifiedLinkData: true,
								page: UrlUtil.PG_BESTIARY,
								source: comp._state.creature.source,
								hash: UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](comp._state.creature),
								customHashId: Renderer.monster.getCustomHashId(comp._state.creature),
							},
						);
					})
					.onn("mousemove", evt => Renderer.hover.handleLinkMouseMove(evt, evt.currentTarget))
					.onn("mouseleave", evt => Renderer.hover.handleLinkMouseLeave(evt, evt.currentTarget)),
			);
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
			btnShuffle.toggleClass("ve-disabled", comp._state.isLocked);
			btnDelete.toggleClass("ve-disabled", comp._state.isLocked);
		})();

		ee(wrpRow)`
			${wrpIptCount}
			${dispCreature}
			${stgCr}
			<div class="ve-btn-group ve-no-wrap ve-no-shrink ve-flex-v-center">
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

	constructor (
		{
			cache,
			comp,
			rulesComps,
			partyComps,
			encounterShapesLookup,
			rendererWrapped,

			headerTextSettings = "Settings",
		},
	) {
		if (!rendererWrapped) throw new Error(`Missing required "rendererWrapped" option!`);

		super();

		this._cache = cache;
		this._comp = comp;
		this._rulesComps = rulesComps;
		this._rulesCompsLookup = Object.fromEntries(this._rulesComps.map(comp => [comp.rulesId, comp]));
		this._partyComps = partyComps;
		this._partyCompsLookup = Object.fromEntries(this._partyComps.map(comp => [comp.partyId, comp]));
		this._encounterShapesLookup = encounterShapesLookup;
		this._rendererWrapped = rendererWrapped;

		this._headerTextSettings = headerTextSettings;

		this._state.activeRulesId = this._rulesComps[0].rulesId;
		this._state.activePartyId = this._partyComps[0].partyId;
	}

	addHookOnSave (hk) {
		const fns = [
			this._addHookAll("state", hk),
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
					eles.forEach(ele => ele.toggleVe(this._state.activeRulesId === rulesComp.rulesId));
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

		const wrpOutput = ee`<div class="ve-py-2 ecgen-viewer__wrp-output"></div>`
			.hideVe();

		ee(stgViewer)`
			<hr class="ve-hr-2">
			${wrpOutput}
		`;

		rdState.renderableCollectionViewerCreatures = new _RenderableCollectionViewerCreatures({
			comp: this._comp,
			wrpRows: wrpOutput,
			rendererWrapped: this._rendererWrapped,
		});

		this._comp.addHookCreatureMetas(() => {
			wrpOutput.toggleVe(!!this._comp.creatureMetas.length);

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
			.addClass("ve-w-120p");

		const stgParty = ee`<div class="ve-flex-col"></div>`;

		const stgGroupSummary = ee`<div class="ve-flex-col ve-w-40"></div>`;

		ee(stgGroup)`
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
					eles.forEach(ele => ele.toggleVe(this._state.activePartyId === partyComp.partyId));
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

		const dispSpent = ee`<div class="ve-ml-auto ve-small ve-self-flex-end"></div>`;
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
				.html(`<span class="ve-split-v-center ve-w-140p ve-no-shrink" title="The percentage of the encounter budget, for the currently-selected difficulty, allocated to encounter groups.">${htmlUnspentHeader}</span>`)
				.toggleClass("text-danger", !isComplete);

			const renderedCustomShapeGroups = this._comp._getRenderedCollection({prop: "customShapeGroups"});
			Object.entries(renderedCustomShapeGroups)
				.forEach(([id, meta]) => meta.setHtmlDispSpent(htmlRowsLookup[id]));
		};

		const wrpGroupsCustom = ee`<div class="ve-pb-2 ve-flex-col"></div>`;
		const wrpGroupsCustomEmpty = ee`<div class="ve-pb-2 ve-flex-vh-center">
			<i class="ve-muted ve-pt-2">Add a Custom Creature Group to begin.</i>
		</div>`;

		const renderableCollectionCustomShapeGroups = new _RenderableCollectionCustomShapeGroups({
			comp: this._comp,
			wrpRows: wrpGroupsCustom,
		});

		const ratioState = new _RatioState();

		this._comp.addHookCustomShapeGroups(() => {
			btnAutoAllocate.toggleClass("ve-disabled", !this._comp.customShapeGroups?.length);

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
			<div class="ve-split-v-center ve-my-2">
				<h4 class="ve-my-0">Custom Encounter</h4>
				<div class="ve-btn-group ve-flex-v-center">
					${btnAddGroup}
					${btnClearGroups}
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

		this._comp.addHookCreatureMetas(() => {
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
		};
	}
}
