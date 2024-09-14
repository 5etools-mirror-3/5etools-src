"use strict";

class NamesPage extends TableListPage {
	constructor () {
		super({
			dataSource: "data/names.json",

			dataProps: ["name"],
		});
	}

	static _COL_NAME_1 = "Name";

	_getHash (ent) {
		return UrlUtil.encodeForHash([ent.name, ent.source, ent.option]);
	}

	_getHeaderId (ent) {
		return UrlUtil.encodeForHash([ent.name, ent.source]);
	}

	_getDisplayName (ent) {
		return Renderer.table.getConvertedNameTableName(ent, ent);
	}
}

const namesPage = new NamesPage();
window.addEventListener("load", () => namesPage.pOnLoad());
