"use strict";

class RenderTables {
	static _getPartTableFrom (it) {
		if (it.chapter) {
			return `<tr><td colspan="6">
				${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table` : "These tables"} can be found in ${Parser.sourceJsonToFull(it.source)}${Parser.bookOrdinalToAbv(it.chapter.ordinal, {isPreNoSuff: true})}, {@book ${it.chapter.name}|${it.source}|${it.chapter.index}|${it.chapter.name}}.}`)}
			</td></tr>`;
		}

		if (!it.parentEntity?.prop || !it.parentEntity?.uid) return "";

		const tag = Parser.getPropTag(it.parentEntity.prop);
		const unpacked = DataUtil.proxy.unpackUid(it.parentEntity.prop, it.parentEntity.uid, tag);
		switch (it.parentEntity.prop) {
			case "class": {
				return `<tr><td colspan="6">
						${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table is` : "These tables are"} from the {@class ${unpacked.name}|${unpacked.source}} class.}`)}
					</td></tr>`;
			}

			case "subclass": {
				return `<tr><td colspan="6">
						${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table is` : "These tables are"} from the {@class ${unpacked.className}|${unpacked.classSource}|${unpacked.name}|${unpacked.shortName}|${unpacked.source}} <span title="Source: ${Parser.sourceJsonToFull(unpacked.classSource)}">${unpacked.className}</span> subclass.}`)}
					</td></tr>`;
			}

			default: {
				const displayName = Parser.getPropDisplayName(it.parentEntity.prop);

				return `<tr><td colspan="6">
						${Renderer.get().render(`{@note ${it.__prop === "table" ? `This table is` : "These tables are"} from the {@${tag} ${unpacked.name}|${unpacked.source}} ${displayName.toLowerCase()}.}`)}
					</td></tr>`;
			}
		}
	}

	static getRenderedTable (it) {
		it.type = it.type || "table";

		const ptFrom = this._getPartTableFrom(it);

		return ee`
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
