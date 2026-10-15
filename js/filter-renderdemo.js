import {PageFilterBase} from "./filter/filter-page-filter-base.js";
import {ModalFilterBase} from "./filter/filter-modal-filter-base.js";

class PageFilterRenderDemo extends PageFilterBase {
	static mutateForFilters (ent) { /* Implement as required */ }

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;
		this._sourceFilter.addItem(ent.source);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
		];
	}

	toDisplay (values, sample) { return this._filterBox.toDisplay(values, sample.source); }
}

class ListUiPreviewButtonHandlerRenderDemo extends ListUiPreviewButtonHandlerBase {
	_doAppendPrimaryView ({entity, elePreviewWrpInner}) {
		elePreviewWrpInner.vee.appends(
			Renderer.get().setFirstSection(true).render(MiscUtil.copyFast(entity.entry)),
		);
	}
}

export class ModalFilterRenderDemo extends ModalFilterBase {
	constructor ({allData}) {
		super({
			modalTitle: "Entry Samples",
			isRadio: true,
			allData,
			pageFilter: new PageFilterRenderDemo(),
			previewButtonHandler: new ListUiPreviewButtonHandlerRenderDemo(),
		});
	}

	_getColumnHeaders () {
		return ModalFilterBase._getFilterColumnHeaders([
			{sort: "name", text: "Name", width: "9"},
			{sort: "source", text: "Source", width: "2"},
		]);
	}

	_getListItem (pageFilter, ent, id) {
		const cbSel = veT`<input type="radio" name="renderdemo-sample" class="ve-no-events">`;
		const btnShowHidePreview = veT`<div class="ve-ui-list__btn-inline ve-px-2 ve-no-select" title="Toggle Preview">[+]</div>`;

		const ele = veT`<div class="ve-px-0 ve-w-100 ve-flex-col ve-no-shrink">
			<div class="ve-w-100 ve-flex-vh-center ve-lst__row-border veapp__list-row ve-no-select ve-lst__wrp-cells">
				<div class="ve-col-0-5 ve-pl-0 ve-flex-vh-center">${cbSel}</div>
				<div class="ve-col-0-5 ve-px-1 ve-flex-vh-center">${btnShowHidePreview}</div>
				<div class="ve-col-9 ve-px-1 ${this._getNameStyle()}">${ent.name.qq()}</div>
				<div class="ve-col-2 ve-pl-1 ve-pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(ent.source)}" title="${Parser.sourceJsonToFull(ent.source).qq()}">${Parser.sourceJsonToAbv(ent.source).qq()}</div>
			</div>
		</div>`;

		const listItem = new ListItem({
			id,
			ele,
			name: ent.name,
			values: {source: ent.source, sourceJson: ent.source},
			data: {entity: ent, cbSel, btnShowHidePreview},
		});

		this._previewButtonHandler.bindPreviewButton({entity: ent, listItem, btnShowHidePreview});

		return listItem;
	}
}
