import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {RenderPageImplBase} from "./render-page-base.js";

export class RenderSpellsSettings {
	static SETTINGS = {
		isDisplayGroups: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Groups",
			help: `Whether or not "Groups" should be shown for a spell.`,
			defaultVal: true,
		}),

		isDisplayClasses: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Classes",
			help: `Whether or not "Classes" should be shown for a spell.`,
			defaultVal: true,
		}),
		isDisplayClassesLegacy: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Classes (Legacy)",
			help: `Whether or not "Classes (legacy)" should be shown for a spell.`,
			defaultVal: false,
		}),

		isDisplaySubclasses: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Subclasses",
			help: `Whether or not "Subclasses" should be shown for a spell.`,
			defaultVal: true,
		}),
		isDisplaySubclassesLegacy: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Subclasses (Legacy)",
			help: `Whether or not "Subclasses (legacy)" should be shown for a spell.`,
			defaultVal: false,
		}),

		isDisplayVariantClasses: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Optional/Variant Classes",
			help: `Whether or not "Optional/Variant Classes" should be shown for a spell.`,
			defaultVal: true,
		}),
		isDisplayVariantClassesLegacy: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Optional/Variant Classes (Legacy)",
			help: `Whether or not "Optional/Variant Classes (legacy)" should be shown for a spell.`,
			defaultVal: false,
		}),

		isDisplayRaces: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Species",
			help: `Whether or not "Species" should be shown for a spell.`,
			defaultVal: true,
		}),

		isDisplayBackgrounds: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Backgrounds",
			help: `Whether or not "Backgrounds" should be shown for a spell.`,
			defaultVal: true,
		}),

		isDisplayFeats: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Show Feats",
			help: `Whether or not "Feats" should be shown for a spell.`,
			defaultVal: true,
		}),

		isDisplayOptionalfeatures: new SettingsUtil.Setting({
			type: "boolean",
			name: "Spell Sources: Other Options/Features",
			help: `Whether or not "Other Options/Features" should be shown for a spell.`,
			defaultVal: true,
		}),
	};
}

