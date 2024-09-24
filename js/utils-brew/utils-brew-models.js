export class _BrewDocContentMigrator {
	static mutMakeCompatible (json) {
		this._mutMakeCompatible_item(json);
		this._mutMakeCompatible_race(json);
		this._mutMakeCompatible_monster(json);
		this._mutMakeCompatible_object(json);
		this._mutMakeCompatible_subclass(json);
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

	/**
	 * @since 2024-09-20
	 * Copy subclasses (and subclass features, if they are below level 3) from reprinted 2014-era classes to
	 *   their 2024-era counterparts
	 */
	static _mutMakeCompatible_subclass_oneSubclassCopies (json) {
		const hasCopies = (json.subclass || []).some(sc => sc.source !== Parser.SRC_XPHB && sc.classSource === Parser.SRC_PHB);
		if (!hasCopies) return false;

		const internalCopies = MiscUtil.getOrSet(json, "_meta", "internalCopies", []);
		if (!internalCopies.includes("subclass")) internalCopies.push("subclass");

		const outSubclasses = [];
		const outSubclassFeatures = [];

		json.subclass
			.filter(sc => sc.source !== Parser.SRC_XPHB && sc.classSource === Parser.SRC_PHB)
			.forEach(sc => {
				const scNxt = {
					classSource: Parser.SRC_XPHB,
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
						const unpacked = DataUtil.class.unpackUidSubclassFeature(uid);
						return unpacked.level < this._MIN_SUBCLASS_FEATURE_LEVEL;
					});

				outSubclasses.push(scNxt);

				if (!scfRefsLowLevel.length) return;

				scNxt.subclassFeatures = [
					...scfRefsLowLevel
						.map(scfRef => {
							const uid = scfRef.subclassFeature || scfRef;
							const unpacked = DataUtil.class.unpackUidSubclassFeature(uid);

							const scfNxt = {
								classSource: Parser.SRC_XPHB,
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
		if (outSubclassFeatures.length) json.subclassFeature.push(...outSubclassFeatures);

		if (outSubclassFeatures.length && !internalCopies.includes("subclassFeature")) internalCopies.push("subclassFeature");

		return true;
	}
}

export class BrewDoc {
	// Things which are stored in "_meta", but are "content metadata" rather than "file metadata."
	static _META_KEYS_CONTENT_METADATA__OBJECT = [
		"skills",
		"senses",
		"spellSchools",
		"spellDistanceUnits",
		"optionalFeatureTypes",
		"psionicTypes",
		"currencyConversions",
	];

	constructor (opts) {
		opts = opts || {};
		this.head = opts.head;
		this.body = opts.body;
	}

	toObject () { return MiscUtil.copyFast({...this}); }

	static fromValues ({head, body}) {
		return new this({
			head: _BrewDocHead.fromValues(head),
			body,
		});
	}

	static fromObject (obj, opts = {}) {
		const {isCopy = false} = opts;
		return new this({
			head: _BrewDocHead.fromObject(obj.head, opts),
			body: isCopy ? MiscUtil.copyFast(obj.body) : obj.body,
		});
	}

	mutUpdate ({json}) {
		this.body = json;
		this.head.mutUpdate({json, body: this.body});
		return this;
	}

	isEmpty () {
		if (
			Object.entries(this.body)
				.some(([k, v]) => {
					if (!(v instanceof Array)) return false;
					if (k === "_meta" || k === "_test") return false;
					return !!v.length;
				})
		) return false;

		if (!this.body._meta) return false;

		if (
			this.constructor._META_KEYS_CONTENT_METADATA__OBJECT
				.some(k => !!Object.keys(this.body._meta[k] || {}).length)
		) return false;

		return true;
	}

	// region Conditions
	static isOperationPermitted_moveToEditable ({brew, isAllowLocal = false} = {}) {
		return !brew.head.isEditable
			&& (isAllowLocal || !brew.head.isLocal);
	}
	// endregion

	// region Merging
	mutMerge ({json, isLazy = false}) {
		this.body = this.constructor.mergeObjects({isCopy: !isLazy, isMutMakeCompatible: false}, this.body, json);
		this.head.mutMerge({json, body: this.body, isLazy});
		return this;
	}

	static mergeObjects ({isCopy = true, isMutMakeCompatible = true} = {}, ...jsons) {
		const out = {};

		jsons.forEach(json => {
			json = isCopy ? MiscUtil.copyFast(json) : json;

			if (isMutMakeCompatible) _BrewDocContentMigrator.mutMakeCompatible(json);

			Object.entries(json)
				.forEach(([prop, val]) => {
					switch (prop) {
						case "_meta": return this._mergeObjects_key__meta({out, prop, val});
						case "_test": return; // ignore; used for static testing
						default: return this._mergeObjects_default({out, prop, val});
					}
				});
		});

		return out;
	}

	static _META_KEYS_MERGEABLE_OBJECTS = [
		...this._META_KEYS_CONTENT_METADATA__OBJECT,
	];

	static _META_KEYS_MERGEABLE_SPECIAL = {
		"dateAdded": (a, b) => a != null && b != null ? Math.min(a, b) : a ?? b,
		"dateLastModified": (a, b) => a != null && b != null ? Math.max(a, b) : a ?? b,

		"dependencies": (a, b) => this._metaMerge_dependenciesIncludes(a, b),
		"includes": (a, b) => this._metaMerge_dependenciesIncludes(a, b),
		"internalCopies": (a, b) => [...(a || []), ...(b || [])].unique(),

		"otherSources": (a, b) => this._metaMerge_otherSources(a, b),

		"status": (a, b) => this._metaMerge_status(a, b),
	};

	static _metaMerge_dependenciesIncludes (a, b) {
		if (a != null && b != null) {
			Object.entries(b)
				.forEach(([prop, arr]) => a[prop] = [...(a[prop] || []), ...arr].unique());
			return a;
		}

		return a ?? b;
	}

	static _metaMerge_otherSources (a, b) {
		if (a != null && b != null) {
			// Note that this can clobber the values in the mapping, but we don't really care since they're not used.
			Object.entries(b)
				.forEach(([prop, obj]) => a[prop] = Object.assign(a[prop] || {}, obj));
			return a;
		}

		return a ?? b;
	}

	static _META_MERGE__STATUS_PRECEDENCE = [
		"invalid",
		"deprecated",
		"wip",
		"ready",
	];

	static _metaMerge_status (a, b) {
		return [a || "ready", b || "ready"]
			.sort((a, b) => this._META_MERGE__STATUS_PRECEDENCE.indexOf(a) - this._META_MERGE__STATUS_PRECEDENCE.indexOf(b))[0];
	}

	static _mergeObjects_key__meta ({out, val}) {
		out._meta = out._meta || {};

		out._meta.sources = [...(out._meta.sources || []), ...(val.sources || [])];

		Object.entries(val)
			.forEach(([metaProp, metaVal]) => {
				if (this._META_KEYS_MERGEABLE_SPECIAL[metaProp]) {
					out._meta[metaProp] = this._META_KEYS_MERGEABLE_SPECIAL[metaProp](out._meta[metaProp], metaVal);
					return;
				}
				if (!this._META_KEYS_MERGEABLE_OBJECTS.includes(metaProp)) return;
				Object.assign(out._meta[metaProp] = out._meta[metaProp] || {}, metaVal);
			});
	}

	static _mergeObjects_default ({out, prop, val}) {
		// If we cannot merge a prop, use the first value found for it, as a best-effort fallback
		if (!(val instanceof Array)) return out[prop] === undefined ? out[prop] = val : null;

		out[prop] = [...out[prop] || [], ...val];
	}
	// endregion
}

class _BrewDocHead {
	constructor (opts) {
		opts = opts || {};

		this.docIdLocal = opts.docIdLocal;
		this.timeAdded = opts.timeAdded;
		this.checksum = opts.checksum;
		this.url = opts.url;
		this.filename = opts.filename;
		this.isLocal = opts.isLocal;
		this.isEditable = opts.isEditable;
	}

	toObject () { return MiscUtil.copyFast({...this}); }

	static fromValues (
		{
			json,
			url = null,
			filename = null,
			isLocal = false,
			isEditable = false,
		},
	) {
		return new this({
			docIdLocal: CryptUtil.uid(),
			timeAdded: Date.now(),
			checksum: CryptUtil.md5(JSON.stringify(json)),
			url: url,
			filename: filename,
			isLocal: isLocal,
			isEditable: isEditable,
		});
	}

	static fromObject (obj, {isCopy = false} = {}) {
		return new this(isCopy ? MiscUtil.copyFast(obj) : obj);
	}

	mutUpdate ({json}) {
		this.checksum = CryptUtil.md5(JSON.stringify(json));
		return this;
	}

	mutMerge ({json, body, isLazy}) {
		if (!isLazy) this.checksum = CryptUtil.md5(JSON.stringify(body ?? json));
		return this;
	}
}
