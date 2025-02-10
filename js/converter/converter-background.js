import {ConversionStateTextBase} from "./converterutils-models.js";
import {ConverterFeatureBase} from "./converter-feature.js";
import {ItemTag, TagJsons} from "./converterutils-entries.js";
import {BackgroundSkillTollLanguageEquipmentCoalesce, BackgroundSkillToolLanguageTag, ConverterBackgroundUtil, EquipmentBreakdown} from "./converterutils-background.js";
import {EntryCoalesceEntryLists, EntryCoalesceRawLines} from "./converterutils-entrycoalesce.js";
import {SITE_STYLE__ONE} from "../consts.js";
import {PropOrder} from "../utils-proporder.js";

class _ConversionStateTextBackground extends ConversionStateTextBase {}

export class ConverterBackground extends ConverterFeatureBase {
	/**
	 * Parses backgrounds from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 * @param options.source Entity source.
	 * @param options.page Entity page.
	 * @param options.titleCaseFields Array of fields to be title-cased in this entity (if enabled).
	 * @param options.isTitleCase Whether title-case fields should be title-cased in this entity.
	 * @param options.styleHint
	 */
	static doParseText (inText, options) {
		options = this._getValidOptions(options);

		const {toConvert, entity: background} = this._doParse_getInitialState(inText, options);
		if (!toConvert) return;

		const state = new _ConversionStateTextBackground({toConvert, options, entity: background});

		state.doPreLoop();
		for (; state.ixToConvert < toConvert.length; ++state.ixToConvert) {
			state.initCurLine();
			if (state.isSkippableCurLine()) continue;

			switch (state.stage) {
				case "name": this._doParseText_stepName(state); state.stage = "entries"; break;
				case "entries": this._doParseText_stepEntries(state); break;
				default: throw new Error(`Unknown stage "${state.stage}"`);
			}
		}
		state.doPostLoop();

		if (!background.entries?.length) delete background.entries;

		const entityOut = this._getFinalEntity(state, options);

		options.cbOutput(entityOut, options.isAppend);

		return entityOut;
	}

	static _doParseText_stepName (state) {
		const name = state.curLine.replace(/ Traits$/i, "");
		state.entity.name = this._getAsTitle("name", name, state.options.titleCaseFields, state.options.isTitleCase);
	}

	static _doParseText_stepEntries (state) {
		const ptrI = {_: state.ixToConvert};
		state.entity.entries = EntryCoalesceRawLines.mutGetCoalesced(
			ptrI,
			state.toConvert,
		);
		state.ixToConvert = ptrI._;
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _getFinalEntity (state, options) {
		if (options.styleHint === SITE_STYLE__ONE) state.entity.edition = SITE_STYLE__ONE;
		this._doBackgroundPostProcess(state, options);
		return PropOrder.getOrdered(state.entity, state.entity.__prop || "background");
	}

	static _doBackgroundPostProcess (state, options) {
		if (!state.entity.entries) return;

		// region Tag
		EntryCoalesceEntryLists.mutCoalesce(state.entity, "entries", {styleHint: options.styleHint});
		TagJsons.mutTagObject(state.entity, {keySet: new Set(["entries"]), isOptimistic: false, styleHint: options.styleHint});
		// endregion

		// region Background-specific cleanup and generation
		this._doPostProcess_setPrerequisites(state, options);
		this._doBackgroundPostProcess_feature(state.entity, options);
		BackgroundSkillTollLanguageEquipmentCoalesce.tryRun(state.entity, {cbWarning: options.cbWarning});
		BackgroundSkillToolLanguageTag.tryRun(state.entity, {cbWarning: options.cbWarning});
		this._doBackgroundPostProcess_equipment(state.entity, options);
		EquipmentBreakdown.tryRun(state.entity, {cbWarning: options.cbWarning});
		this._doBackgroundPostProcess_tables(state.entity, options);
		// endregion
	}

	static _doBackgroundPostProcess_feature (background, options) {
		const entFeature = background.entries.find(ent => ent.name?.startsWith("Feature: "));
		if (!entFeature) return;

		(entFeature.data ||= {}).isFeature = true;

		const walker = MiscUtil.getWalker({isNoModification: true});
		walker.walk(
			entFeature.entries,
			{
				string: (str) => {
					str.replace(/{@feat (?<tagContents>[^}]+)}/g, (...m) => {
						const {name, source} = DataUtil.proxy.unpackUid("feat", m.at(-1).tagContents, "feat", {isLower: true});
						(background.feats ||= []).push({[`${name}|${source}`]: true});

						(background.fromFeature ||= {}).feats = true;
					});
				},
			},
		);
	}

	static _doBackgroundPostProcess_equipment (background, options) {
		const entryEquipment = ConverterBackgroundUtil.getEquipmentEntry(background);
		if (!entryEquipment) return;

		entryEquipment.entry = ItemTag.tryRunBasicEquipment(entryEquipment.entry, {styleHint: options.styleHint});
	}

	static _doBackgroundPostProcess_tables (background, options) {
		for (let i = 1; i < background.entries.length; ++i) {
			const entPrev = background.entries[i - 1];
			if (!entPrev.entries?.length) continue;

			const ent = background.entries[i];
			if (ent.type !== "table") continue;

			entPrev.entries.push(ent);
			background.entries.splice(i--, 1);
		}
	}
}
