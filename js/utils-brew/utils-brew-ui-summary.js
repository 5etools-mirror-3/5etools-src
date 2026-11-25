export class BrewSummaryUi {
	static _BLOCKLIST_NAMES = {
		"classFeature": new Set(["Ability Score Improvement"]),
	};

	static getBrewSummary ({brew}) {
		return Object.fromEntries(
			Object.entries(brew)
				.filter(([k, arr]) => {
					if (k.startsWith("_")) return false;

					if (k.startsWith("foundry") || k.endsWith("Fluff")) return false;
					if (["adventureData", "bookData"].includes(k)) return false;

					if (arr == null || !(arr instanceof Array)) return false;

					return true;
				})
				.map(([prop, arr]) => {
					return [
						prop,
						arr
							.map(ent => {
								if (typeof ent?.name !== "string" || !ent.name) return null;
								return {
									name: ent.name,
									page: SourceUtil.getEntityPage(ent),
								};
							})
							.filter(Boolean)
							.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSort(a.page, b.page)),
					];
				})
				.filter(([, metas]) => metas.length),
		);
	}

	static getRenderedBrewSummary ({brewSummary, isCollapsible = false}) {
		if (!Object.keys(brewSummary).length) return veT`<div class="ve-muted ve-italic ve-flex-vh-center">(No content.)</div>`;

		const propMetas = Object.entries(brewSummary)
			.map(([prop, metas]) => [Parser.getPropDisplayName(prop), {prop, metas}])
			.sort(([propNameA], [propNameB]) => SortUtil.ascSortLower(propNameA, propNameB))
			.map(([propName, {prop, metas}], ix, arr) => {
				const metasFilt = metas
					.filter(meta => !this._BLOCKLIST_NAMES[prop]?.has(meta.name))
					.filter(
						function (meta) { return this.has(meta.name) ? false : this.add(meta.name); },
						new Set(),
					);

				const dispToggleExpand = isCollapsible ? veT`<span class="ve-mr-2" title="SHIFT-Click to Toggle All">[+]</span>` : null;

				const dispHeader = veT`<div class="ve-w-100 ve-py-1 ve-bb-1p-trans ve-flex-v-center">
					${dispToggleExpand}
					<b class="ve-mr-1">${propName.qq()}</b>
					<span class="ve-muted" title="Note that duplicate/unwanted names are not displayed in the list below.">(${metas.length})</span>
				</div>`;
				if (isCollapsible) {
					dispHeader
						.vee.onn("click", evt => {
							evt.stopPropagation();
							evt.preventDefault();

							const isExpand = doToggle();

							if (!evt.shiftKey) return;

							propMetas
								.filter(propMeta => propMeta !== out)
								.forEach(propMeta => propMeta.doToggle({isExpand}));
						});
				}

				const htmlLis = metasFilt
					.map(meta => {
						return `<div class="ve-w-100 ve-pr-1p ve-py-1p ve-flex ve-relative">
							<span class="ve-no-shrink">${meta.name.qq()}</span>${meta.page ? `<span class="ve-w-100 ve-min-w-0 ve-relative ve-top-n3p ve-mx-1 ve-bb-1p manbrew-get-preview__sep-page"></span><span class="ve-no-shrink ve-muted ve-small-caps" title="Page ${`${meta.page}`.qq()}">p${`${meta.page}`.qq()}</span>` : ""}
						</div>`;
					})
					.join("");

				const dispBody = veT`<div class="ve-mb-0 ve-columns-3 ve-pl-4 ve-mt-1 ${isCollapsible ? "ve-hidden" : ""}">
					${htmlLis}
				</div>`;

				const doToggle = ({isExpand = null} = {}) => {
					isExpand ??= dispToggleExpand.vee.txt() === "[+]";
					dispToggleExpand.vee.txt(isExpand ? `[\u2212]` : "[+]");

					dispBody.vee.toggle(isExpand);

					return isExpand;
				};
				if (isCollapsible && arr.length === 1) doToggle();

				const out = {
					wrp: veT`<div class="ve-flex-col ve-w-100">
						${dispHeader}
						${dispBody}
					</div>`,
					doToggle,
				};

				return out;
			});

		return veT`<div class="ve-flex-col ve-w-100">${propMetas.map(meta => meta.wrp)}</div>`;
	}
}
