import fs from "fs";
import * as ut from "../node/util.js";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import "../js/render-dice.js";
import {pInitConsoleOut} from "../node/util-commander.js";

const pLoadData = async (originalFilename, originalPath) => {
	switch (originalFilename) {
		case "races.json": {
			ut.patchLoadJson();
			const out = await DataUtil.race.loadJSON({isAddBaseRaces: true});
			const outWithVersions = Object.fromEntries(
				Object.entries(out)
					.map(([prop, arr]) => {
						return [prop, arr.flatMap(it => [it, ...DataUtil.proxy.getVersions(it.__prop, it)])];
					}),
			);
			ut.unpatchLoadJson();
			return outWithVersions;
		}

		default: return ut.readJson(originalPath);
	}
};

class _DirectoryAdapter {
	constructor ({dir, fileHandler}) {
		this._dir = dir;
		this._fileHandler = fileHandler;
	}

	async pRun () {
		const FOUNDRY_FILE = "foundry.json";

		const dirList = fs.readdirSync(`./data/${this._dir}`)
			.filter(it => !it.startsWith("fluff-") && it !== "sources.json" && it !== "index.json");

		if (!dirList.includes(FOUNDRY_FILE)) throw new Error(`No "${FOUNDRY_FILE}" file found in dir "${this._dir}"!`);

		const foundryPath = `./data/${this._dir}/${FOUNDRY_FILE}`;
		const foundryData = ut.readJson(foundryPath);
		const originalDatas = await dirList
			.filter(it => it !== FOUNDRY_FILE)
			.pSerialAwaitMap(it => pLoadData(it, `./data/${this._dir}/${it}`));

		await this._fileHandler.pHandleFile({foundryData, foundryPath, originalDatas});
	}
}

class _RootAdapter {
	constructor ({fileHandler}) {
		this._fileHandler = fileHandler;
	}

	async pRun () {
		const dirList = fs.readdirSync(`./data/`);
		const foundryFiles = dirList.filter(it => it.startsWith("foundry-") && it.endsWith(".json"));

		for (const foundryFile of foundryFiles) {
			const foundryPath = `./data/${foundryFile}`;
			const foundryData = ut.readJson(foundryPath);
			const originalFile = foundryFile.replace(/^foundry-/i, "");
			const originalData = await pLoadData(originalFile, `./data/${originalFile}`);

			await this._fileHandler.pHandleFile({foundryData, foundryPath, originalDatas: [originalData]});
		}
	}
}

/**
 * @abstract
 */
class _FileHandlerBase {
	/**
	 * @abstract
	 * @return void
	 */
	async pHandleFile ({foundryData, foundryPath, originalDatas}) { throw new Error("Unimplemented!"); }
}

class _FileHandlerInit extends _FileHandlerBase {
	constructor ({scaleValues}) {
		super();
		this._scaleValues = scaleValues;
	}

	async pHandleFile ({foundryData, foundryPath, originalDatas}) {
		// Populate available scale values
		Object.entries(foundryData)
			.forEach(([prop, arr]) => {
				if (!(arr instanceof Array)) return;

				arr
					.filter(ent => ent.advancement?.length)
					.forEach(ent => {
						ent.advancement
							.filter(advancement => ["ScaleValue"].includes(advancement.type))
							.forEach(advancement => {
								const identifier = advancement.configuration?.identifier || Parser.stringToSlug(advancement.title);
								if (!identifier) throw new Error(`Expected "ScaleValue" to include "configuration.identifier" or "title"!`);

								const meta = MiscUtil.getOrSet(this._scaleValues, Parser.stringToSlug(ent.name), identifier, {cntUses: 0, sources: new Set()});
								meta.sources.add(SourceUtil.getEntitySource(ent));
							});
					});
			});
	}
}

class _FileHandlerTest extends _FileHandlerBase {
	constructor ({tester, errors, scaleValues}) {
		super();
		this._tester = tester;
		this._errors = errors;
		this._scaleValues = scaleValues;
	}

