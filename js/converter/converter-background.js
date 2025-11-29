import {ConversionStateTextBase} from "./converterutils-models.js";
import {ConverterFeatureBase} from "./converter-feature.js";
import {ItemTag, TagJsons} from "./converterutils-entries.js";
import {BackgroundSkillTollLanguageEquipmentCoalesce, BackgroundSkillToolLanguageTag, ConverterBackgroundUtil, EquipmentBreakdown} from "./converterutils-background.js";
import {EntryCoalesceEntryLists, EntryCoalesceRawLines} from "./converterutils-entrycoalesce.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "../consts.js";
import {PropOrder} from "../utils-proporder.js";

class _ConversionStateTextBackground extends ConversionStateTextBase {
	_one_listItems = [];
}

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
				case "name": this._doParseText_stepName(state, options); state.stage = options.styleHint === SITE_STYLE__CLASSIC ? "entries" : this._getNextParseStep({state}); break;
				case "abilityScores": this._doParseText_stepAbilityScores(state, options); state.stage = this._getNextParseStep({state}); break;
				case "feat": this._doParseText_stepFeat(state, options); state.stage = this._getNextParseStep({state}); break;
				case "skillProficiencies": this._doParseText_stepSkillProficiencies(state, options); state.stage = this._getNextParseStep({state}); break;
				case "toolProficiencies": this._doParseText_stepToolProficiencies(state, options); state.stage = this._getNextParseStep({state}); break;
				case "equipment": this._doParseText_stepEquipment(state, options); state.stage = this._getNextParseStep({state}); break;
				case "entries": this._doParseText_stepEntries(state, options); break;
				case null: break;
				default: throw new Error(`Unknown stage "${state.stage}"`);
			}
		}
		state.doPostLoop();

		this._doParseText_one_applyListItems(state, options);

		if (!background.entries?.length) delete background.entries;

		const entityOut = this._getFinalEntity(state, options);

		options.cbOutput(entityOut, options.isAppend);

		return entityOut;
	}

	static _RE_LINE_START_ABILITY_SCORES = /^Ability Scores:/;
	static _RE_LINE_START_FEAT = /^Feat:/;
	static _RE_LINE_START_SKILL_PROFICIENCIES = /^Skill Proficienc(?:ies|y):/;
	static _RE_LINE_START_TOOL_PROFICIENCIES = /^Tool Proficienc(?:ies|y):/;
	static _RE_LINE_START_EQUIPMENT = /^Equipment:/;

	static _getNextParseStep ({state}) {
		const nxtLineMeta = state.getNextLineMeta();
		if (nxtLineMeta == null) return null;

		const {nxtLine} = nxtLineMeta;
		if (this._RE_LINE_START_ABILITY_SCORES.test(nxtLine)) return "abilityScores";
		if (this._RE_LINE_START_FEAT.test(nxtLine)) return "feat";
		if (this._RE_LINE_START_SKILL_PROFICIENCIES.test(nxtLine)) return "skillProficiencies";
		if (this._RE_LINE_START_TOOL_PROFICIENCIES.test(nxtLine)) return "toolProficiencies";
		if (this._RE_LINE_START_EQUIPMENT.test(nxtLine)) return "equipment";
		return "entries";
	}

	static _doParseText_stepName (state) {
		const name = state.curLine.replace(/ Traits$/i, "");
		state.entity.name = this._getAsTitle("name", name, state.options.titleCaseFields, state.options.isTitleCase);
	}

	static _doParseText_stepAbilityScores (state, options) {
		const lineNoHeader = state.curLine
			.replace(this._RE_LINE_START_ABILITY_SCORES, "");

		const tks = lineNoHeader
			.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)
			.map(it => it.trim().toLowerCase())
			.filter(Boolean);
		if (!tks.length) return;

		const lookup = Object.fromEntries(Object.entries(Parser.ATB_ABV_TO_FULL).map(([abv, abil]) => [abil.toLowerCase(), abv]));
		const abilsUnknown = tks.filter(tk => !lookup[tk]);
		if (abilsUnknown.length) return options.cbWarning(`Could not convert ability scores\u2014unknown ability name${abilsUnknown.length === 1 ? "" : "s"} ${abilsUnknown.map(it => `"${it}"`).join(", ")}!`);

		state._one_listItems.push({
			type: "item",
			name: state.curLine.slice(0, state.curLine.length - lineNoHeader.length).trim(),
			entry: state.curLine.slice(state.curLine.length - lineNoHeader.length).trim(),
		});

		const abilAbvs = tks.map(tk => lookup[tk]);
		state.entity.ability = [
			{choose: {weighted: {from: abilAbvs, weights: [2, 1]}}},
			{choose: {weighted: {from: abilAbvs, weights: [1, 1, 1]}}},
		];
	}

	static _doParseText_stepFeat (state, options) {
		const lineNoHeader = state.curLine
			.replace(this._RE_LINE_START_FEAT, "");

		const tks = state.curLine
			.replace(this._RE_LINE_START_FEAT, "")
			.replace(/\(see [^)]+\)/g, "")
			.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX)
			.map(it => it.trim().toLowerCase())
			.filter(Boolean);
		if (!tks.length) return;

		let ptEntry = state.curLine.slice(state.curLine.length - lineNoHeader.length).trim();
		tks.forEach(tk => ptEntry = ptEntry.replace(new RegExp(`\\b${tk.escapeRegexp()}\\b`, "i"), (...m) => `{@feat ${m[0]}|${state.options.source || ""}}`));

		state._one_listItems.push({
			type: "item",
			name: state.curLine.slice(0, state.curLine.length - lineNoHeader.length).trim(),
			entry: ptEntry,
		});

		// TODO(Future) attempt to map feat to available feats
		state.entity.feats = tks.map(tk => ({[`${tk.toLowerCase()}|${(state.options.source || "").toLowerCase()}`]: true}));
	}

	static _doParseText_stepSkillProficiencies (state, options) {
		const lineNoHeader = state.curLine
			.replace(this._RE_LINE_START_SKILL_PROFICIENCIES, "");

		state._one_listItems.push({
			type: "item",
			name: state.curLine.slice(0, state.curLine.length - lineNoHeader.length).trim(),
			entry: state.curLine.slice(state.curLine.length - lineNoHeader.length).trim(),
		});
	}

	static _doParseText_stepToolProficiencies (state, options) {
		const lineNoHeader = state.curLine
			.replace(this._RE_LINE_START_TOOL_PROFICIENCIES, "");

		state._one_listItems.push({
			type: "item",
			name: state.curLine.slice(0, state.curLine.length - lineNoHeader.length).trim(),
			entry: state.curLine.slice(state.curLine.length - lineNoHeader.length).trim(),
		});
	}

	static _doParseText_stepEquipment (state, options) {
		const lineNoHeader = state.curLine
			.replace(this._RE_LINE_START_EQUIPMENT, "");

		state._one_listItems.push({
			type: "item",
			name: state.curLine.slice(0, state.curLine.length - lineNoHeader.length).trim(),
			entry: state.curLine.slice(state.curLine.length - lineNoHeader.length).trim(),
		});
	}

	static _doParseText_stepEntries (state, options) {
		const ptrI = {_: state.ixToConvert};
		const entries = EntryCoalesceRawLines.mutGetCoalesced(
			ptrI,
			state.toConvert,
		);
		state.ixToConvert = ptrI._;

		if (options.styleHint === SITE_STYLE__CLASSIC) {
			state.entity.entries = entries;
			return;
		}

		state.entity.fluff = {entries};
	}

	static _doParseText_one_applyListItems (state, options) {
		if (options.styleHint === SITE_STYLE__CLASSIC) return;

		if (!state._one_listItems?.length) return;
		state.entity.entries = [{type: "list", style: "list-hang-notitle", items: state._one_listItems}];
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
