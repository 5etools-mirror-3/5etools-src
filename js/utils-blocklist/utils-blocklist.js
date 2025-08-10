export class UtilsBlocklist {
	static _PROPS_NO_BLOCKLIST = new Set([
		"itemProperty",
		"itemType",
		"spellList",
		"adventureTuple",
		"bookTuple",
		"map",
		"roll20Spell",
		"makebrewCreatureTrait",
	]);
	static _PROP_RE_FOUNDRY = /^foundry[A-Z]/;

	/* -------------------------------------------- */

	/**
	 * @param {Array} arr
	 * @param {?string} prop
	 * @param {boolean} isIgnoreBlocklist
	 * @param {?Function} fnMissingSource
	 * @param {?Function} fnMissingProp
	 */
	static getBlocklistFilteredArray (arr, {prop = null, isIgnoreBlocklist = false, fnMissingSource = null, fnMissingProp = null} = {}) {
		if (!arr || !(arr instanceof Array)) return arr;

		return arr
			.filter(ent => {
				const propEnt = ent.__prop || prop;

				// Ignore "Generic" entries, as we expect them to be synthetic
				if (SourceUtil.getEntitySource(ent) === VeCt.STR_GENERIC) return true;

				if (propEnt && this._PROPS_NO_BLOCKLIST.has(propEnt)) return true;
				if (propEnt && this._PROP_RE_FOUNDRY.test(propEnt)) return false;

				// region Sanity check
				if (!SourceUtil.getEntitySource(ent)) {
					if (fnMissingSource) fnMissingSource({ent});
					return true;
				}

				const hashBuilder = UrlUtil.URL_TO_HASH_BUILDER[propEnt];
				if (!hashBuilder) {
					if (fnMissingProp) fnMissingProp({ent, propEnt});
					return true;
				}
				// endregion

				if (!isIgnoreBlocklist && this._isExcludedEntity({ent, propEnt, hashBuilder})) return false;

				if (!isIgnoreBlocklist) this._mutExcludeSubEntities({ent, propEnt});

				return true;
			});
	}

	/* -------------------------------------------- */

	static _isExcludedEntity ({ent, propEnt, hashBuilder}) {
		switch (propEnt) {
			case "item":
			case "baseitem":
			case "itemGroup":
			case "magicvariant":
			case "_specificVariant": {
				return Renderer.item.isExcluded(ent);
			}

			case "race": {
				return this._isExcludedRaceSubrace(ent)
					|| this._isExcludedEntityGeneric({ent, propEnt, hashBuilder});
			}

			default: return this._isExcludedEntityGeneric({ent, propEnt, hashBuilder});
		}
	}

	static _isExcludedRaceSubrace ({ent, propEnt}) {
		if (propEnt !== "race") return false;
		return ent._subraceName
			&& ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER["subrace"]({name: ent._subraceName, source: ent.source, raceName: ent._baseName, raceSource: ent._baseSource}),
				"subrace",
				SourceUtil.getEntitySource(ent),
				{isNoCount: true},
			);
	}

	static _isExcludedEntityGeneric ({ent, propEnt, hashBuilder}) {
		return ExcludeUtil.isExcluded(
			hashBuilder(ent),
			propEnt,
			SourceUtil.getEntitySource(ent),
			{isNoCount: true},
		);
	}

	/* -------------------------------------------- */

	static _mutExcludeSubEntities ({ent, propEnt}) {
		switch (propEnt) {
			case "class": return this._mutExcludeSubEntities_class({ent});
		}
	}

	static _mutExcludeSubEntities_class ({ent}) {
		if (ent.classFeatures?.length) {
			ent.classFeatures = ent.classFeatures
				.filter(cf => {
					if (cf.hash == null) return true;

					return !ExcludeUtil.isExcluded(
						cf.hash,
						"classFeature",
						cf.source,
						{isNoCount: true},
					);
				});
		}

		if (ent.subclasses?.length) {
			ent.subclasses = ent.subclasses
				.filter(sc => {
					if (sc.source === VeCt.STR_GENERIC) return false;

					return !ExcludeUtil.isExcluded(
						UrlUtil.URL_TO_HASH_BUILDER["subclass"](sc),
						"subclass",
						sc.source,
						{isNoCount: true},
					);
				});

			ent.subclasses
				.forEach(sc => {
					if (!sc.subclassFeatures) return;

					sc.subclassFeatures = sc.subclassFeatures
						.filter(scf => {
							if (scf.hash == null) return true;

							return !ExcludeUtil.isExcluded(
								scf.hash,
								"subclassFeature",
								scf.source,
								{isNoCount: true},
							);
						});
				});
		}
	}
}
