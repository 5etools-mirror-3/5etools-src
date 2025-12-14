export class BrewDocContentMigrator {
	static mutMakeCompatible (json) {
		this._mutMakeCompatible_item(json);
		this._mutMakeCompatible_race(json);
		this._mutMakeCompatible_monster(json);
		this._mutMakeCompatible_trap(json);
		this._mutMakeCompatible_object(json);
		this._mutMakeCompatible_subclass(json);
		this._mutMakeCompatible_class_classSpells(json);
		this._mutMakeCompatible_subclass_subclassSpells(json);
		this._mutMakeCompatible_spell(json);
	}

	/* ----- */

	static _mutMakeCompatible_item (json) {
		if (!json.variant) return false;

		// 2022-07-09
		json.magicvariant = json.variant;
		delete json.variant;
	}

	/* ----- */

	static _mutMakeCompatible_race (json) {
		if (!json.subrace) return false;

		json.subrace.forEach(sr => {
			if (!sr.race) return;
			sr.raceName = sr.race.name;
			sr.raceSource = sr.race.source || sr.source || Parser.SRC_PHB;
		});
	}

	/* ----- */

	static _mutMakeCompatible_monster (json) {
		if (!json.monster) return false;

		json.monster.forEach(mon => {
			// 2022-03-22
			if (typeof mon.size === "string") mon.size = [mon.size];

			// 2022=05-29
			if (mon.summonedBySpell && !mon.summonedBySpellLevel) mon.summonedBySpellLevel = 1;
		});
	}

	/* ----- */

	static _mutMakeCompatible_trap (json) {
		if (!json.trap) return false;

		json.trap.forEach(ent => {
			// 2024-11-13
			if (ent.rating) return;

			if (!ent.tier && !ent.level && !ent.threat) return;

			ent.rating = [
				{
					tier: ent.tier,
					level: ent.level,
					threat: ent.threat,
				},
			];
			delete ent.tier;
			delete ent.level;
			delete ent.threat;
		});
	}

	/* ----- */

	static _mutMakeCompatible_object (json) {
		if (!json.object) return false;

		json.object.forEach(obj => {
			// 2023-10-07
			if (typeof obj.size === "string") obj.size = [obj.size];
		});
	}

	/* ----- */

	static _mutMakeCompatible_subclass (json) {
		this._mutMakeCompatible_subclass_oneSubclassCopies(json);
	}

	static _PROPS_SUBCLASS_MAINTAIN = ["name", "source", "shortName", "className"];
	static _PROPS_SUBCLASS_COPY = [...this._PROPS_SUBCLASS_MAINTAIN, "classSource"];

	static _PROPS_SUBCLASS_FEATURE_MAINTAIN = ["name", "className", "source", "subclassShortName", "subclassSource"];
	static _PROPS_SUBCLASS_FEATURE_COPY = [...this._PROPS_SUBCLASS_FEATURE_MAINTAIN, "level", "classSource"];

	static _MIN_SUBCLASS_FEATURE_LEVEL = 3; // 2024+ classes all gain initial subclass features at level 3

	static _isOneToCopySubclass (sc) {
		if (sc.source !== Parser.SRC_XPHB && sc.classSource === Parser.SRC_PHB) return true;
		if (sc.className === "Artificer" && sc.source !== Parser.SRC_EFA && sc.classSource === Parser.SRC_TCE) return true;
		return false;
	}

	/**
	 * @since 2024-09-20
	 * Copy subclasses (and subclass features, if they are below level 3) from reprinted 2014-era classes to
	 *   their 2024-era counterparts
	 *
	 * @see 5ET-BUG-176 -- if subclass features below level 3, then `subclassFeature` `_copy` generated, which
	 * breaks if referenced `subclassFeature` is missing in the brew.
	 */
	static _mutMakeCompatible_subclass_oneSubclassCopies (json) {
		const hasCopies = (json.subclass || []).some(sc => this._isOneToCopySubclass(sc));
		if (!hasCopies) return false;

		const internalCopies = MiscUtil.getOrSet(json, "_meta", "internalCopies", []);
		if (!internalCopies.includes("subclass")) internalCopies.push("subclass");

		const outSubclasses = [];
		const outSubclassFeatures = [];
		const depsSubclass = new Set();

		json.subclass
			.filter(sc => this._isOneToCopySubclass(sc))
			.forEach(sc => {
				const classSource = sc.className === "Artificer" ? Parser.SRC_EFA : Parser.SRC_XPHB;
				const scNxt = {
					classSource,
				};
				this._PROPS_SUBCLASS_MAINTAIN.forEach(prop => scNxt[prop] = MiscUtil.copyFast(sc[prop]));
				scNxt._copy = {
					...Object.fromEntries(
						this._PROPS_SUBCLASS_COPY
							.map(prop => [prop, MiscUtil.copyFast(sc[prop])]),
					),
					"_preserve": {
						"page": true,
						"otherSources": true,
						"srd": true,
						"basicRules": true,
						"reprintedAs": true,
					},
				};

				if (sc.hasFluff || sc.hasFluffImages) {
					scNxt.fluff = {
						_subclassFluff: Object.fromEntries(
							this._PROPS_SUBCLASS_COPY
								.map(prop => [prop, MiscUtil.copyFast(sc[prop])]),
						),
					};
				}

				const fauxScHash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](scNxt);
				const scExisting = json.subclass.find(sc => UrlUtil.URL_TO_HASH_BUILDER["subclass"](sc) === fauxScHash);

				// If the brew already defines a version of the subclass for the 2024-era class, avoid making one
				if (scExisting) return;

				// `.subclassFeatures` may not exist for e.g. "_copy" subclasses; always "_copy" these
				const [scfRefsLowLevel, scfRefsOther] = (sc.subclassFeatures || [])
					.segregate(scfRef => {
						const uid = scfRef.subclassFeature || scfRef;
						const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
						return unpacked.level < this._MIN_SUBCLASS_FEATURE_LEVEL && unpacked.classSource !== VeCt.STR_GENERIC.toLowerCase();
					});

				outSubclasses.push(scNxt);

				if (!scfRefsLowLevel.length) return;

				scNxt.subclassFeatures = [
					...scfRefsLowLevel
						.map(scfRef => {
							const uid = scfRef.subclassFeature || scfRef;
							const unpacked = DataUtil.class.unpackUidSubclassFeature(uid);

							// When copying a site subclass feature re-used in a homebrew subclass,
							//   include the site class as a dependency.
							// Note that we do not do this for e.g. homebrew depending on homebrew,
							//   as we assume the brew already defines this relationship.
							const sourceJson = Parser.sourceJsonToJson(unpacked.source);
							if (SourceUtil.isSiteSource(sourceJson)) {
								depsSubclass.add(unpacked.className.toLowerCase());
							}

							const scfNxt = {
								classSource,
								level: this._MIN_SUBCLASS_FEATURE_LEVEL,
							};
							this._PROPS_SUBCLASS_FEATURE_MAINTAIN.forEach(prop => scfNxt[prop] = MiscUtil.copyFast(unpacked[prop]));
							scfNxt._copy = {
								...Object.fromEntries(
									this._PROPS_SUBCLASS_FEATURE_COPY
										.map(prop => [prop, MiscUtil.copyFast(unpacked[prop])]),
								),
								"_preserve": {
									"page": true,
								},
							};

							outSubclassFeatures.push(scfNxt);

							const uidNxt = DataUtil.class.packUidSubclassFeature(scfNxt);
							if (scfRef.subclassFeature) {
								return {
									...MiscUtil.copy(scfRef),
									subclassFeature: uidNxt,
								};
							}
							return uidNxt;
						}),
					...scfRefsOther,
				];
			});

		if (outSubclasses.length) json.subclass.push(...outSubclasses);
		if (outSubclassFeatures.length) (json.subclassFeature ||= []).push(...outSubclassFeatures);

		if (outSubclassFeatures.length && !internalCopies.includes("subclassFeature")) internalCopies.push("subclassFeature");

		if (depsSubclass.size) {
			const tgt = MiscUtil.getOrSet(json, "_meta", "dependencies", "subclass", []);
			depsSubclass.forEach(dep => {
				if (!tgt.includes(dep)) tgt.push(dep);
			});
		}

		return true;
	}

	/* ----- */

	static _mutMakeCompatible_classSubclassSpells_getMigrated (arr) {
		return arr
			.filter(uid => typeof uid === "string")
			.map(it => it.trim())
			.filter(Boolean)
			.map(uid => DataUtil.proxy.unpackUid("spell", uid, "spell", {isLower: true}))
			.filter(unpacked => unpacked.source === Parser.SRC_PHB.toLowerCase())
			.map(unpacked => DataUtil.proxy.getUid("spell", {...unpacked, source: Parser.SRC_XPHB}));
	}

	/**
	 * @since 2024-11-28
	 * As a temporary measure, for classes which have `classSpells`, make XPHB copies of PHB spell entries.
	 * @deprecated TODO(Future) remove/rework when moving to a better solution for homebrew spell sources
	 */
	static _mutMakeCompatible_class_classSpells (json) {
		if (!json.class) return false;

		json.class
			.forEach(cls => {
				if (!cls.classSpells) return;
				cls.classSpells = [...cls.classSpells, ...this._mutMakeCompatible_classSubclassSpells_getMigrated(cls.classSpells)];
			});
	}

	/**
	 * @since 2024-11-28
	 * As a temporary measure, for subclasses which have `subclassSpells`, make XPHB copies of PHB spell entries.
	 * @deprecated TODO(Future) remove/rework when moving to a better solution for homebrew spell sources
	 */
	static _mutMakeCompatible_subclass_subclassSpells (json) {
		if (!json.subclass) return false;

		json.subclass
			.forEach(sc => {
				if (sc.subclassSpells) sc.subclassSpells = [...sc.subclassSpells, ...this._mutMakeCompatible_classSubclassSpells_getMigrated(sc.subclassSpells)];

				if (sc.subSubclassSpells) {
					Object.entries(sc.subSubclassSpells)
						.forEach(([k, arr]) => {
							sc.subSubclassSpells[k] = [...arr, ...this._mutMakeCompatible_classSubclassSpells_getMigrated(arr)];
						});
				}
			});
	}

	/* ----- */

	/**
	 * @since 2024-10-06
	 * As a temporary measure, for spells which have `classes.fromClassList`, make XPHB copies of PHB class entries.
	 * @deprecated TODO(Future) remove/rework when moving to a better solution for homebrew spell sources
	 */
	static _mutMakeCompatible_spell (json) {
		if (!json.spell) return false;

		this._mutMakeCompatible_spell_classProp({json, prop: "fromClassList"});
		this._mutMakeCompatible_spell_classProp({json, prop: "fromClassListVariant"});
	}

	static _mutMakeCompatible_spell_classProp ({json, prop}) {
		json.spell
			.forEach(ent => {
				if (!ent?.classes?.[prop]?.length) return;

				const phbNames = {};
				const tceNames = {};
				const xphbNames = {};
				const efaNames = {};

				ent.classes[prop]
					.forEach(classMeta => {
						if (classMeta.source === Parser.SRC_PHB) phbNames[classMeta.name] = classMeta;
						if (classMeta.name === "Artificer" && classMeta.source === Parser.SRC_TCE) tceNames[classMeta.name] = classMeta;

						if (classMeta.source === Parser.SRC_XPHB) xphbNames[classMeta.name] = true;
						if (classMeta.name === "Artificer" && classMeta.source === Parser.SRC_EFA) efaNames[classMeta.name] = true;
					});

				Object.keys(xphbNames).forEach(name => delete phbNames[name]);
				Object.keys(efaNames).forEach(name => delete tceNames[name]);

				Object.values(phbNames)
					.forEach(classMeta => ent.classes[prop].push({...classMeta, source: Parser.SRC_XPHB}));
				Object.values(tceNames)
					.forEach(classMeta => ent.classes[prop].push({...classMeta, source: Parser.SRC_EFA}));
			});
	}
}
