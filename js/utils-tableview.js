"use strict";

class UtilsTableview {
	static _RenderState = class {
		constructor () {
			this.comp = null;
			this.rows = [];
			this.metasCbs = [];
		}
	};

	static show ({title, entities, colTransforms, additionalData, sorter}) {
		const {eleModal} = UiUtil.getShowModal({
			isWidth100: true,
			isHeight100: true,
			isUncappedWidth: true,
			isUncappedHeight: true,
			isEmpty: true,
		});

		const rdState = new UtilsTableview._RenderState();

		rdState.comp = BaseComponent.fromObject(
			Object.keys(colTransforms).mergeMap(k => ({[k]: true})),
		);

		const cbAll = ee`<input type="checkbox" title="Select All" checked>`
			.onn("click", () => {
				const val = cbAll.prop("indeterminate") ? false : cbAll.prop("checked");

				rdState.comp._proxyAssignSimple(
					"state",
					Object.keys(colTransforms).mergeMap(k => ({[k]: val})),
				);
			});

		rdState.metasCbs = Object.entries(colTransforms)
			.map(([prop, meta]) => {
				const cb = ComponentUiUtil.getCbBool(rdState.comp, prop);

				const wrp = ee`<label class="px-2 py-1 no-wrap ve-flex-inline-v-center">
					${cb}
					<span>${meta.name}</span>
				</label>`;

				return {wrp, name: meta.name};
			});

		Object.keys(colTransforms)
			.forEach((prop, i) => {
				rdState.comp._addHookBase(prop, () => {
					const propsSelected = Object.keys(colTransforms).map(prop => rdState.comp._state[prop]);
					if (propsSelected.every(Boolean)) cbAll.prop("checked", true);
					else if (propsSelected.every(it => !it)) cbAll.prop("checked", false);
					else cbAll.prop("indeterminate", true).prop("checked", true);

					const eles = eleModal.findAll(`[data-col="${i}"]`);
					eles.forEach(ele => ele.toggleVe(rdState.comp._state[prop]));
				});
			});

		const btnCsv = ee`<button class="ve-btn ve-btn-primary">Download CSV</button>`.onn("click", () => {
			DataUtil.userDownloadText(`${title}.csv`, this._getAsCsv({colTransforms, rdState}));
		});

		const btnCopy = ee`<button class="ve-btn ve-btn-primary">Copy CSV to Clipboard</button>`.onn("click", async () => {
			await MiscUtil.pCopyTextToClipboard(this._getAsCsv({colTransforms, rdState}));
			JqueryUtil.showCopiedEffect(btnCopy);
		});

		const wrpRows = ee`<div class="ve-overflow-y-auto w-100 h-100 ve-flex-col ve-overflow-x-auto"></div>`;

		ee(eleModal)`<div class="ve-flex-v-center my-3">
			<label class="ve-flex-vh-center pl-2 pr-3 h-100">${cbAll}</label>
			<div class="vr-2 ml-0 h-100"></div>
			<div class="ve-flex-v-center ve-flex-wrap w-100 min-w-0">${rdState.metasCbs.map(({wrp}) => wrp)}</div>
			<div class="vr-2 h-100"></div>
			<div class="ve-btn-group no-shrink ve-flex-v-center ml-3">
				${btnCsv}
				${btnCopy}
			</div>
		</div>
		<hr class="hr-1">
		${wrpRows}
		`;

		const tableHtml = this._getTableHtml({rdState, entities, colTransforms, additionalData, sorter});
		wrpRows.html(tableHtml);
	}

	static _getAsCsv ({colTransforms, rdState}) {
		const headersActive = Object.entries(colTransforms)
			.map(([prop, meta], ix) => ({name: meta.name, ix, isSelected: rdState.comp._state[prop]}))
			.filter(({isSelected}) => isSelected);

		const parser = new DOMParser();
		const rows = rdState.rows
			.map(row => {
				return headersActive
					.map(({ix}) => {
						const asText = parser.parseFromString(`<div>${row[ix]}</div>`, "text/html").documentElement.textContent || "";
						return asText
							.trim()
							.split("\n")
							.map(it => it.trim())
							.join("\n")
							.replace(/\n\n+/g, "\n\n")
						;
					});
			});
		return DataUtil.getCsv(headersActive.map(({name}) => name), rows);
	}

	static _getTableHtml ({rdState, entities, colTransforms, additionalData, sorter, styleHint = null}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		let stack = `<table class="w-100 table-striped stats stats--book stats--book-large min-w-100 w-initial">
			<thead>
				<tr>${Object.values(colTransforms).map((c, i) => `<th data-col="${i}" class="ve-text-left px-2" colspan="${c.flex || 1}">${c.name}</th>`).join("")}</tr>
			</thead>
			<tbody>`;

		const listCopy = [...entities];
		if (sorter) listCopy.sort(sorter);
		listCopy.forEach(it => {
			stack += `<tr class="tview__row">`;
			const row = [];
			stack += Object.keys(colTransforms).map((k, i) => {
				const c = colTransforms[k];
				const val = c.transform == null ? it[k] : c.transform(k[0] === "_" ? it : it[k], additionalData, {styleHint});
				row.push(val);
				return `<td data-col="${i}" class="px-2" colspan="${c.flex || 1}">${val || ""}</td>`;
			}).join("");
			rdState.rows.push(row);
			stack += `</tr>`;
		});

		stack += `</tbody></table>`;

		return stack;
	}

	// region Default/generic transforms
	static COL_TRANSFORM_NAME = {name: "Name"};
	static COL_TRANSFORM_SOURCE = {name: "Source", transform: (it) => `<span class="${Parser.sourceJsonToSourceClassname(it)}" title="${Parser.sourceJsonToFull(it)}">${Parser.sourceJsonToAbv(it)}</span>`};
	static COL_TRANSFORM_PAGE = {name: "Page"};
	// endregion
}
