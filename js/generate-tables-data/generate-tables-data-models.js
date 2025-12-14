/** @abstract */
class _RecursiveSearchStateBase {
	constructor (
		{
			isRequireIncludes = false,
		},
	) {
		this._isRequireIncludes = !!isRequireIncludes;

		this._path = [];
		this._sectionOrders = {};
		this._tables = [];
		this._tableGroups = [];

		this._fauxGroupInfos = {};
	}

	/* -------------------------------------------- */

	pushPath (info) { this._path.push(info); }
	popPath () { this._path.pop(); }

	getPath () { return MiscUtil.copyFast(this._path); }

	/* -------------------------------------------- */

	addEntry (entry) {
		const genTablesData = entry.data?.genTables || {};
		if (this._isRequireIncludes && !genTablesData.tableInclude) return;

		if (genTablesData.fauxGroupName && genTablesData.fauxGroupSource) {
			if (entry.type !== "table") throw new Error(`Faux group information for non-"table" entry!`);

			const tgt = (this._fauxGroupInfos[genTablesData.fauxGroupSource] ||= {})[genTablesData.fauxGroupName] ||= {
				tables: [],
				page: null,
				// Arbitrarily use the first `tmpMeta` of the component tables
				_tmpMeta: entry._tmpMeta,
			};
			tgt.page ??= genTablesData.fauxGroupPage;
			const cpyEntry = MiscUtil.copyFast(entry);
			delete cpyEntry._tmpMeta;
			tgt.tables.push(cpyEntry);

			if (!genTablesData.isFauxGroupAdditional) return;
		}

		switch (entry.type) {
			case "table": return this._tables.push(entry);
			case "tableGroup": return this._tableGroups.push(entry);
			default: throw new Error(`Unhandled entry type "${entry.type}"!`);
		}
	}

	/* -------------------------------------------- */

	getNextSectionIndex ({chapterName, sectionName}) {
		const val = ((this._sectionOrders[chapterName] ||= {})[sectionName] ||= 1);
		this._sectionOrders[chapterName][sectionName]++;
		return val;
	}

	/* -------------------------------------------- */

	_getCleanSectionName (name) {
		return name.replace(/^(?:Step )?[-\d]+[:.]?\s*/, "");
	}

	_isSectionInTitle (sections, title) {
		const lowTitle = title.toLowerCase();
		return sections.some(section => lowTitle.includes(section.toLowerCase()));
	}

	/* -------------------------------------------- */

	_getStacks_mutDataAddPage (table) {
		if (table.page) return;

		for (let i = table.path.length - 1; i >= 0; --i) {
			if (table.path[i].page) {
				table.page = table.path[i].page;
				break;
			}
		}
	}

	_getStacks_mutDataAddReprintedAs (table) {
		if (table.reprintedAs) return;

		const genTablesData = table.data?.genTables || {};

		if (genTablesData.reprintedAs) table.reprintedAs = MiscUtil.copyFast(genTablesData.reprintedAs);
	}

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @param tableGroup
	 * @return {string}
	 */
	_getStacks_getTableGroupSource ({tableGroup}) { throw new Error("Unimplemented!"); }

	_getStacks_mutCleanGenTablesData (ent) {
		MiscUtil.getWalker({isNoModification: true})
			.walk(
				ent,
				{
					object: (obj) => {
						if (!obj.data) return;
						delete obj.data.genTables;
						if (!Object.keys(obj.data).length) delete obj.data;
					},
				},
			);
	}

