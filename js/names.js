import {TableListPage} from "./tablepage.js";

class NamesPage extends TableListPage {
	constructor () {
		super({
			dataSource: "data/names.json",

			dataProps: ["name"],

			bookViewOptions: {
				nameSingular: "table",
				namePlural: "tables",
				pageTitle: "Names Book View",
			},
		});
	}

	_getHeaderId (ent) {
		return UrlUtil.encodeForHash([ent.name, ent.source]);
	}

	_getDisplayName (ent) {
		return Renderer.names.getDisplayName(ent);
	}

	_getRenderedTable (ent) {
		return RenderNames.getRenderedNameTable(ent);
	}
}

const namesPage = new NamesPage();
window.addEventListener("load", () => namesPage.pOnLoad());
