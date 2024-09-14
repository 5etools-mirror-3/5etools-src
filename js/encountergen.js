"use strict";

class EncountersPage extends TableListPage {
	constructor () {
		super({
			dataSource: "data/encounters.json",

			dataProps: ["encounter"],
		});
	}

	static _COL_NAME_1 = "Encounter";

	static _FN_SORT (a, b, o) {
		if (o.sortBy === "name") return SortUtil.ascSortEncounter(a, b);
		if (o.sortBy === "source") return SortUtil.ascSortLower(a.source, b.source) || SortUtil.ascSortEncounter(a, b);
		return 0;
	}

	_getHash (ent) {
		return UrlUtil.encodeForHash([ent.name, ent.source, `${ent.minlvl ?? 0}-${ent.maxlvl ?? 0}-${ent.caption || ""}`]);
	}

	_getHeaderId (ent) {
		return UrlUtil.encodeForHash([ent.name, ent.source]);
	}

	_getDisplayName (ent) {
		return Renderer.table.getConvertedEncounterTableName(ent, ent);
	}
}

const encountersPage = new EncountersPage();
window.addEventListener("load", () => encountersPage.pOnLoad());
