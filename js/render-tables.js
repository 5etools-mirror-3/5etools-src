"use strict";

class RenderTables {
	static _getPartTableFrom (it) {
		if (it.parentEntity) {
			switch (it.parentEntity.type) {
				case "class": {
					return `<tr><td colspan="6">
						${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table is` : "These tables are"} from the {@class ${it.parentEntity.name}|${it.parentEntity.source}} class.}`)}
					</td></tr>`;
				}

				case "subclass": {
					return `<tr><td colspan="6">
						${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table is` : "These tables are"} from the {@class ${it.parentEntity.className}|${it.parentEntity.classSource}|${it.parentEntity.name}|${it.parentEntity.shortName}|${it.parentEntity.source}} <span title="Source: ${Parser.sourceJsonToFull(it.parentEntity.classSource)}">${it.parentEntity.className}</span> subclass.}`)}
					</td></tr>`;
				}

				default: {
					const tag = Parser.getPropTag(it.parentEntity.type);
					const displayName = Parser.getPropDisplayName(it.parentEntity.type);

					return `<tr><td colspan="6">
						${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table is` : "These tables are"} from the {@${tag} ${it.parentEntity.name}|${it.parentEntity.source}} ${displayName.toLowerCase()}.}`)}
					</td></tr>`;
				}
			}
		}

		if (it.chapter) {
			return `<tr><td colspan="6">
				${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table` : "These tables"} can be found in ${Parser.sourceJsonToFull(it.source)}${Parser.bookOrdinalToAbv(it.chapter.ordinal, {isPreNoSuff: true})}, {@book ${it.chapter.name}|${it.source}|${it.chapter.index}|${it.chapter.name}}.}`)}
			</td></tr>`;
		}

		return "";
	}

	static $getRenderedTable (it) {
		it.type = it.type || "table";

		const ptFrom = this._getPartTableFrom(it);

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: it, dataProp: "table"})}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TABLES})}
		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
		<tr><td colspan="6">${Renderer.get().setFirstSection(true).render(it)}</td></tr>
		${ptFrom}
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}`;
	}
}
