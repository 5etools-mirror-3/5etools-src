import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";
import {WALKER} from "../test-tags-utils.js";

export class EntityFileHandlerClass extends EntityFileHandlerBase {
	_props = ["class", "subclass", "classFeature", "subclassFeature"];

	static _FileState = class extends EntityFileHandlerBase._FileState {
		classFeatureLookup = {};
		subclassFeatureLookup = {};

		walkerHandlersNestedRefsClass = null;
		walkerHandlersNestedRefsSubclass = null;
		walkerHandlersNestedRefsOptionalFeatures = null;
		walkerHandlersNestedRefsFeats = null;
	};

	/* -------------------------------------------- */

	_doCheckClassRef ({logIdentOriginal, uidOriginal, filePath, name, source}) {
		const uidClass = DataUtil.proxy.getUid("class", {name, source}, {isMaintainCase: true});
		const urlClass = this._tagTestUrlLookup.getEncodedProxy(uidClass, "class");
		if (!this._tagTestUrlLookup.hasUrl(urlClass)) this._addMessage(`Missing class in ${logIdentOriginal}: ${uidOriginal} in file ${filePath} class part, "${uidClass}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({urlClass})}`);
	};

	_doCheckSubclassRef ({logIdentOriginal, uidOriginal, filePath, shortName, source, className, classSource}) {
		const uidSubclass = DataUtil.proxy.getUid("subclass", {name: shortName, shortName, source, className, classSource}, {isMaintainCase: true});
		const urlSubclass = this._tagTestUrlLookup.getEncodedProxy(uidSubclass, "subclass", "subclass");
		if (!this._tagTestUrlLookup.hasUrl(urlSubclass)) this._addMessage(`Missing subclass in ${logIdentOriginal}: ${uidOriginal} in file ${filePath} subclass part, "${uidSubclass}"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({urlSubclass})}`);
	};

	/* -------------------------------------------- */

