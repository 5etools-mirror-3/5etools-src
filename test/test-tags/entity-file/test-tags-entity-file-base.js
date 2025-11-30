import {DataTesterBase} from "5etools-utils";

/**
 * @abstract
 */
export class EntityFileHandlerBase extends DataTesterBase {
	constructor ({tagTestUrlLookup}) {
		super();
		this._tagTestUrlLookup = tagTestUrlLookup;
	}

	/* -------------------------------------------- */

	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	/**
	 * @abstract
	 */
	_props;

	static _FileState = class {
		filePath;
		contents;

		constructor ({filePath, contents}) {
			this.filePath = filePath;
			this.contents = contents;
		}
	};

	async pHandleFile (filePath, contents) {
		// TODO(Future) remove once all handlers are migrated
		if (!this._props) return;

		const fileState = new this.constructor._FileState({filePath, contents});

		await this._pHandleFile_preProcess({filePath, contents, fileState});

		for (const [prop, arr] of Object.entries(contents)) {
			if (!(arr instanceof Array)) continue;

			const filename = filePath.split("/").at(-1);
			const propPrefixed = filename === "foundry.json" || filename.startsWith("foundry-")
				? `foundry${prop.uppercaseFirst()}`
				: prop;

			if (!this._props.includes(propPrefixed)) continue;

			for (const ent of arr) {
				await this._pDoTestEntity({filePath, fileState, ent, prop, propPrefixed});
			}
		}
	}

	async _pHandleFile_preProcess ({filePath, contents, fileState}) { /* Implement as required */ }

	/**
	 * @abstract
	 * @return void
	 */
	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	_doCheckSeeAlso ({entity, prop, tag, file}) {
		if (!entity[prop]) return;

		const defaultSource = Parser.getTagSource(tag).toLowerCase();

		const deduped = entity[prop].map(it => {
			it = it.toLowerCase();
			if (!it.includes("|")) it += `|${defaultSource}`;
			return it;
		}).unique();
		if (deduped.length !== entity[prop].length) {
			this._addMessage(`Duplicate "${prop}" in ${file} for ${entity.source}, ${entity.name}\n`);
		}

		entity[prop].forEach(s => {
			const url = this._tagTestUrlLookup.getEncodedProxy(s, tag);
			if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${s} in file ${file} (evaluates to "${url}") in "${prop}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		});
	}

	_getCleanSpellUid (spellUid) {
		return spellUid.split("#")[0]; // An optional "cast at spell level" can be added with a "#"; remove it
	}

	_testAdditionalSpells_testSpellExists (file, spellOrObj) {
		if (typeof spellOrObj === "object") {
			if (spellOrObj.choose != null || spellOrObj.all != null) {
				// e.g. "level=0|class=Sorcerer"
				return;
			}

			throw new Error(`Unhandled additionalSpells special object in "${file}": ${JSON.stringify(spellOrObj)}`);
		}

		const url = this._tagTestUrlLookup.getEncodedProxy(this._getCleanSpellUid(spellOrObj), "spell");

		if (!this._tagTestUrlLookup.hasUrl(url)) {
			this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in "additionalSpells"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		}
	}

	static _ADDITIONAL_SPELLS_IGNORED_KEYS = new Set([
		"ability",
		"name",
		"resourceName",
	]);

	_testAdditionalSpells (file, obj) {
		if (!obj.additionalSpells) return;
		obj.additionalSpells
			.forEach(additionalSpellOption => {
				Object.entries(additionalSpellOption)
					.forEach(([k, levelToSpells]) => {
						if (this.constructor._ADDITIONAL_SPELLS_IGNORED_KEYS.has(k)) return;

						Object.values(levelToSpells).forEach(spellListOrMeta => {
							if (spellListOrMeta instanceof Array) {
								return spellListOrMeta.forEach(sp => this._testAdditionalSpells_testSpellExists(file, sp));
							}

							Object.entries(spellListOrMeta)
								.forEach(([prop, val]) => {
									switch (prop) {
										case "daily":
										case "rest":
										case "resource":
										case "limited":
											Object.values(val).forEach(spellList => spellList.forEach(sp => this._testAdditionalSpells_testSpellExists(file, sp)));
											break;
										case "will":
										case "ritual":
										case "_":
											val.forEach(sp => this._testAdditionalSpells_testSpellExists(file, sp));
											break;
										default: throw new Error(`Unhandled additionalSpells prop "${prop}"`);
									}
								});
						});
					});
			});
	}

	_testAdditionalFeats (file, obj) {
		if (!obj.feats) return;

		obj.feats.forEach(featsObj => {
			Object.entries(featsObj)
				.forEach(([k]) => {
					if (["any", "anyFromCategory"].includes(k)) return;

					const url = this._tagTestUrlLookup.getEncodedProxy(k, "feat");

					if (this._tagTestUrlLookup.hasUrl(url)) return;
					if (this._tagTestUrlLookup.hasVersionUrl(url)) return;

					this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in "feats"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
				});
		});
	}

	_testReprintedAs (file, obj, tag) {
		if (!obj.reprintedAs) return;

		obj.reprintedAs
			.forEach(rep => {
				const _tag = rep.tag ?? tag;
				const _uid = rep.uid ?? rep;

				const url = this._tagTestUrlLookup.getEncodedProxy(_uid, _tag, Parser.getTagProps(_tag)[0]);

				if (this._tagTestUrlLookup.hasUrl(url)) return;

				this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in "${_tag}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});
	}

	_testStartingEquipment (file, obj, {propDotPath = "startingEquipment"} = {}) {
		const propPath = propDotPath.split(".");
		const equi = MiscUtil.get(obj, ...propPath);

		if (!equi) return;

		equi
			.forEach(group => {
				Object.entries(group)
					.forEach(([, arr]) => {
						arr
							.forEach(meta => {
								if (!meta.item) return;

								const url = this._tagTestUrlLookup.getEncodedProxy(meta.item, "item");

								if (this._tagTestUrlLookup.hasUrl(url)) return;

								this._addMessage(`Missing link: ${meta.item} in file ${file} (evaluates to "${url}") in "${propDotPath}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
							});
					});
			});
	}

	_testSrd (file, obj) {
		["srd", "srd52"]
			.forEach(prop => {
				if (typeof obj[prop] !== "string") return;
				if (Renderer.stripTags(obj[prop]) === obj[prop]) return;

				this._addMessage(`SRD value contained tags: "${prop}" in file ${file} was "${obj[prop]}"`);
			});
	}

	_testFoundryActivities (file, obj, {propDotPath = "activities"} = {}) {
		const propPath = propDotPath.split(".");
		const activities = MiscUtil.get(obj, ...propPath);

		if (!activities?.length) return;

		activities
			.forEach((activity, ixActivity) => {
				if (activity?.consumption?.targets?.length) {
					activity.consumption.targets
						.forEach((consumptionTarget, ixConsumptionTarget) => {
							if (!consumptionTarget.target?.prop || !consumptionTarget.target?.uid) return;

							const {uid, prop} = consumptionTarget.target;
							const url = this._tagTestUrlLookup.getEncodedProxy(uid, Parser.getPropTag(prop), prop);

							if (this._tagTestUrlLookup.hasUrl(url)) return;

							this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in activity "${obj.name}" (${obj.source}) ${propDotPath}[${ixActivity}]consumption.targets[${ixConsumptionTarget}]\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
						});
				}
			});
	}
}