	_getStacks_mutCleanTableOrGroup (table) {
		delete table.path;
		delete table.section;
		delete table.sectionIndex;

		const genTablesData = table.data?.genTables || {};
		this._getStacks_mutCleanGenTablesData(table);

		switch (table._tmpMeta.metaType) {
			case "adventure-book": {
				table.chapter = table._tmpMeta;

				// clean chapter
				if (genTablesData.tableChapterIgnore) {
					delete table.chapter;
					break;
				}

				table.chapter = {
					name: table.chapter.name,
					ordinal: table.chapter.ordinal,
					index: table.chapter.index,
				};

				break;
			}
			case "class":
			case "classFluff": {
				table.parentEntity = {
					prop: "class",
					uid: DataUtil.proxy.getUid("class", {name: table._tmpMeta.className, source: table._tmpMeta.classSource}, {isMaintainCase: true}),
				};
				break;
			}
			case "subclass": {
				table.parentEntity = {
					prop: table._tmpMeta.metaType,
					uid: DataUtil.proxy.getUid(
						table._tmpMeta.metaType,
						{
							name: table._tmpMeta.subclassName,
							shortName: table._tmpMeta.subclassShortName,
							source: table._tmpMeta.subclassSource,
							className: table._tmpMeta.className,
							classSource: table._tmpMeta.classSource,
						},
						{isMaintainCase: true},
					),
				};
				break;
			}
			default: {
				table.parentEntity = {
					prop: table._tmpMeta.metaType,
					uid: DataUtil.proxy.getUid(
						table._tmpMeta.metaType,
						{
							name: table._tmpMeta.name,
							source: table._tmpMeta.source,
						},
						{isMaintainCase: true},
					),
				};
			}
		}

		delete table._tmpMeta;

		if (table.type === "table") delete table.type;

		if (table.name) table.name = Renderer.stripTags(table.name);
	}

	/**
	 * @abstract
	 * @return void
	 */
	_getStacks_mutPostProcessTables ({stacks}) { throw new Error("Unimplemented!"); }

	_getStacks_mutPostProcessTableGroups ({stacks}) {
		stacks.tableGroup
			.forEach(tableGroup => {
				const cleanSections = tableGroup.path
					?.filter(ent => ent.name)
					.map(ent => this._getCleanSectionName(ent.name));
				if (!tableGroup.name && !cleanSections.length) throw new Error("Group had no name!");

				if (!tableGroup.name) {
					tableGroup.name = cleanSections.last();
				} if (cleanSections && !this._isSectionInTitle(cleanSections, tableGroup.name)) {
					tableGroup.name = `${cleanSections.last()}; ${tableGroup.name}`;
				}

				this._getStacks_mutDataAddPage(tableGroup);
				this._getStacks_mutDataAddReprintedAs(tableGroup);
				tableGroup.source = this._getStacks_getTableGroupSource({tableGroup});
				this._getStacks_mutCleanTableOrGroup(tableGroup);

				tableGroup.tables.forEach(tbl => this._getStacks_mutCleanGenTablesData(tbl));
			});
	}

	getStacks () {
		const fauxTableGroups = Object.entries(this._fauxGroupInfos)
			.flatMap(([source, nameTo]) => {
				return Object.entries(nameTo)
					.flatMap(([name, info]) => {
						return {
							type: "tableGroup",
							name: name,
							source: source,
							page: info.page,
							tables: info.tables,
							_tmpMeta: info._tmpMeta,
						};
					});
			});

		const stacks = {
			table: [
				...MiscUtil.copyFast(this._tables),
			],
			tableGroup: [
				...MiscUtil.copyFast(this._tableGroups),
				...fauxTableGroups,
			],
		};

		this._getStacks_mutPostProcessTables({stacks});
		this._getStacks_mutPostProcessTableGroups({stacks});

		return stacks;
	}
}

export class RecursiveSearchStateCorpus extends _RecursiveSearchStateBase {
	constructor (
		{
			source,
			corpusId,
			...rest
		},
	) {
		super({...rest});
		this._source = source;
		this._corpusId = corpusId;
	}

	/* -------------------------------------------- */

	_getStacks_getTableGroupSource () {
		return this._source || this._corpusId;
	}

	/* -------------------------------------------- */

