import {StatGenUiRenderLevelOneEntityBase} from "./statgen-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneRace extends StatGenUiRenderLevelOneEntityBase {
	_title = "Species";
	_titleShort = "Species";
	_propIxEntity = "common_ixRace";
	_propIxAbilityScoreSet = "common_ixAbilityScoreSetRace";
	_propData = "_races";
	_propModalFilter = "_modalFilterRaces";
	_propIsPreview = "common_isPreviewRace";
	_propEntity = "race";
	_page = UrlUtil.PG_RACES;
	_propChoiceMetasFrom = "common_raceChoiceMetasFrom";
	_propChoiceWeighted = "common_raceChoiceMetasWeighted";

	render () {
		const out = super.render();

		const {stgTashasControls, dispTashas} = this._getPtsTashas();

		out.stgSel.appends(stgTashasControls);

		out.dispTashas = dispTashas;

		return out;
	}

	_pb_getAbilityList () {
		return this._parent._pb_getRaceAbilityList();
	}

	_pb_getAbility () {
		return this._parent._pb_getRaceAbility();
	}

	_bindAdditionalHooks_hkIxEntity (hkIxEntity) {
		this._parent._addHookBase("common_isTashas", hkIxEntity);
		this._parent._addHookBase("common_isAllowTashasRules", hkIxEntity);
	}

	_bindAdditionalHooks_hkSetValuesSelAbilitySet (hkSetValuesSelAbilitySet) {
		this._parent._addHookBase("common_isTashas", hkSetValuesSelAbilitySet);
		this._parent._addHookBase("common_isAllowTashasRules", hkSetValuesSelAbilitySet);
	}

	_getHrPreviewMeta () {
		const out = super._getHrPreviewMeta();
		const {hkPreview} = out;
		this._parent._addHookBase("common_isShowTashasRules", hkPreview);
		this._parent._addHookBase("common_isAllowTashasRules", hkPreview);
		return out;
	}

	_getHkPreview ({hrPreview}) {
		return () => hrPreview.toggleVe(this._parent._state[this._propIsPreview] && this._parent._state.common_isShowTashasRules && this._parent._state.common_isAllowTashasRules);
	}

	_getPtsTashas () {
		const btnToggleTashasPin = ComponentUiUtil.getBtnBool(
			this._parent,
			"common_isShowTashasRules",
			{
				html: `<button class="ve-btn ve-btn-xxs ve-btn-default ve-small p-0 statgen-shared__btn-toggle-tashas-rules ve-flex-vh-center" title="Toggle &quot;Customizing Your Origin&quot; Section"><span class="glyphicon glyphicon-eye-open"></span></button>`,
			},
		);

		const stgTashasControls = ee`<div class="ve-flex-col w-100">
			<label class="ve-flex-v-center mb-1">
				<div class="mr-2">Allow Origin Customization</div>
				${ComponentUiUtil.getCbBool(this._parent, "common_isTashas")}
			</label>

			<div class="ve-flex">
				<div class="ve-small ve-muted italic mr-1">${Renderer.get().render(`An {@variantrule Customizing Your Origin|TCE|optional rule}`)}</div>
				${btnToggleTashasPin}
				<div class="ve-small ve-muted italic ml-1">${Renderer.get().render(`from Tasha's Cauldron of Everything, page 8.`)}</div>
			</div>
		</div>`;
		this._parent._addHookBase("common_isAllowTashasRules", () => {
			stgTashasControls.toggleVe(this._parent._state.common_isAllowTashasRules);
		})();

		const dispTashas = ee`<div class="ve-flex-col"><div class="italic ve-muted">Loading...</div></div>`;
		DataLoader.pCacheAndGet(UrlUtil.PG_VARIANTRULES, Parser.SRC_TCE, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIANTRULES]({name: "Customizing Your Origin", source: Parser.SRC_TCE}))
			.then(rule => {
				// eslint-disable-next-line vet-jquery/jquery
				ee(dispTashas.empty())`${Renderer.hover.$getHoverContent_stats(UrlUtil.PG_VARIANTRULES, rule)[0]}<hr class="hr-3">`;
			});
		const hkIsShowTashas = () => {
			dispTashas.toggleVe(this._parent._state.common_isShowTashasRules && this._parent._state.common_isAllowTashasRules);
		};
		this._parent._addHookBase("common_isShowTashasRules", hkIsShowTashas);
		this._parent._addHookBase("common_isAllowTashasRules", hkIsShowTashas);
		hkIsShowTashas();

		return {
			stgTashasControls,
			dispTashas,
		};
	}
}