	async pHandleFile ({foundryData, foundryPath, originalDatas}) {
		await this._tester.pTestFile({errors: this._errors, foundryData, foundryPath, originalDatas, scaleValues: this._scaleValues});
	}
}

class TestFoundry {
	static testSpecialRaceFeatures ({foundryData, originalDatas, errors}) {
		const uidsRaceFeature = new Set();

		const HASH_BUILDER = it => UrlUtil.encodeForHash([it.name, it.source, it.raceName, it.raceSource]);

		originalDatas.forEach(originalData => {
			originalData.race.forEach(race => {
				DataUtil.generic.getVersions(race).forEach(ver => this._testSpecialRaceFeatures_addRace({HASH_BUILDER, uidsRaceFeature, race: ver}));
				this._testSpecialRaceFeatures_addRace({HASH_BUILDER, uidsRaceFeature, race});
			});
		});

		foundryData.raceFeature.forEach(raceFeature => {
			const uid = HASH_BUILDER(raceFeature);
			if (!uidsRaceFeature.has(uid)) errors.push(`\tSpecies feature "${uid}" not found!`);
		});
	}

	static _testSpecialRaceFeatures_addRace ({HASH_BUILDER, uidsRaceFeature, race}) {
		(race.entries || []).forEach(ent => {
			const uid = HASH_BUILDER({source: race.source, ...ent, raceName: race.name, raceSource: race.source});
			uidsRaceFeature.add(uid);
		});
	}

	static async pTestSpecialMagicItemVariants ({foundryData, originalDatas, errors}) {
		const variants = await pLoadData("magicvariants.json", `./data/magicvariants.json`);
		const prop = "magicvariant";
		this.doCompareData({prop, foundryData, originalDatas: [variants], errors});
	}

	static doCompareData ({prop, foundryData, originalDatas, errors}) {
		foundryData[prop].forEach(it => {
			const match = originalDatas.first(variants => variants[prop]?.find(og => og.name === it.name && (og?.inherits?.source ?? og.source) === it.source));
			if (!match) errors.push(`\t"${prop}" ${it.name} (${it.source}) not found!`);
		});
	}

	/* -------------------------------------------- */

	static _SCALE_VALUE_METAS = {
		ignoresNotFound: {
			[Parser.SRC_PHB]: new Set([
				// Class; from the SRD
				"@scale.monk.die",
				"@scale.monk.unarmored-movement",

				// Subclass; from the SRD
				"@scale.order-domain.divine-strike",
				"@scale.monk.die",
			]),
		},

		ignoresNeverUsed: {
			[Parser.SRC_TCE]: new Set([
				"@scale.artificer.infusions",
				"@scale.alchemist.elixir",
			]),
			[Parser.SRC_XPHB]: new Set([
				// TODO(Future) utilize these
				"@scale.druid.wild-shape",
				"@scale.druid.known-forms",
				"@scale.ranger.mark",

				"@scale.arcane-trickster.max-prepared",
				"@scale.eldritch-knight.cantrips",
				"@scale.eldritch-knight.prepared",
			]),
		},
	};

	/* -------------------------------------------- */

	static async _pTestFile_pTestMatchingEntitiesExist ({foundryPath, foundryData, originalDatas, errors}) {
		Object.entries(foundryData)
			.forEach(([prop, arr]) => {
				if (SPECIAL_PROPS[prop]) return SPECIAL_PROPS[prop]({foundryPath, foundryData, originalDatas, errors});

				if (!(arr instanceof Array)) return;
				if (originalDatas.every(originalData => !originalData[prop] || !(originalData[prop] instanceof Array))) return console.warn(`\tUntested prop "${prop}" in file ${foundryPath}`);

				this.doCompareData({prop, foundryData, originalDatas, errors});
			});
	}

