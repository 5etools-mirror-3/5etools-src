export class StatGenUiRenderLevelOneEntityBase {
	_title;
	_titleShort;
	_propIxEntity;
	_propIxAbilityScoreSet;
	_propData;
	_propModalFilter;
	_propIsPreview;
	_propEntity;
	_page;
	_propChoiceMetasFrom;
	_propChoiceWeighted;

	constructor ({parent}) {
		this._parent = parent;

		this._pbHookMetas = [];
	}

	render () {
		const wrp = ee`<div class="ve-flex"></div>`;
		const wrpOuter = ee`<div class="ve-flex-col">
			<div class="my-1 statgen-pb__header statgen-pb__header--group mr-3 ve-text-center italic ve-small help-subtle" title="Ability Score Changes from ${this._title}">${this._titleShort}</div>

			${wrp}
		</div>`;

		// Ensure this is run first, and doesn't trigger further state changes
		this._parent._addHookBase(this._propIxEntity, () => this._parent.__state[this._propIxAbilityScoreSet] = 0);

		const hkIxEntity = (prop) => {
			this._pb_unhookRender();
			const isInitialLoad = prop == null;
			if (!isInitialLoad && !this._parent.isSettingStateFromOverwrite()) this._parent._state[this._propChoiceMetasFrom] = [];
			if (!isInitialLoad && !this._parent.isSettingStateFromOverwrite()) this._parent._state[this._propChoiceWeighted] = [];
			const isAnyFromEntity = this._render_pointBuy(wrp);
			wrpOuter.toggleVe(isAnyFromEntity);
		};
		this._parent._addHookBase(this._propIxEntity, hkIxEntity);
		this._bindAdditionalHooks_hkIxEntity(hkIxEntity);
		this._parent._addHookBase(this._propIxAbilityScoreSet, hkIxEntity);
		hkIxEntity();

		const {wrp: selEntity, setFnFilter: setFnFilterEntity} = ComponentUiUtil.getSelSearchable(
			this._parent,
			this._propIxEntity,
			{
				values: this._parent[this._propData].map((_, i) => i),
				isAllowNull: true,
				fnDisplay: ix => {
					const r = this._parent[this._propData][ix];
					if (!r) return "(Unknown)";
					return `${r.name} ${r.source !== Parser.SRC_PHB ? `[${Parser.sourceJsonToAbv(r.source)}]` : ""}`;
				},
				asMeta: true,
			},
		);

		const doApplyFilterToSelEntity = () => {
			const f = this._parent[this._propModalFilter].pageFilter.filterBox.getValues();
			setFnFilterEntity(value => {
				if (value == null) return true;

				const ent = this._parent[this._propData][value];
				return this._parent[this._propModalFilter].pageFilter.toDisplay(f, ent);
			});
		};

		this._parent[this._propModalFilter].pageFilter.filterBox.on(FILTER_BOX_EVNT_VALCHANGE, () => doApplyFilterToSelEntity());
		doApplyFilterToSelEntity();

		const btnFilterForEntity = ee`<button class="ve-btn ve-btn-xs ve-btn-default br-0 pr-2" title="Filter for ${this._title}"><span class="glyphicon glyphicon-filter"></span> Filter</button>`
			.onn("click", async () => {
				const selected = await this._parent[this._propModalFilter].pGetUserSelection();
				if (selected == null || !selected.length) return;

				const selectedEntity = selected[0];
				const ixEntity = this._parent[this._propData].findIndex(it => it.name === selectedEntity.name && it.source === selectedEntity.values.sourceJson);
				if (!~ixEntity) throw new Error(`Could not find selected ${this._title.toLowerCase()}: ${JSON.stringify(selectedEntity)}`); // Should never occur
				this._parent._state[this._propIxEntity] = ixEntity;
			});

		const btnPreview = ComponentUiUtil.getBtnBool(
			this._parent,
			this._propIsPreview,
			{
				html: `<button class="ve-btn ve-btn-xs ve-btn-default" title="Toggle ${this._title} Preview"><span class="glyphicon glyphicon-eye-open"></span></button>`,
			},
		);
		const hkBtnPreviewEntity = () => btnPreview.toggleVe(this._parent._state[this._propIxEntity] != null && ~this._parent._state[this._propIxEntity]);
		this._parent._addHookBase(this._propIxEntity, hkBtnPreviewEntity);
		hkBtnPreviewEntity();

		// region Ability score set selection
		const {sel: selAbilitySet, setValues: setValuesSelAbilitySet} = ComponentUiUtil.getSelEnum(
			this._parent,
			this._propIxAbilityScoreSet,
			{
				values: [],
				asMeta: true,
				fnDisplay: ixAbSet => {
					const lst = this._pb_getAbilityList();
					if (!lst?.[ixAbSet]) return "(Unknown)";
					return Renderer.getAbilityData([lst[ixAbSet]]).asText;
				},
			},
		);

		const stgAbilityScoreSet = ee`<div class="ve-flex-v-center mb-2">
			<div class="mr-2 no-wrap">Ability Score Increase</div>
			<div>${selAbilitySet}</div>
		</div>`;

		const hkSetValuesSelAbilitySet = () => {
			const entity = this._parent[this._propEntity];
			stgAbilityScoreSet.toggleVe(!!entity && entity.ability?.length > 1);

			// Set to empty array between real sets, as otherwise two matching sets of list indices
			//   will be considered "the same list," even though their display will ultimately be different.
			// Using a blank list here forces any real list to cause a refresh.
			setValuesSelAbilitySet([]);

			setValuesSelAbilitySet(
				[...new Array(entity?.ability?.length || 0)].map((_, ix) => ix),
			);
		};
		this._parent._addHookBase(this._propIxEntity, hkSetValuesSelAbilitySet);
		this._bindAdditionalHooks_hkSetValuesSelAbilitySet(hkSetValuesSelAbilitySet);
		hkSetValuesSelAbilitySet();
		// endregion

		const dispPreview = ee`<div class="ve-flex-col mb-2"></div>`;
		const hkPreviewEntity = () => {
			if (!this._parent._state[this._propIsPreview]) return dispPreview.hideVe();

			const entity = this._parent._state[this._propIxEntity] != null ? this._parent[this._propData][this._parent._state[this._propIxEntity]] : null;
			if (!entity) return dispPreview.hideVe();

			// eslint-disable-next-line vet-jquery/jquery
			dispPreview.empty().showVe().appends(Renderer.hover.$getHoverContent_stats(this._page, entity)[0]);
		};
		this._parent._addHookBase(this._propIxEntity, hkPreviewEntity);
		this._parent._addHookBase(this._propIsPreview, hkPreviewEntity);
		hkPreviewEntity();

		const {hrPreview} = this._getHrPreviewMeta();

		const stgSel = ee`<div class="ve-flex-col mt-3">
			<div class="mb-1">Select a ${this._title}</div>
			<div class="ve-flex-v-center mb-2">
				<div class="ve-flex-v-center ve-btn-group w-100 mr-2">${btnFilterForEntity}${selEntity}</div>
				<div>${btnPreview}</div>
			</div>
			${stgAbilityScoreSet}
		</div>`;

		return {
			wrpOuter,

			stgSel,

			dispPreview,
			hrPreview,
		};
	}

	_pb_unhookRender () {
		this._pbHookMetas.forEach(it => it.unhook());
		this._pbHookMetas = [];
	}

	_render_pointBuy (wrp) {
		wrp.empty();

		const fromEntity = this._pb_getAbility();
		if (fromEntity == null) return false;

		let ptBase = null;
		if (Parser.ABIL_ABVS.some(it => fromEntity[it])) {
			const wrpsEntity = Parser.ABIL_ABVS.map(ab => {
				return ee`<div class="my-1 statgen-pb__cell">
					<input class="form-control form-control--minimal statgen-shared__ipt ve-text-right" type="number" readonly value="${fromEntity[ab] || 0}">
				</div>`;
			});

			ptBase = ee`<div class="ve-flex-col mr-3">
				<div class="my-1 statgen-pb__header ve-flex-vh-center">Static</div>
				${wrpsEntity}
			</div>`;
		}

		let ptChooseFrom = null;
		if (fromEntity.choose && fromEntity.choose.from) {
			const amount = fromEntity.choose.amount || 1;
			const count = fromEntity.choose.count || 1;

			const wrpsChoose = Parser.ABIL_ABVS.map(ab => {
				if (!fromEntity.choose.from.includes(ab)) return `<div class="my-1 statgen-pb__cell"></div>`;

				const cb = ee`<input type="checkbox">`
					.onn("change", () => {
						const existing = this._parent._state[this._propChoiceMetasFrom].find(it => it.ability === ab);
						if (existing) {
							this._parent._state[this._propChoiceMetasFrom] = this._parent._state[this._propChoiceMetasFrom].filter(it => it !== existing);
							return;
						}

						// If we're already at the max number of choices, remove the oldest one
						if (this._parent._state[this._propChoiceMetasFrom].length >= count) {
							while (this._parent._state[this._propChoiceMetasFrom].length >= count) this._parent._state[this._propChoiceMetasFrom].shift();
							this._parent._state[this._propChoiceMetasFrom] = [...this._parent._state[this._propChoiceMetasFrom]];
						}

						this._parent._state[this._propChoiceMetasFrom] = [
							...this._parent._state[this._propChoiceMetasFrom],
							{ability: ab, amount},
						];
					});

				const hk = () => cb.prop("checked", this._parent._state[this._propChoiceMetasFrom].some(it => it.ability === ab));
				this._parent._addHookBase(this._propChoiceMetasFrom, hk);
				this._pbHookMetas.push({unhook: () => this._parent._removeHookBase(this._propChoiceMetasFrom, hk)});
				hk();

				return ee`<label class="my-1 statgen-pb__cell ve-flex-vh-center">${cb}</label>`;
			});

			ptChooseFrom = ee`<div class="ve-flex-col mr-3">
				<div class="my-1 statgen-pb__header statgen-pb__header--choose-from ve-flex-vh-center">
					<div class="${count !== 1 ? `mr-1` : ""}">${UiUtil.intToBonus(amount, {isPretty: true})}</div>${count !== 1 ? `<div class="ve-small ve-muted">(x${count})</div>` : ""}
				</div>
				${wrpsChoose}
			</div>`;
		}

		let ptsChooseWeighted = null;
		if (fromEntity.choose && fromEntity.choose.weighted && fromEntity.choose.weighted.weights) {
			ptsChooseWeighted = fromEntity.choose.weighted.weights.map((weight, ixWeight) => {
				const wrpsChoose = Parser.ABIL_ABVS.map(ab => {
					if (!fromEntity.choose.weighted.from.includes(ab)) return `<div class="my-1 statgen-pb__cell"></div>`;

					const cb = ee`<input type="checkbox">`
						.onn("change", () => {
							const existing = this._parent._state[this._propChoiceWeighted].find(it => it.ability === ab && it.ix === ixWeight);
							if (existing) {
								this._parent._state[this._propChoiceWeighted] = this._parent._state[this._propChoiceWeighted].filter(it => it !== existing);
								return;
							}

							// Remove other selections for the same ability score, or selections for the same weight
							const withSameAbil = this._parent._state[this._propChoiceWeighted].filter(it => it.ability === ab || it.ix === ixWeight);
							if (withSameAbil.length) {
								this._parent._state[this._propChoiceWeighted] = this._parent._state[this._propChoiceWeighted].filter(it => it.ability !== ab && it.ix !== ixWeight);
							}

							this._parent._state[this._propChoiceWeighted] = [
								...this._parent._state[this._propChoiceWeighted],
								{ability: ab, amount: weight, ix: ixWeight},
							];
						});

					const hk = () => {
						cb.prop("checked", this._parent._state[this._propChoiceWeighted].some(it => it.ability === ab && it.ix === ixWeight));
					};
					this._parent._addHookBase(this._propChoiceWeighted, hk);
					this._pbHookMetas.push({unhook: () => this._parent._removeHookBase(this._propChoiceWeighted, hk)});
					hk();

					return ee`<label class="my-1 statgen-pb__cell ve-flex-vh-center">${cb}</label>`;
				});

				return ee`<div class="ve-flex-col mr-3">
					<div class="my-1 statgen-pb__header statgen-pb__header--choose-from ve-flex-vh-center">${UiUtil.intToBonus(weight, {isPretty: true})}</div>
					${wrpsChoose}
				</div>`;
			});
		}

		ee(wrp)`
				${ptBase}
				${ptChooseFrom}
				${ptsChooseWeighted}
			`;

		return ptBase || ptChooseFrom || ptsChooseWeighted;
	}

	/** @abstract */
	_pb_getAbilityList () { throw new Error("Unimplemented!"); }

	/** @abstract */
	_pb_getAbility () { throw new Error("Unimplemented!"); }

	_bindAdditionalHooks_hkIxEntity (hkIxEntity) { /* Implement as required */ }
	_bindAdditionalHooks_hkSetValuesSelAbilitySet (hkSetValuesSelAbilitySet) { /* Implement as required */ }

	_getHrPreviewMeta () {
		const hrPreview = ee`<hr class="hr-3">`;
		const hkPreview = this._getHkPreview({hrPreview});
		this._parent._addHookBase(this._propIsPreview, hkPreview);
		hkPreview();

		return {
			hrPreview,
			hkPreview,
		};
	}

	_getHkPreview ({hrPreview}) {
		return () => hrPreview.toggleVe(this._parent._state[this._propIsPreview]);
	}
}