	_getAdventureBookTableName ({tbl, genTablesData, cleanSectionNames}) {
		if (genTablesData.tableName) return genTablesData.tableName;

		if (tbl.caption) {
			if (genTablesData.tableNamePrefix) return `${genTablesData.tableNamePrefix}; ${tbl.caption}`;
			if (this._isSectionInTitle(cleanSectionNames, tbl.caption) || genTablesData.skipSectionPrefix) return tbl.caption;
			return cleanSectionNames.length ? `${cleanSectionNames.last()}; ${tbl.caption}` : tbl.caption;
		}

		// If this is the only table in this section, remove the numerical suffix
		if (tbl.sectionIndex === 1 && this._sectionOrders[tbl._tmpMeta.name][tbl.section] === 2) return cleanSectionNames.last();
		return `${cleanSectionNames.last()}; ${tbl.sectionIndex}`;
	}

	_getStacks_mutPostProcessTables ({stacks}) {
		stacks.table.forEach(tbl => {
			const cleanSectionNames = tbl.path.filter(ent => ent.name).map(ent => this._getCleanSectionName(ent.name));
			const genTablesData = tbl.data?.genTables || {};

			tbl.name = this._getAdventureBookTableName(({tbl, genTablesData, cleanSectionNames}));

			this._getStacks_mutDataAddPage(tbl);
			this._getStacks_mutDataAddReprintedAs(tbl);
			tbl.source = this._getStacks_getTableGroupSource();
			this._getStacks_mutCleanTableOrGroup(tbl);
		});
	}
}

export class RecursiveSearchStateClass extends _RecursiveSearchStateBase {
	constructor (
		{
			cls,
			...rest
		},
	) {
		super({...rest});
		this._cls = cls;
	}

	/* -------------------------------------------- */

	_getStacks_getTableGroupSource ({tableGroup}) {
		return tableGroup._tmpMeta.subclassSource || tableGroup._tmpMeta.classSource;
	}

	/* -------------------------------------------- */

	_getStacks_mutPostProcessTables ({stacks}) {
		stacks.table.forEach(it => {
			it.name = it.caption;
			it.source = it._tmpMeta.subclassSource || it._tmpMeta.classSource;
			it.srd = !!this._cls.srd;
			it.srd52 = !!this._cls.srd52;
			it.basicRules = !!this._cls.basicRules;
			it.basicRules2024 = !!this._cls.basicRules2024;

			this._getStacks_mutDataAddPage(it);
			this._getStacks_mutDataAddReprintedAs(it);
			this._getStacks_mutCleanTableOrGroup(it);
		});
	}
}

export class RecursiveSearchStateSubclass extends _RecursiveSearchStateBase {
	constructor (
		{
			sc,
			...rest
		},
	) {
		super({...rest});
		this._sc = sc;
	}

	/* -------------------------------------------- */

	_getStacks_getTableGroupSource ({tableGroup}) {
		return tableGroup._tmpMeta.subclassSource || tableGroup._tmpMeta.classSource;
	}

	/* -------------------------------------------- */

	_getStacks_mutPostProcessTables ({stacks}) {
		stacks.table.forEach(it => {
			it.name = it.caption;
			it.source = it._tmpMeta.subclassSource || it._tmpMeta.classSource;
			it.srd = !!this._sc.srd;
			it.srd52 = !!this._sc.srd52;
			it.basicRules = !!this._sc.basicRules;
			it.basicRules2024 = !!this._sc.basicRules2024;

			this._getStacks_mutDataAddPage(it);
			this._getStacks_mutDataAddReprintedAs(it);
			this._getStacks_mutCleanTableOrGroup(it);
		});
	}
}

export class RecursiveSearchStateGeneric extends _RecursiveSearchStateBase {
	_getStacks_getTableGroupSource ({tableGroup}) {
		return tableGroup._tmpMeta.source;
	}

	_getStacks_mutPostProcessTables ({stacks}) {
		stacks.table.forEach(it => {
			it.name = it.caption;
			it.source = it._tmpMeta.source;

			this._getStacks_mutDataAddPage(it);
			this._getStacks_mutDataAddReprintedAs(it);
			this._getStacks_mutCleanTableOrGroup(it);
		});
	}
}