/** @abstract */
class _RenderSpellsImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_SPELLS;
	_dataProp = "spell";

	getRendered (ent, opts) {
		opts = {...opts || {}};
		opts.subclassLookup ||= {};
		opts.settings ||= SettingsUtil.getDefaultSettings(RenderSpellsSettings.SETTINGS);
		return super.getRendered(ent, opts);
	}

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			opts,
			renderer,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtLevelSchoolRitual: this._getCommonHtmlParts_levelSchoolRitual({ent}),

			htmlPtCastingTime: this._getCommonHtmlParts_castingTime({ent}),
			htmlPtRange: this._getCommonHtmlParts_range({ent}),
			htmlPtComponents: this._getCommonHtmlParts_components({ent}),
			htmlPtDuration: this._getCommonHtmlParts_duration({ent}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
			htmlPtFrom: this._getCommonHtmlParts_from({ent, opts, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_levelSchoolRitual ({ent}) {
		return `<tr><td colspan="6">${Renderer.spell.getHtmlPtLevelSchoolRitual(ent, {styleHint: this._style})}</td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_castingTime ({ent}) {
		return `<tr><td colspan="6" ${this._style === "classic" ? "" : `class="pt-2"`}>${Renderer.spell.getHtmlPtCastingTime(ent, {styleHint: this._style})}</td></tr>`;
	}

	_getCommonHtmlParts_range ({ent}) {
		return `<tr><td colspan="6">${Renderer.spell.getHtmlPtRange(ent, {styleHint: this._style, isDisplaySelfArea: SourceUtil.isClassicSource(ent.source)})}</td></tr>`;
	}

	_getCommonHtmlParts_components ({ent}) {
		return `<tr><td colspan="6">${Renderer.spell.getHtmlPtComponents(ent)}</td></tr>`;
	}

	_getCommonHtmlParts_duration ({ent}) {
		return `<tr><td colspan="6" ${this._style === "classic" ? "" : `class="pb-2"`}>${Renderer.spell.getHtmlPtDuration(ent, {styleHint: this._style})}</td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const stack = [];

		const entryList = {type: "entries", entries: ent.entries};
		renderer.recursiveRender(entryList, stack, {depth: 1});
		if (ent.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: ent.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, stack, {depth: 2});
		}

		return stack.join("");
	}

	_getCommonHtmlParts_from ({ent, opts, renderer}) {
		const {subclassLookup, settings} = opts;

		const stackFroms = [];

		if (settings.isDisplayGroups) this._mutStackPtSpellSource({ent, stackFroms, renderer, title: "Groups", propSpell: "groups"});

		const fromClassList = Renderer.spell.getCombinedClasses(ent, "fromClassList");
		if (fromClassList.length) {
			const [current, legacy] = Parser.spClassesToCurrentAndLegacy(fromClassList);
			if (settings.isDisplayClasses) {
				stackFroms.push(`<div><span class="bold">Classes: </span>${Parser.spMainClassesToFull(current)}</div>`);
			}
			if (settings.isDisplayClassesLegacy && legacy.length) {
				stackFroms.push(`<div class="ve-muted"><span class="bold">Classes (legacy): </span>${Parser.spMainClassesToFull(legacy)}</div>`);
			}
		}

		const fromSubclass = Renderer.spell.getCombinedClasses(ent, "fromSubclass");
		if (fromSubclass.length) {
			const [current, legacy] = Parser.spSubclassesToCurrentAndLegacyFull(ent, subclassLookup);
			if (settings.isDisplaySubclasses) {
				stackFroms.push(`<div><span class="bold">Subclasses: </span>${current}</div>`);
			}
			if (settings.isDisplaySubclassesLegacy && legacy.length) {
				stackFroms.push(`<div class="ve-muted"><span class="bold">Subclasses (legacy): </span>${legacy}</div>`);
			}
		}

		const fromClassListVariant = Renderer.spell.getCombinedClasses(ent, "fromClassListVariant");
		if (fromClassListVariant.length) {
			const [current, legacy] = Parser.spVariantClassesToCurrentAndLegacy(fromClassListVariant);
			if (settings.isDisplayVariantClasses && current.length) {
				stackFroms.push(`<div><span class="bold" title="&quot;Optional&quot; spells may be added to a campaign by the DM. &quot;Variant&quot; spells are generally available, but may be made available to a class by the DM.">Optional/Variant Classes: </span>${Parser.spMainClassesToFull(current)}</div>`);
			}
			if (settings.isDisplayVariantClassesLegacy && legacy.length) {
				stackFroms.push(`<div class="ve-muted"><span class="bold" title="&quot;Optional&quot; spells may be added to a campaign by the DM. &quot;Variant&quot; spells are generally available, but may be made available to a class by the DM.">Optional/Variant Classes (legacy): </span>${Parser.spMainClassesToFull(legacy)}</div>`);
			}
		}

		if (settings.isDisplayRaces) this._mutStackPtSpellSource({ent, stackFroms, renderer, title: "Species", propSpell: "races", prop: "race", tag: "race"});
		if (settings.isDisplayBackgrounds) this._mutStackPtSpellSource({ent, stackFroms, renderer, title: "Backgrounds", propSpell: "backgrounds", prop: "background", tag: "background"});
		if (settings.isDisplayFeats) this._mutStackPtSpellSource({ent, stackFroms, renderer, title: "Feats", propSpell: "feats", prop: "feat", tag: "feat"});
		if (settings.isDisplayOptionalfeatures) this._mutStackPtSpellSource({ent, stackFroms, renderer, title: "Other Options/Features", propSpell: "optionalfeatures", prop: "optionalfeature", tag: "optfeature"});

		if (
			ent.level >= 5
			&& fromClassList?.some(it => it.name === "Wizard" && it?.source === Parser.SRC_PHB)
		) {
			stackFroms.push(`<section class="ve-muted mt-2">`);
			renderer.recursiveRender(`{@italic Note: Both the {@class fighter||Fighter (Eldritch Knight)|eldritch knight} and the {@class rogue||Rogue (Arcane Trickster)|arcane trickster} spell lists include all {@class Wizard} spells. Spells of 5th level or higher may be cast with the aid of a spell scroll or similar.}`, stackFroms, {depth: 2});
			stackFroms.push(`</section>`);
		}

		return stackFroms.join("");
	}

	_mutStackPtSpellSource ({ent, stackFroms, renderer, title, propSpell, prop, tag}) {
		const froms = Renderer.spell.getCombinedGeneric(ent, {propSpell, prop});
		if (!froms.length) return;

		const ptFroms = froms
			.map(it => {
				const pt = tag ? renderer.render(`{@${tag} ${it.name}|${it.source}}`) : `<span class="help-subtle" title="Source: ${(Parser.sourceJsonToFull(it.source)).qq()}">${it.name}</span>`;
				return `${SourceUtil.isNonstandardSource(it.source) ? `<span class="ve-muted">` : ``}${pt}${SourceUtil.isNonstandardSource(it.source) ? `</span>` : ``}`;
			})
			.join(", ");

		stackFroms.push(`<div><span class="bold">${title}: </span>${ptFroms}</div>`);
	}
}

class _RenderSpellsImplClassic extends _RenderSpellsImplBase {
	_style = SITE_STYLE__CLASSIC;

	/* -------------------------------------------- */

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtLevelSchoolRitual,

			htmlPtCastingTime,
			htmlPtRange,
			htmlPtComponents,
			htmlPtDuration,

			htmlPtEntries,
			htmlPtFrom,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			opts,
			renderer,
		});

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}

			${htmlPtLevelSchoolRitual}

			${htmlPtCastingTime}
			${htmlPtRange}
			${htmlPtComponents}
			${htmlPtDuration}

			${Renderer.utils.getDividerTr()}

			<tr><td colspan="6">
				${htmlPtEntries}
				${htmlPtFrom}
			</td></tr>

			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

class _RenderSpellsImplOne extends _RenderSpellsImplBase {
	_style = SITE_STYLE__ONE;

	/* -------------------------------------------- */

	_getRendered ({ent, opts, renderer}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtLevelSchoolRitual,

			htmlPtCastingTime,
			htmlPtRange,
			htmlPtComponents,
			htmlPtDuration,

			htmlPtEntries,
			htmlPtFrom,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			opts,
			renderer,
		});

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}

			${htmlPtLevelSchoolRitual}

			${htmlPtCastingTime}
			${htmlPtRange}
			${htmlPtComponents}
			${htmlPtDuration}

			<tr><td colspan="6">
				${htmlPtEntries}
				${htmlPtFrom}
			</td></tr>

			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderSpells {
	static _RENDER_CLASSIC = new _RenderSpellsImplClassic();
	static _RENDER_ONE = new _RenderSpellsImplOne();

	/**
	 * @param {object} ent
	 * @param [opts]
	 * @param [opts.subclassLookup]
	 * @param [opts.isSkipExcludesRender]
	 * @param [opts.settings]
	 */
	static getRenderedSpell (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.getRendered(ent, opts);
			case SITE_STYLE__ONE: return this._RENDER_ONE.getRendered(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
