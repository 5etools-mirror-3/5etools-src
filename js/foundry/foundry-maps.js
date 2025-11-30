class _MapNamer {
	constructor () {
		this._ixUnnamedMap = 1;
		this._ixsHeaderMaps = {};
	}

	static _RE_PT_VERSION_TYPES = /(Player|Unlabeled)/;
	static _RE_VERSION_MAP_NAMES = new RegExp(`^\\(?${this._RE_PT_VERSION_TYPES.source} Version\\)?$`, "i");
	static _RE_ADD_VERSION_SUFFIX = new RegExp(`${this._RE_PT_VERSION_TYPES.source}$`, "i");

	getMapName ({entry, parentEntry}) {
		if (entry.mapName) return entry.mapName;

		const {nameBase = null, nameParentEntry = null, isVersionNameBase = false} = this._getMapNameMeta({entry});

		if (!parentEntry?.title) {
			if (!nameBase) return nameParentEntry;
			if (isVersionNameBase) return nameParentEntry;
			return nameBase;
		}

		if (!isVersionNameBase) return nameBase;

		const cleanParentTitle = Renderer.stripTags(parentEntry.title)
			.replace(/\s*\(DM'?s? Version\)$/i, "");

		// If there's no base name, assume this is a "Player Version"
		if (!nameBase) return `${cleanParentTitle} (Player Version)`;

		// We have a "version" name base; clean it
		const nameBaseClean = nameBase
			.replace(/^\(/, "")
			.replace(/\)$/, "")
			.trim()
			// Ensure trailing "Version" for "Player Version" to match legacy map namer; follow the same pattern for other version types
			.replace(this.constructor._RE_ADD_VERSION_SUFFIX, "$1 Version");
		return `${cleanParentTitle} (${nameBaseClean})`;
	}

	_getMapNameMeta ({entry}) {
		const cleanTitle = Renderer.stripTags(entry.title);

		return {
			nameBase: cleanTitle,
			// If there's no name, or it has a generic "version" name, try to use the name of the nearest named parent entry
			nameParentEntry: entry._tmp_parentEntryName
				? this._getHeaderMapName({parentEntryName: entry._tmp_parentEntryName})
				: this._getUnnamedMapName(),
			isVersionNameBase: cleanTitle && this._isVersionMapName(cleanTitle),
		};
	}

	_isVersionMapName (str) {
		if (this.constructor._RE_VERSION_MAP_NAMES.test(str)) return true;
		if (/^\(?without tokens\)?$/i.test(str)) return true;
		return false;
	}

	_getUnnamedMapName () {
		return `(Unnamed Map ${this._ixUnnamedMap++})`;
	}

	_getHeaderMapName ({parentEntryName}) {
		const nameBase = `${parentEntryName}\u2013Map`;

		if (!this._ixsHeaderMaps[nameBase]) {
			this._ixsHeaderMaps[nameBase] = 2;
			return nameBase;
		}

		return `${nameBase} ${this._ixsHeaderMaps[nameBase]++}`;
	}
}

export class CorpusMapImageExtractor {
	static _IMPORTABLE_IMAGE_TYPES__MAP = new Set(["map", "mapPlayer"]);

	_doProcessNode_mutAddMaps (
		{
			availableMaps,
			entryIdToMap,
			entryIdToName,
			entry,
			entryStack,
			corpusName,
			corpusId,
			corpusType,
			source,
			chapterInfo,
		},
	) {
		if (entry.id && entry.name) entryIdToName[entry.id] = entry.name;

		if (entry.type !== "image" || !this.constructor._IMPORTABLE_IMAGE_TYPES__MAP.has(entry.imageType)) return;

		const url = this._getUrl({entry});
		if (!url) return; // Should never occur

		const mapEntry = MiscUtil.getOrSet(availableMaps, entry.imageType, url, MiscUtil.copyFast(entry));
		mapEntry.title = mapEntry.title || entry.title;

		mapEntry._url = url;

		mapEntry.corpusName = corpusName;
		mapEntry.corpusId = corpusId;
		mapEntry.corpusType = corpusType;

		// Add source for importers, etc. Note that we do not add a name here, as we will add it in `_mutMapNames`.
		mapEntry.source = mapEntry.source || source;

		// Add chapter name for importers, etc. (particularly, folder naming)
		if (chapterInfo) {
			mapEntry._chapterName = `${Parser.bookOrdinalToAbv(chapterInfo.ordinal, {isPlainText: true})}${chapterInfo.name || "(Unnamed Chapter)"}`;
		}

		// Add the last entry name, to be used later
		if (entryStack?.length) {
			mapEntry._tmp_parentEntryName = Renderer.stripTags([...entryStack].reverse().find(it => it.name)?.name);
		}

		if (entry.id) entryIdToMap[entry.id] = mapEntry;
	}

	_getUrl ({entry}) {
		if (entry?.href.type === "internal") return Renderer.get().getMediaUrl("img", entry.href.path);
		return entry.href?.url;
	}

	/**
	 * A post-processing step once all entries have been indexed in the `entryToIdMap`.
	 */
	_mutMapNames ({availableMaps, entryIdToMap, entryIdToName}) {
		const mapNamer = new _MapNamer();
		Object.values(availableMaps)
			.forEach(urlToEntry => {
				Object.values(urlToEntry)
					.forEach(entry => {
						this._mutMapNames_entry({entryIdToMap, entryIdToName, mapNamer, entry});
					});
			});
	}

	_mutMapNames_entry ({entryIdToMap, entryIdToName, mapNamer, entry}) {
		// region Add names to map regions
		if (entry.mapRegions) {
			entry.mapRegions.forEach(it => {
				it.name = it.name || entryIdToName[it.area];
			});
		}
		// endregion

		const parentEntry = entry.mapParent?.id ? entryIdToMap[entry.mapParent.id] : null;
		if (parentEntry) this._mutMapNames_entry({entryIdToMap, entryIdToName, mapNamer, entry: parentEntry});

		// Add name for importers, etc.
		entry.name = mapNamer.getMapName({entry, parentEntry});

		// Add parent entry, if it exists, for map region import
		entry._parentEntry = parentEntry;
	}

	/* -------------------------------------------- */

	getMutMapMeta (
		{
			head,
			body,
			corpusType,

			availableMaps = null,
			entryIdToName = null,
		},
	) {
		const entryIdToMap = {};

		availableMaps ||= {}; // Map of `imageType` -> `url` -> `entry`
		entryIdToName ||= {};

		const walker = MiscUtil.getWalker({isNoModification: true});

		body.data.forEach((ch, ixCh) => {
			walker.walk(
				ch,
				{
					object: (obj, lastKey, stack) => {
						this._doProcessNode_mutAddMaps({
							availableMaps,
							entryIdToMap,
							entryIdToName,
							entry: obj,
							entryStack: stack,
							corpusName: head.name,
							corpusId: head.id,
							corpusType,
							source: head.source,
							chapterInfo: head.contents?.[ixCh],
						});
						return obj;
					},
				},
				undefined,
				[],
			);
		});

		// Post-processing step to add names to maps
		this._mutMapNames({availableMaps, entryIdToMap, entryIdToName});

		return {
			availableMaps,
			entryIdToMap,
			entryIdToName,
		};
	}
}