	_pHandleFile_preProcess_initLookups ({filePath, contents, fileState}) {
		(contents.classFeature || [])
			.forEach(cf => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](cf);
				fileState.classFeatureLookup[hash] = true;
			});

		(contents.subclassFeature || [])
			.forEach(scf => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](scf);
				fileState.subclassFeatureLookup[hash] = true;
			});
	}

	_pHandleFile_preProcess_initWalkerHandlers ({filePath, contents, fileState}) {
		fileState.walkerHandlersNestedRefsClass = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refClassFeature") return;

					const uid = it.classFeature || it;
					const unpacked = DataUtil.class.unpackUidClassFeature(uid, {isLower: true});
					const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

					if (!fileState.classFeatureLookup[hash]) this._addMessage(`Missing class feature: ${uid} in file ${fileState.filePath} not found in the files "classFeature" array\n`);

					this._doCheckClassRef({
						logIdentOriginal: `"refClassFeature"`,
						uidOriginal: uid,
						filePath: fileState.filePath,
						name: unpacked.className,
						source: unpacked.classSource,
					});
				});
				return arr;
			},
		};

		fileState.walkerHandlersNestedRefsSubclass = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refSubclassFeature") return;

					const uid = it.subclassFeature || it;
					const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
					const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

					if (!fileState.subclassFeatureLookup[hash]) this._addMessage(`Missing subclass feature in "refSubclassFeature": ${uid} in file ${filePath} not found in the files "subclassFeature" array\n`);

					this._doCheckClassRef({
						logIdentOriginal: `"refClassFeature"`,
						uidOriginal: uid,
						filePath,
						name: unpacked.className,
						source: unpacked.classSource,
					});

					this._doCheckSubclassRef({
						logIdentOriginal: `"refSubclassFeature"`,
						uidOriginal: uid,
						filePath,
						shortName: unpacked.subclassShortName,
						source: unpacked.subclassSource,
						className: unpacked.className,
						classSource: unpacked.classSource,
					});
				});
				return arr;
			},
		};

		fileState.walkerHandlersNestedRefsOptionalFeatures = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refOptionalfeature") return;

					const url = this._tagTestUrlLookup.getEncodedProxy(it.optionalfeature, "optfeature", "optionalfeature");
					if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing optional feature: ${it.optionalfeature} in file ${fileState.filePath} (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
				});
				return arr;
			},
		};

		fileState.walkerHandlersNestedRefsFeats = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refFeat") return;

					const url = this._tagTestUrlLookup.getEncodedProxy(it.feat, "feat");
					if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing feat: ${it.feat} in file ${fileState.filePath} (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
				});
				return arr;
			},
		};
	}

	async _pHandleFile_preProcess ({filePath, contents, fileState}) {
		this._pHandleFile_preProcess_initLookups({filePath, contents, fileState});
		this._pHandleFile_preProcess_initWalkerHandlers({filePath, contents, fileState});
	}

	/* -------------------------------------------- */

	_pDoTestEntity_class_featureLinks ({filePath, fileState, ent, prop, propPrefixed}) {
		ent.classFeatures.forEach(ref => {
			const uid = ref.classFeature || ref;
			const unpacked = DataUtil.class.unpackUidClassFeature(uid, {isLower: true});
			const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);
			if (!fileState.classFeatureLookup[hash]) this._addMessage(`Missing class feature: ${uid} in file ${filePath} not found in the files "classFeature" array\n`);

			this._doCheckClassRef({
				logIdentOriginal: `"classFeature" array`,
				uidOriginal: uid,
				filePath,
				name: unpacked.className,
				source: unpacked.classSource,
			});
		});
	}

	async _pDoTestEntity_class ({filePath, fileState, ent, prop, propPrefixed}) {
		this._pDoTestEntity_class_featureLinks({filePath, fileState, ent, prop, propPrefixed});

		this._testAdditionalSpells(filePath, ent);
		this._testReprintedAs(filePath, ent, "class");
		this._testSrd(filePath, ent);
		this._testStartingEquipment(filePath, ent, {propDotPath: "startingEquipment.defaultData"});
	}

	/* ----- */

	_pDoTestEntity_subclass_featureLinks ({filePath, fileState, ent, prop, propPrefixed}) {
		ent.subclassFeatures.forEach(ref => {
			const uid = ref.subclassFeature || ref;
			const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
			const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

			if (!fileState.subclassFeatureLookup[hash]) this._addMessage(`Missing subclass feature: ${uid} in file ${filePath} not found in the files "subclassFeature" array\n`);
		});
	}

	async _pDoTestEntity_subclass ({filePath, fileState, ent, prop, propPrefixed}) {
		if (ent._copy && !ent.subclassFeatures) return;

		this._pDoTestEntity_subclass_featureLinks({filePath, fileState, ent, prop, propPrefixed});

		this._testAdditionalSpells(filePath, ent);
		this._testReprintedAs(filePath, ent, "subclass");
		this._testSrd(filePath, ent);
	}

	/* ----- */

	async _pDoTestEntity_classFeature ({filePath, fileState, ent, prop, propPrefixed}) {
		WALKER.walk(ent.entries, fileState.walkerHandlersNestedRefsClass);
		WALKER.walk(ent.entries, fileState.walkerHandlersNestedRefsOptionalFeatures);
		WALKER.walk(ent.entries, fileState.walkerHandlersNestedRefsFeats);
	}

	async _pDoTestEntity_subclassFeature ({filePath, fileState, ent, prop, propPrefixed}) {
		WALKER.walk(ent.entries, fileState.walkerHandlersNestedRefsSubclass);
		WALKER.walk(ent.entries, fileState.walkerHandlersNestedRefsOptionalFeatures);
		WALKER.walk(ent.entries, fileState.walkerHandlersNestedRefsFeats);
	}

	/* ----- */

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		switch (prop) {
			case "class": return this._pDoTestEntity_class({filePath, fileState, ent, prop, propPrefixed});
			case "subclass": return this._pDoTestEntity_subclass({filePath, fileState, ent, prop, propPrefixed});
			case "classFeature": return this._pDoTestEntity_classFeature({filePath, fileState, ent, prop, propPrefixed});
			case "subclassFeature": return this._pDoTestEntity_subclassFeature({filePath, fileState, ent, prop, propPrefixed});
		}
	}
}
