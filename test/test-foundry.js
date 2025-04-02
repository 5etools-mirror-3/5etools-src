import fs from "fs";
import * as ut from "../node/util.js";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import "../js/render-dice.js";

class TestFoundry {
	static async pLoadData (originalFilename, originalPath) {
		switch (originalFilename) {
			case "races.json": {
				ut.patchLoadJson();
				const out = await DataUtil.race.loadJSON({isAddBaseRaces: true});
				ut.unpatchLoadJson();
				return out;
			}

			default: return ut.readJson(originalPath);
		}
	}

	static async pTestDir ({errors, dir}) {
		const FOUNDRY_FILE = "foundry.json";

		const dirList = fs.readdirSync(`./data/${dir}`)
			.filter(it => !it.startsWith("fluff-") && it !== "sources.json" && it !== "index.json");

		if (!dirList.includes(FOUNDRY_FILE)) throw new Error(`No "${FOUNDRY_FILE}" file found in dir "${dir}"!`);

		const foundryPath = `./data/${dir}/${FOUNDRY_FILE}`;
		const foundryData = ut.readJson(foundryPath);
		const originalDatas = await dirList
			.filter(it => it !== FOUNDRY_FILE)
			.pSerialAwaitMap(it => this.pLoadData(it, `./data/${dir}/${it}`));

		await this.pTestFile({errors, foundryData, foundryPath, originalDatas});
	}

	static async pTestRoot ({errors}) {
		const dirList = fs.readdirSync(`./data/`);
		const foundryFiles = dirList.filter(it => it.startsWith("foundry-") && it.endsWith(".json"));

		for (const foundryFile of foundryFiles) {
			const foundryPath = `./data/${foundryFile}`;
			const foundryData = ut.readJson(foundryPath);
			const originalFile = foundryFile.replace(/^foundry-/i, "");
			const originalData = await this.pLoadData(originalFile, `./data/${originalFile}`);

			await this.pTestFile({errors, foundryData, foundryPath, originalDatas: [originalData]});
		}
	}

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
		const variants = await this.pLoadData("magicvariants.json", `./data/magicvariants.json`);
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
		"class": {
			propsChild: ["classFeature"],
			ignoresNotFound: {
				[Parser.SRC_PHB]: new Set([
					// From the SRD
					"@scale.monk.die",
					"@scale.monk.unarmored-movement",
				]),
			},
			ignoresNeverUsed: {
				[Parser.SRC_TCE]: new Set([
					"@scale.artificer.infusions",
				]),
				[Parser.SRC_XPHB]: new Set([
					// TODO(Future) utilize these
					"@scale.bard.prepared-max",
					"@scale.cleric.prepared-max",
					"@scale.druid.prepared-max",
					"@scale.paladin.prepared-max",
					"@scale.ranger.max-prepared",
					"@scale.sorcerer.prepared-max",
					"@scale.warlock.prepared-max",
					"@scale.wizard.max-prepared",

					"@scale.druid.known-forms",
					"@scale.ranger.mark",
				]),
			},
		},
		// TODO(Future) enable/refine
		/*
		"subclass": {
			propsChild: ["subclassFeature"],
			ignoresNotFound: {
				[Parser.SRC_PHB]: new Set([
					// From the SRD
					"@scale.order-domain.divine-strike",
					"@scale.monk.die",
				]),
				[Parser.SRC_XGE]: new Set([
					// From the SRD
					"@scale.monk.die",
				]),
			},
			ignoresNeverUsed: {
				[Parser.SRC_TCE]: new Set([
					"@scale.alchemist.elixir",
				]),
			},
		},
		*/
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

	static _pTestFile_testScaleValueUtilization ({foundryPath, foundryData, originalDatas, errors}) {
		Object.entries(foundryData)
			.forEach(([prop, arr]) => {
				if (!(arr instanceof Array)) return;

				const scaleValueMeta = this._SCALE_VALUE_METAS[prop];

				if (!scaleValueMeta) return;

				const sourceToScaleValues = {};

				const {propsChild, ignoresNotFound, ignoresNeverUsed} = scaleValueMeta;

				arr
					.filter(ent => ent.advancement?.length)
					.forEach(ent => {
						ent.advancement
							.filter(advancement => ["ScaleValue"].includes(advancement.type))
							.forEach(advancement => {
								const identifier = advancement.configuration?.identifier || Parser.stringToSlug(advancement.title);
								if (!identifier) throw new Error(`Expected "ScaleValue" to include "configuration.identifier" or "title"!`);

								MiscUtil.set(sourceToScaleValues, ent.source, Parser.stringToSlug(ent.name), identifier, 0);
							});
					});

				const walker = MiscUtil.getWalker({isNoModification: true});

				propsChild
					.filter(propChild => foundryData[propChild]?.length)
					.forEach(propChild => {
						foundryData[propChild]
							.forEach(entChild => {
								walker
									.walk(
										entChild,
										{
											string: (str) => {
												[...str.matchAll(/@scale\.(?<nameSlug>[-a-z]+)\.(?<scaleValueIdentifier>[-a-z]+)/g)]
													.forEach(m => {
														if (ignoresNotFound?.[entChild.source]?.has(m[0])) return;

														const {nameSlug, scaleValueIdentifier} = m.groups;

														const valCur = MiscUtil.get(sourceToScaleValues, entChild.source, nameSlug, scaleValueIdentifier);
														if (valCur == null) {
															return errors.push(`\t"${prop}" ${entChild.name} (${entChild.source}) scale reference "${m[0]}" not found in parent entity!`);
														}

														MiscUtil.set(sourceToScaleValues, entChild.source, nameSlug, scaleValueIdentifier, valCur + 1);
													});
											},
										},
									);
							});
					});

				Object.entries(sourceToScaleValues)
					.forEach(([source, slugNameTo]) => {
						Object.entries(slugNameTo)
							.forEach(([slugName, scaleValueIdentifierTo]) => {
								Object.entries(scaleValueIdentifierTo)
									.filter(([, count]) => !count)
									.forEach(([scaleValueIdentifier]) => {
										const varName = `@scale.${slugName}.${scaleValueIdentifier}`;

										if (ignoresNeverUsed?.[source]?.has(varName)) return;

										errors.push(`\t"${prop}" scale value "${varName}" (${source}) is never used!`);
									});
							});
					});
			});
	}

	static async pTestFile ({foundryPath, foundryData, originalDatas, errors}) {
		await this._pTestFile_pTestMatchingEntitiesExist({foundryPath, foundryData, originalDatas, errors});
		this._pTestFile_testScaleValueUtilization({foundryPath, foundryData, originalDatas, errors});
	}
}

const SPECIAL_PROPS = {
	"raceFeature": TestFoundry.testSpecialRaceFeatures.bind(TestFoundry),
	"magicvariant": TestFoundry.pTestSpecialMagicItemVariants.bind(TestFoundry),
};

async function main () {
	const errors = [];

	await TestFoundry.pTestDir({dir: "class", errors});
	await TestFoundry.pTestDir({dir: "spells", errors});
	await TestFoundry.pTestRoot({errors});

	if (!errors.length) console.log("##### Foundry Tests Passed #####");
	else {
		console.error(`Foundry data errors:\n${errors.map(err => err).join("\n")}`);
	}
	return !errors.length;
}

export default main();
