"use strict";

class PageFilterDeities extends PageFilterBase {
	static unpackAlignment (ent) {
		ent.alignment.sort(SortUtil.alignmentSort);
		if (ent.alignment.length === 2 && ent.alignment.includes("N")) {
			const out = [...ent.alignment];
			if (out[0] === "N") out[0] = "NX";
			else out[1] = "NY";
			return out;
		}
		return MiscUtil.copy(ent.alignment);
	}

	constructor () {
		super();
		this._pantheonFilter = new Filter({header: "Pantheon", items: []});
		this._categoryFilter = new Filter({header: "Category", items: [VeCt.STR_NONE]});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			items: ["L", "NX", "C", "G", "NY", "E", "N"],
			displayFn: it => Parser.alignmentAbvToFull(it).toTitleCase(),
			itemSortFn: null,
		});
		this._domainFilter = new Filter({
			header: "Domain",
			items: ["Death", "Knowledge", "Life", "Light", "Nature", VeCt.STR_NONE, "Tempest", "Trickery", "War"],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Grants Piety Features", "Has Info", "Has Images", "Reprinted", "SRD", "Basic Rules", "Legacy"],
			displayFn: StrUtil.uppercaseFirst,
			deselFn: (it) => it === "Reprinted",
			isMiscFilter: true,
		});
	}

	static mutateForFilters (ent) {
		ent._fAlign = ent.alignment ? PageFilterDeities.unpackAlignment(ent) : [];
		if (!ent.category) ent.category = VeCt.STR_NONE;
		if (!ent.domains) ent.domains = [VeCt.STR_NONE];
		ent.domains.sort(SortUtil.ascSort);

		ent._fMisc = [];
		if (ent.reprinted) ent._fMisc.push("Reprinted");
		if (ent.srd) ent._fMisc.push("SRD");
		if (ent.basicRules) ent._fMisc.push("Basic Rules");
		if (SourceUtil.isLegacySourceWotc(ent.source)) ent._fMisc.push("Legacy");
		if (ent.entries) ent._fMisc.push("Has Info");
		if (ent.symbolImg) ent._fMisc.push("Has Images");
		if (ent.piety) ent._fMisc.push("Grants Piety Features");
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(ent.source);
		this._domainFilter.addItem(ent.domains);
		this._pantheonFilter.addItem(ent.pantheon);
		this._categoryFilter.addItem(ent.category);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._alignmentFilter,
			this._pantheonFilter,
			this._categoryFilter,
			this._domainFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, g) {
		return this._filterBox.toDisplay(
			values,
			g.source,
			g._fAlign,
			g.pantheon,
			g.category,
			g.domains,
			g._fMisc,
		);
	}
}

globalThis.PageFilterDeities = PageFilterDeities;

class ListSyntaxDeities extends ListUiUtil.ListSyntax {
	_getSearchCacheStats (entity) {
		const ptrOut = {_: ""};

		const entriesMeta = Renderer.deity.getDeityRenderableEntriesMeta(entity);
		Object.entries(entriesMeta.entriesAttributes)
			.forEach(entry => this._getSearchCache_handleEntry(entry, ptrOut));

		return ptrOut._;
	}

	/** Treat entries on the deity as "fluff" */
	async _pGetSearchCacheFluff (entity) {
		return this._getSearchCache_entries(entity, {indexableProps: ["entries"]});
	}
}

globalThis.ListSyntaxDeities = ListSyntaxDeities;
