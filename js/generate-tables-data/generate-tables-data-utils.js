import {
	RecursiveSearchStateClass,
	RecursiveSearchStateCorpus, RecursiveSearchStateGeneric,
	RecursiveSearchStateSubclass,
} from "./generate-tables-data-models.js";

export class UtilGenTables {
	static _doSearch ({state, tmpMeta, section, entry}) {
		const genTablesData = entry.data?.genTables || {};

		if (genTablesData.tableIgnore) return;

		if (entry.entries) {
			const isPushPath = entry.name || entry.page;
			if (isPushPath) state.pushPath({name: entry.name, page: entry.page});
			entry.entries.forEach(ent => this._doSearch({...arguments[0], section: entry.name || section, entry: ent}));
			if (isPushPath) state.popPath();
			return;
		}

		if (entry.items) {
			const isPushPath = entry.name || entry.page;
			if (isPushPath) state.pushPath({name: entry.name, page: entry.page});
			entry.items.forEach(item => this._doSearch({...arguments[0], entry: item}));
			if (isPushPath) state.popPath();
			return;
		}

		if (entry.type === "table" || entry.type === "tableGroup") {
			const cpy = MiscUtil.copy(entry);

			cpy._tmpMeta = MiscUtil.copy(tmpMeta);
			cpy.path = state.getPath();
			cpy.section = section;
			cpy.sectionIndex = state.getNextSectionIndex({chapterName: tmpMeta.name, sectionName: section});

			state.addEntry(cpy);
		}
	}

	/**
	 * @param doc
	 * @param opts
	 * @param opts.headProp
	 * @param opts.bodyProp
	 * @param [opts.isRequireIncludes]
	 */
	static getAdventureBookTables (doc, opts) {
		if (!(doc[opts.headProp] && doc[opts.bodyProp])) return;

		const state = new RecursiveSearchStateCorpus({
			isRequireIncludes: opts.isRequireIncludes,
			source: doc[opts.headProp].source,
			corpusId: doc[opts.headProp].id,
		});

		doc[opts.bodyProp].data.forEach((chapter, ixChapter) => {
			const tmpMeta = MiscUtil.copy(doc[opts.headProp].contents[ixChapter]);
			tmpMeta.index = ixChapter;
			tmpMeta.metaType = "adventure-book";

			this._doSearch({
				state,
				tmpMeta: tmpMeta,
				section: doc[opts.headProp].name,
				entry: chapter,
			});
		});

		return state.getStacks();
	}

	static getClassTables (cls) {
		const state = new RecursiveSearchStateClass({
			isRequireIncludes: true,
			cls,
		});

		cls.classFeatures.forEach((lvl, lvlI) => {
			const tmpMeta = {
				metaType: "class",
				className: cls.name,
				classSource: cls.source || Parser.SRC_PHB,
				level: lvlI + 1,
			};

			lvl.forEach(feat => this._doSearch({
				state,
				tmpMeta,
				section: cls.name,
				entry: feat,
			}));
		});

		if (cls.fluff) {
			this._doSearch({
				state,
				tmpMeta: {
					metaType: "classFluff",
					className: cls.name,
					classSource: cls.source || Parser.SRC_PHB,
				},
				section: cls.name,
				entry: {entries: cls.fluff},
			});
		}

		return state.getStacks();
	}

	static getSubclassTables (sc) {
		const state = new RecursiveSearchStateSubclass({
			isRequireIncludes: true,
			sc,
		});

		sc.subclassFeatures.forEach(lvl => {
			const level = lvl[0].level;

			const tmpMeta = {
				metaType: "subclass",
				className: sc.className,
				classSource: sc.classSource || Parser.SRC_PHB,
				level,
				subclassName: sc.name,
				subclassShortName: sc.shortName,
				subclassSource: sc.source || sc.classSource || Parser.SRC_PHB,

				// Used to deduplicate headers
				name: sc.name,
			};

			lvl.forEach(feat => this._doSearch({
				state,
				tmpMeta,
				section: sc.className,
				entry: feat,
			}));
		});

		return state.getStacks();
	}

	static getGenericTables (entity, metaType, ...props) {
		const state = new RecursiveSearchStateGeneric({isRequireIncludes: true});

		props.forEach(prop => {
			if (!entity[prop]) return;
			const tmpMeta = {
				metaType: metaType,
				name: entity.name,
				source: entity.source,
			};

			entity[prop].forEach(ent => {
				this._doSearch({
					state,
					tmpMeta,
					section: entity.name,
					entry: ent,
				});
			});
		});

		return state.getStacks();
	}
}