	static _pTestFile_testScaleValueUtilization ({foundryPath, foundryData, originalDatas, errors, scaleValues}) {
		const {ignoresNotFound} = this._SCALE_VALUE_METAS;
		const walker = MiscUtil.getWalker({isNoModification: true});

		Object.entries(foundryData)
			.forEach(([prop, arr]) => {
				if (!(arr instanceof Array)) return;

				arr
					.forEach(ent => {
						this._pTestFile_testScaleValueUtilization_entity({
							walker,
							ent,
							ignoresNotFound,
							errors,
							scaleValues,
							prop,
						});
					});
			});
	}

	static _pTestFile_testScaleValueUtilization_entity (
		{
			walker,
			ent,
			ignoresNotFound,
			errors,
			scaleValues,
			prop,
		},
	) {
		walker
			.walk(
				ent,
				{
					string: (str) => {
						[...str.matchAll(/@scale\.(?<nameSlug>[-a-z]+)\.(?<scaleValueIdentifier>[-a-z]+)/g)]
							.forEach(m => {
								if (ignoresNotFound?.[ent.source]?.has(m[0])) return;

								const {nameSlug, scaleValueIdentifier} = m.groups;

								const valCur = MiscUtil.get(scaleValues, nameSlug, scaleValueIdentifier);
								if (valCur == null) {
									return errors.push(`\t"${prop}" ${ent.name} (${ent.source}) scale reference "${m[0]}" not found!`);
								}

								valCur.cntUses += 1;
							});
					},
				},
			);
	}

	static async pTestFile ({foundryPath, foundryData, originalDatas, errors, scaleValues}) {
		await this._pTestFile_pTestMatchingEntitiesExist({foundryPath, foundryData, originalDatas, errors});
		this._pTestFile_testScaleValueUtilization({foundryPath, foundryData, originalDatas, errors, scaleValues});
	}

	static async pPostProcess ({errors, scaleValues}) {
		const {ignoresNeverUsed} = this._SCALE_VALUE_METAS;

		Object.entries(scaleValues)
			.forEach(([slugName, scaleValueIdentifierTo]) => {
				Object.entries(scaleValueIdentifierTo)
					.filter(([, {cntUses}]) => !cntUses)
					.forEach(([scaleValueIdentifier, {sources}]) => {
						const varName = `@scale.${slugName}.${scaleValueIdentifier}`;

						sources
							.forEach(source => {
								if (ignoresNeverUsed?.[source]?.has(varName)) return;

								errors.push(`\tScale value "${varName}" (${source}) is never used!`);
							});
					});
			});
	}
}

const SPECIAL_PROPS = {
	"raceFeature": TestFoundry.testSpecialRaceFeatures.bind(TestFoundry),
	"magicvariant": TestFoundry.pTestSpecialMagicItemVariants.bind(TestFoundry),
};

async function main () {
	await pInitConsoleOut();

	const errors = [];
	const scaleValues = {};

	const fileHandlerInit = new _FileHandlerInit({scaleValues});

	await (new _DirectoryAdapter({dir: "class", fileHandler: fileHandlerInit})).pRun();
	await (new _DirectoryAdapter({dir: "spells", fileHandler: fileHandlerInit})).pRun();
	await (new _RootAdapter({fileHandler: fileHandlerInit})).pRun();

	const fileHandlerTest = new _FileHandlerTest({tester: TestFoundry, errors, scaleValues});

	await (new _DirectoryAdapter({dir: "class", fileHandler: fileHandlerTest})).pRun();
	await (new _DirectoryAdapter({dir: "spells", fileHandler: fileHandlerTest})).pRun();
	await (new _RootAdapter({fileHandler: fileHandlerTest})).pRun();

	await TestFoundry.pPostProcess({errors, scaleValues});

	if (!errors.length) console.log("##### Foundry Tests Passed #####");
	else {
		console.error(`Foundry data errors:\n${errors.map(err => err).join("\n")}`);
	}
	return !errors.length;
}

export default main();
