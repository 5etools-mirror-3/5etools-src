// region Based on `Charactermancer_AdditionalSpellsUtil`

import {UtilsAdditionalSpells} from "../utils/utils-additionalspells.js";

class _SpellSourceUtil {
	static _getCleanUid (uid) {
		return DataUtil.proxy.getUid(
			"spell",
			DataUtil.proxy.unpackUid("spell", uid.split("#")[0], "spell"),
		);
	}

	// region Data flattening
	static getSpellUids (additionalSpellBlock, modalFilterSpells) {
		additionalSpellBlock = MiscUtil.copyFast(additionalSpellBlock);

		const outSpells = [];

		Object.entries(additionalSpellBlock)
			.forEach(([additionType, additionMeta]) => {
				switch (additionType) {
					case "innate":
					case "known":
					case "prepared":
					case "expanded": {
						this._getSpellUids_doProcessAdditionMeta({additionType, additionMeta, outSpells, modalFilterSpells});
						break;
					}

					// Ignored
					case "name":
					case "ability":
					case "resourceName": break;

					default: throw new Error(`Unhandled spell addition type "${additionType}"`);
				}
			});

		return outSpells.unique();
	}

	static _getSpellUids_doProcessAdditionMeta (opts) {
		const {additionMeta, modalFilterSpells} = opts;

		Object.values(additionMeta).forEach((levelMeta) => {
			if (levelMeta instanceof Array) {
				return levelMeta.forEach(spellItem => this._getSpellUids_doProcessSpellItem({...opts, spellItem, modalFilterSpells}));
			}

			Object.entries(levelMeta).forEach(([rechargeType, levelMetaInner]) => {
				this._getSpellUids_doProcessSpellRechargeBlock({...opts, rechargeType, levelMetaInner, modalFilterSpells});
			});
		});
	}

	static _getSpellUids_doProcessSpellItem (opts) {
		const {outSpells, spellItem, modalFilterSpells} = opts;

		if (typeof spellItem === "string") {
			return outSpells.push(this._getCleanUid(spellItem));
		}

		if (spellItem.all != null) { // A filter expression
			return modalFilterSpells.getEntitiesMatchingFilterExpression({
				filterExpression: spellItem.all,
				valuesOverride: {
					"Components & Miscellaneous": {
						"Legacy": 0,
						"Reprinted": 0,
					},
				},
			})
				.forEach(ent => outSpells.push(DataUtil.generic.getUid({name: ent.name, source: ent.source})));
		}

		if (spellItem.choose != null) {
			if (typeof spellItem.choose === "string") { // A filter expression
				return modalFilterSpells.getEntitiesMatchingFilterExpression({
					filterExpression: spellItem.choose,
					valuesOverride: {
						"Components & Miscellaneous": {
							"Legacy": 0,
							"Reprinted": 0,
						},
					},
				})
					.forEach(ent => outSpells.push(DataUtil.generic.getUid({name: ent.name, source: ent.source})));
			}

			if (spellItem.choose.from) { // An array of choices
				return spellItem.choose.from
					.forEach(uid => outSpells.push(this._getCleanUid(uid)));
			}

			throw new Error(`Unhandled additional spell format: "${JSON.stringify(spellItem)}"`);
		}

		throw new Error(`Unhandled additional spell format: "${JSON.stringify(spellItem)}"`);
	}

	static _getSpellUids_doProcessSpellRechargeBlock (opts) {
		const {rechargeType, levelMetaInner} = opts;

		switch (rechargeType) {
			case "rest":
			case "daily":
			case "resource":
			case "limited": {
				Object.values(levelMetaInner)
					.forEach(spellList => {
						spellList.forEach(spellItem => this._getSpellUids_doProcessSpellItem({...opts, spellItem}));
					});

				break;
			}

			case "will":
			case "ritual":
			case "_": {
				levelMetaInner.forEach(spellItem => this._getSpellUids_doProcessSpellItem({...opts, spellItem}));
				break;
			}

			default: throw new Error(`Unhandled spell recharge type "${rechargeType}"`);
		}
	}
	// endregion
}

// endregion

class _SpellSource {
	constructor () {
		this._lookup = {};
	}

	/* -------------------------------------------- */

	mutLookup (otherLookup) {
		this._mutLookup_recurse(otherLookup, this._lookup, []);
	}

	_mutLookup_recurse (otherLookup, obj, path) {
		Object.entries(obj)
			.forEach(([k, v]) => {
				if (typeof v !== "object" || v instanceof Array) {
					return MiscUtil.set(otherLookup, ...path, k, v);
				}

				this._mutLookup_recurse(otherLookup, v, [...path, k]);
			});
	}

	/* -------------------------------------------- */

	async pInit () { throw new Error("Unimplemented!"); }
}

class _SpellSourceClasses extends _SpellSource {
	constructor ({spellSourceLookupAdditional = null}) {
		super();
		this._spellSourceLookupAdditional = spellSourceLookupAdditional;
	}

