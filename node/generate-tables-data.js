import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import * as ut from "./util.js";
import "../js/utils-dataloader.js";
import "../js/hist.js";
import {UtilGenTables} from "../js/generate-tables-data/generate-tables-data-utils.js";

class GenTables {
	static _GenState = class {
		constructor () {
			this._tables = [];
			this._tableGroups = [];
			this._seenHashes = new Set();
		}

		addTables (ents) {
			ents = ents
				.filter(ent => {
					const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES](ent);
					if (this._seenHashes.has(hash)) return false;
					this._seenHashes.add(hash);
					return true;
				});
			this._tables.push(...ents);
		}

		addTableGroups (ents) {
			ents = ents
				.filter(ent => {
					const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TABLES](ent);
					if (this._seenHashes.has(hash)) return false;
					this._seenHashes.add(hash);
					return true;
				});
			this._tableGroups.push(...ents);
		}

		getOutput () {
			return {table: this._tables, tableGroup: this._tableGroups};
		}
	};

	static BOOK_BLOCKLIST = {};
	static ADVENTURE_BLOCKLIST = {};

	_getAdventureData () {
		return ut.readJson(`./data/adventures.json`).adventure
			.map(idx => {
				if (GenTables.ADVENTURE_BLOCKLIST[idx.id]) return null;
				return {
					adventure: idx,
					adventureData: JSON.parse(fs.readFileSync(`./data/adventure/adventure-${idx.id.toLowerCase()}.json`, "utf-8")),
				};
			})
			.filter(Boolean);
	}

	_getBookData () {
		return ut.readJson(`./data/books.json`).book
			.map(idx => {
				if (GenTables.BOOK_BLOCKLIST[idx.id]) return null;
				return {
					book: idx,
					bookData: JSON.parse(fs.readFileSync(`./data/book/book-${idx.id.toLowerCase()}.json`, "utf-8")),
				};
			})
			.filter(Boolean);
	}

	async pRun () {
		const genState = new this.constructor._GenState();

		this._addBookAndAdventureData(genState);
		await this._pAddClassData(genState);
		await this._pAddVariantRuleData(genState);
		await this._pAddBackgroundData(genState);
		await this._pAddEncountersData(genState);
		await this._pAddNamesData(genState);

		const toSave = JSON.stringify(genState.getOutput());
		fs.writeFileSync(`./data/generated/gendata-tables.json`, toSave, "utf-8");
		console.log("Regenerated table data.");
	}

	_addBookAndAdventureData (genState) {
		[
			{
				data: this._getAdventureData(),
				options: {
					headProp: "adventure",
					bodyProp: "adventureData",
					isRequireIncludes: true,
				},
			},
			{
				data: this._getBookData(),
				options: {
					headProp: "book",
					bodyProp: "bookData",
				},
			},
		]
			.forEach(meta => {
				meta.data
					.forEach(doc => {
						const {
							table: foundTables,
							tableGroup: foundTableGroups,
						} = UtilGenTables.getAdventureBookTables(
							doc,
							{
								...meta.options,
							},
						);

						genState.addTables(foundTables);
						genState.addTableGroups(foundTableGroups);
					});
			});
	}

	async _pAddClassData (genState) {
		ut.patchLoadJson();
		const classData = await DataUtil.class.loadJSON();
		ut.unpatchLoadJson();

		classData.class.forEach(cls => {
			const {table: foundTables, tableGroup: foundTableGroups} = UtilGenTables.getClassTables(cls);
			genState.addTables(foundTables);
			genState.addTableGroups(foundTableGroups);
		});

		classData.subclass.forEach(sc => {
			const {table: foundTables, tableGroup: foundTableGroups} = UtilGenTables.getSubclassTables(sc);
			genState.addTables(foundTables);
			genState.addTableGroups(foundTableGroups);
		});
	}

	async _pAddVariantRuleData (genState) {
		return this._pAddGenericEntityData({
			genState,
			path: `./data/variantrules.json`,
			props: ["variantrule"],
		});
	}

	async _pAddBackgroundData (genState) {
		return this._pAddGenericEntityData({
			genState,
			path: `./data/backgrounds.json`,
			props: ["background"],
		});
	}

	async _pAddGenericEntityData (
		{
			genState,
			path,
			props,
		},
	) {
		ut.patchLoadJson();
		const jsonData = await DataUtil.loadJSON(path);
		ut.unpatchLoadJson();

		props.forEach(prop => {
			jsonData[prop].forEach(it => {
				// Note that this implicitly requires each table to have a `"tableInclude"`
				const {table: foundTables} = UtilGenTables.getGenericTables(it, prop, "entries");
				genState.addTables(foundTables);
			});
		});
	}

	// -----------------------

	async _pAddEncountersData (genState) {
		return this._pAddEncounterOrNamesData({
			genState,
			path: `./data/encounters.json`,
			prop: "encounter",
			fnGetNameCaption: Renderer.table.getConvertedEncounterTableName.bind(Renderer.table),
			colLabel1: "Encounter",
		});
	}

	async _pAddNamesData (genState) {
		return this._pAddEncounterOrNamesData({
			genState,
			path: `./data/names.json`,
			prop: "name",
			fnGetNameCaption: Renderer.table.getConvertedNameTableName.bind(Renderer.table),
			colLabel1: "Name",
		});
	}

	async _pAddEncounterOrNamesData (
		{
			genState,
			path,
			prop,
			fnGetNameCaption,
			colLabel1,
		},
	) {
		ut.patchLoadJson();
		const jsonData = await DataUtil.loadJSON(path);
		ut.unpatchLoadJson();

		jsonData[prop].forEach(group => {
			genState.addTables(
				group.tables.map(tableRaw => Renderer.table.getConvertedEncounterOrNamesTable({
					group,
					tableRaw,
					fnGetNameCaption,
					colLabel1,
				})),
			);
		});
	}

	// -----------------------
}

const generator = new GenTables();
export default generator.pRun();