	async pInit () {
		this._mutAddSpellSourceLookup({spellSourceLookup: await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/spells/sources.json`)});
		this._mutAddSpellSourceLookup({spellSourceLookup: this._spellSourceLookupAdditional});
	}

	_mutAddSpellSourceLookup ({spellSourceLookup}) {
		if (!spellSourceLookup) return;

		Object.entries(spellSourceLookup)
			.forEach(([spellSource, spellNameTo]) => {
				Object.entries(spellNameTo)
					.forEach(([spellName, propTo]) => {
						Object.entries(propTo)
							.forEach(([prop, arr]) => {
								const grouped = {};

								arr
									.forEach(({name: className, source: classSource, definedInSource}) => {
										const k = definedInSource || null;

										const tgt = MiscUtil.getOrSet(grouped, classSource, className, {definedInSources: []});

										if (!tgt.definedInSources.includes(k)) tgt.definedInSources.push(k);
									});

								Object.entries(grouped)
									.forEach(([classSource, byClassSource]) => {
										Object.entries(byClassSource)
											.forEach(([className, byClassName]) => {
												MiscUtil.set(
													this._lookup,
													spellSource.toLowerCase(),
													spellName.toLowerCase(),
													prop,
													classSource,
													className,
													byClassName.definedInSources.some(it => it != null)
														? {definedInSources: byClassName.definedInSources}
														: true,
												);
											});
									});
							});
					});
			});
	}
}

class _AdditionalSpellSource extends _SpellSource {
	constructor ({props, modalFilterSpells} = {}) {
		super();
		this._props = props;
		this._modalFilterSpells = modalFilterSpells;
	}

	/* -------------------------------------------- */

	_pInit_doProcessAdditionalSpells ({uidToSummary, additionalSpells, cntAdditionalSpellBlocks}) {
		if (!additionalSpells?.length) return;

		additionalSpells
			.forEach(additionalSpellBlock => {
				_SpellSourceUtil.getSpellUids(additionalSpellBlock, this._modalFilterSpells)
					.forEach(uid => {
						uidToSummary[uid] = uidToSummary[uid] || {
							cntAdditionalSpellBlocks,
						};

						if (additionalSpellBlock.name) {
							uidToSummary[uid].names ||= [];
							if (!uidToSummary[uid].names.includes(additionalSpellBlock.name)) uidToSummary[uid].names.push(additionalSpellBlock.name);
						}
					});
			});
	}

	async pInit () {
		const data = await this._pLoadData();

		await this._props
			.pSerialAwaitMap(async prop => {
				await data[prop]
					.filter(ent => ent.additionalSpells)
					.filter(ent => !this._isSkipEntity(ent))
					.pSerialAwaitMap(async ent => {
						const propPath = this._getPropPath(ent);

						const uidToSummary = {};

						const additionalSpellsMigrated = await UtilsAdditionalSpells.pGetMigratedAdditionalSpells(ent.additionalSpells);

						this._pInit_doProcessAdditionalSpells({
							uidToSummary,
							additionalSpells: ent.additionalSpells,
							cntAdditionalSpellBlocks: ent.additionalSpells.length,
						});
						if (!CollectionUtil.deepEquals(ent.additionalSpells, additionalSpellsMigrated)) {
							this._pInit_doProcessAdditionalSpells({
								uidToSummary,
								additionalSpells: additionalSpellsMigrated,
								cntAdditionalSpellBlocks: additionalSpellsMigrated.length,
							});
						}

						Object.entries(uidToSummary)
							.forEach(([uid, additionalSpellsSummary]) => {
								const val = this._getLookupValue(ent, additionalSpellsSummary);
								const {name, source} = DataUtil.proxy.unpackUid("spell", uid, "spell", {isLower: true});
								MiscUtil.set(this._lookup, source, name, ...propPath, val);
							});
					});
			});
	}

	async _pLoadData () { throw new Error("Unimplemented!"); }

	_isSkipEntity (ent) { return false; }

	_getPropPath (ent) { throw new Error("Unimplemented!"); }

	_getPropPath_nameSource (ent) { return [ent.source, ent.name]; }

	_getLookupValue (ent, additionalSpellsSummary) { return true; }
}

class _AdditionalSpellSourceClassesSubclasses extends _AdditionalSpellSource {
	static _HASHES_SKIPPED = new Set([
		UrlUtil.URL_TO_HASH_BUILDER["subclass"]({
			name: "College of Lore",
			shortName: "Lore",
			source: "PHB",
			className: "Bard",
			classSource: "PHB",
		}),
	]);

	constructor (opts) {
		super({
			...opts,
			props: [
				// Only include subclass additionalSpells, otherwise we add e.g. Bard Magical Secrets, which isn't helpful
				// "class",
				"subclass",
			],
		});
	}

	async _pLoadData () {
		return DataUtil.class.loadJSON();
	}

	_isSkipEntity (ent) {
		if (ent.className === VeCt.STR_GENERIC || ent.classSource === VeCt.STR_GENERIC) return true;
		// Avoid spam from "fake reprints" of 2014 subclasses.
		// Note that this breaks e.g. Plutonium spell sources for e.g. "2024 Bard with 2014 Lore subclass", but this is an
		//   acceptable loss.
		if (ent._isCopy && ent.edition === "classic" && ent.reprintedAs) return true;
		const hash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](ent);
		return this.constructor._HASHES_SKIPPED.has(hash);
	}

	_getPropPath (ent) {
		switch (ent.__prop) {
			case "class": return [ent.__prop, ...this._getPropPath_nameSource(ent)];
			case "subclass": return [ent.__prop, ent.classSource, ent.className, ent.source, ent.shortName];
			default: throw new Error(`Unhandled __prop "${ent.__prop}"`);
		}
	}

	_getLookupValue (ent, additionalSpellsSummary) {
		switch (ent.__prop) {
			case "subclass": {
				const out = {name: ent.name};

				// Only add `subSubclasses` if a spell is not shared between every sub-subclass
				if (additionalSpellsSummary.names && additionalSpellsSummary.cntAdditionalSpellBlocks !== additionalSpellsSummary.names.length) out.subSubclasses = additionalSpellsSummary.names;

				return out;
			}
			default: return super._getLookupValue(ent);
		}
	}
}

class _AdditionalSpellSourceRaces extends _AdditionalSpellSource {
	constructor (opts) {
		super({
			...opts,
			props: ["race"],
		});
	}

	async _pLoadData () {
		return DataUtil.race.loadJSON();
	}

	_getPropPath (ent) { return ["race", ...this._getPropPath_nameSource(ent)]; }

	_getLookupValue (ent) {
		if (!ent._isSubRace) return super._getLookupValue(ent);
		return {baseName: ent._baseName, baseSource: ent._baseSource};
	}
}

class _AdditionalSpellSourceFile extends _AdditionalSpellSource {
	constructor ({file, ...rest} = {}) {
		super({...rest});
		this._file = file;
	}

	async _pLoadData () {
		return DataUtil.loadJSON(`./data/${this._file}`);
	}

	_getPropPath (ent) { return [ent.__prop, ...this._getPropPath_nameSource(ent)]; }
}

class _AdditionalSpellSourceBackgrounds extends _AdditionalSpellSourceFile {
	constructor ({...rest}) {
		super({
			...rest,
			props: ["background"],
			file: "backgrounds.json",
		});
	}
}

class _AdditionalSpellSourceCharCreationOptions extends _AdditionalSpellSourceFile {
	constructor ({...rest}) {
		super({
			...rest,
			props: ["charoption"],
			file: "charcreationoptions.json",
		});
	}
}

class _AdditionalSpellSourceFeats extends _AdditionalSpellSourceFile {
	constructor ({...rest}) {
		super({
			...rest,
			props: ["feat"],
			file: "feats.json",
		});
	}
}

class _AdditionalSpellSourceOptionalFeatures extends _AdditionalSpellSourceFile {
	constructor ({...rest}) {
		super({
			...rest,
			props: ["optionalfeature"],
			file: "optionalfeatures.json",
		});
	}

	_getLookupValue (ent) {
		return {featureType: [...ent.featureType]};
	}
}

class _AdditionalSpellSourceRewards extends _AdditionalSpellSourceFile {
	constructor ({...rest}) {
		super({
			...rest,
			props: ["reward"],
			file: "rewards.json",
		});
	}
}

export class SpellSourceLookupBuilder {
	static async pGetLookup ({spells, spellSourceLookupAdditional = null}) {
		const cpySpells = MiscUtil.copyFast(spells);

		const lookup = {};

		for (
			const Clazz of [
				_SpellSourceClasses,
				_AdditionalSpellSourceClassesSubclasses,
				_AdditionalSpellSourceBackgrounds,
				_AdditionalSpellSourceCharCreationOptions,
				_AdditionalSpellSourceFeats,
				_AdditionalSpellSourceOptionalFeatures,
				_AdditionalSpellSourceRaces,
				_AdditionalSpellSourceRewards,
			]
		) {
			cpySpells.forEach(sp => PageFilterSpells.unmutateForFilters(sp));
			const modalFilterSpells = new ModalFilterSpells({allData: cpySpells});
			await modalFilterSpells.pPopulateHiddenWrapper();

			const adder = new Clazz({modalFilterSpells, spellSourceLookupAdditional});
			await adder.pInit();
			adder.mutLookup(lookup);

			DataUtil.spell.setSpellSourceLookup(lookup, {isExternalApplication: true});
			cpySpells.forEach(sp => {
				DataUtil.spell.unmutEntity(sp, {isExternalApplication: true});
				DataUtil.spell.mutEntity(sp, {isExternalApplication: true});
			});
		}

		return lookup;
	}
}
