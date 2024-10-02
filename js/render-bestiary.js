import {VetoolsConfig} from "./utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";

/** @abstract */
class _RenderBestiaryImplBase {
	_style;

	/**
	 * @param {object} mon
	 * @param [opts]
	 * @param {jQuery} [opts.$btnScaleCr]
	 * @param {jQuery} [opts.$btnResetScaleCr]
	 * @param {HTMLElementModified} [opts.selSummonSpellLevel]
	 * @param {HTMLElementModified} [opts.selSummonClassLevel]
	 * @param {boolean} [opts.isSkipExcludesRender]
	 * @param {boolean} [opts.isSkipTokenRender]
	 *
	 * @return {jQuery}
	 */
	$getRenderedCreature (mon, opts) {
		opts ||= {};

		Renderer.monster.initParsed(mon);
		const renderer = Renderer.get();

		return Renderer.monster.getRenderWithPlugins({
			renderer,
			mon,
			fn: () => this._$getRenderedCreature({mon, opts, renderer}),
		});
	}

	/**
	 * @abstract
	 *
	 * @param {object} mon
	 * @param opts
	 * @param {jQuery} [opts.$btnScaleCr]
	 * @param {jQuery} [opts.$btnResetScaleCr]
	 * @param {HTMLElementModified} [opts.selSummonSpellLevel]
	 * @param {HTMLElementModified} [opts.selSummonClassLevel]
	 * @param {boolean} [opts.isSkipExcludesRender]
	 * @param {boolean} [opts.isSkipTokenRender]
	 * @param {Renderer} renderer
	 *
	 * @return {jQuery}
	 */
	_$getRenderedCreature ({mon, opts, renderer}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	_isInlinedToken ({mon, opts}) {
		return !opts.isSkipTokenRender && Renderer.monster.hasToken(mon);
	}

	_getBtnPronounce ({mon}) {
		return `<button class="ve-btn ve-btn-xs ve-btn-default stats__btn-name-pronounce lst-is-exporting-image__hidden no-print ml-2 mb-2 ve-self-flex-end">
			<span class="glyphicon glyphicon-volume-up stats__icn-pronounce-name"></span>
			<audio class="ve-hidden" preload="none" data-name="aud-pronounce">
			   <source src="${Renderer.utils.getEntryMediaUrl(mon, "soundClip", "audio")}" type="audio/mpeg">
			</audio>
		</button>`;
	}

	/* -------------------------------------------- */

	_getRenderedSectionHeader ({mon, title, prop}) {
		const propNote = `${prop}Note`;
		return `<tr><td colspan="6"><h3 class="stats__sect-header-inner">${title}${mon[propNote] ? ` (<span class="small">${mon[propNote]}</span>)` : ""}</h3></td></tr>`;
	}

	/**
	 * @param {?object} mon
	 * @param prop
	 * @param entries
	 * @param depth
	 * @param fnGetHeader
	 * @return {string}
	 */
	_getRenderedSection ({mon = null, prop, entries, depth = 1, fnGetHeader = null}) {
		const renderer = Renderer.get();
		const renderStack = [];

		switch (prop) {
			case "lairaction":
			case "regionaleffect": {
				renderer.setFirstSection(true).recursiveRender({entries: entries}, renderStack, {depth: depth + 1});
				break;
			}

			case "legendary":
			case "mythic": {
				const cpy = MiscUtil.copy(entries).map(it => {
					if (it.name && it.entries) {
						it.name = `${it.name}.`;
						it.type = it.type || "item";
					}
					return it;
				});
				const toRender = {type: "list", style: "list-hang-notitle", items: cpy};
				renderer.setFirstSection(true).recursiveRender(toRender, renderStack, {depth: depth});
				break;
			}

			default: {
				entries.forEach(e => {
					if (e.rendered) renderStack.push(e.rendered);
					else renderer.setFirstSection(true).recursiveRender(e, renderStack, {depth: depth + 1});
				});
			}
		}

		const ptHeader = mon
			? (fnGetHeader ? fnGetHeader(mon) : Renderer.monster.getSectionIntro(mon, {prop}))
			: "";

		return `${ptHeader ? `<tr><td colspan="6" class="stats__sect-row-inner">${ptHeader}</td></tr>` : ""}
			<tr><td colspan="6" class="stats__sect-row-inner">${renderStack.join("")}</td></tr>`;
	}

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			mon,
			renderer,

			isSkipExcludesRender,

			isInlinedToken,

			entsAction,
			entsBonusAction,
			entsReaction,
			legGroup,
		},
	) {
		return {
			htmlPtIsExcluded: this._getCommonHtmlParts_isExcluded({mon, isSkipExcludesRender}),
			htmlPtName: this._getCommonHtmlParts_name({mon, isInlinedToken}),
			htmlPtSizeTypeAlignment: this._getCommonHtmlParts_sizeTypeAlignment({mon, isInlinedToken}),

			htmlPtHitPoints: this._getCommonHtmlParts_hitPoints({mon, isInlinedToken}),
			htmlPtsResources: this._getCommonHtmlParts_resources({mon, isInlinedToken}),
			htmlPtSpeed: this._getCommonHtmlParts_speed({mon, isInlinedToken}),

			htmlPtAbilityScores: this._getHtmlParts_abilityScores({mon, renderer}),

			htmlPtSkills: this._getCommonHtmlParts_skills({mon, renderer}),
			htmlPtVulnerabilities: this._getCommonHtmlParts_vulnerabilities({mon}),
			htmlPtResistances: this._getCommonHtmlParts_resistances({mon}),
			htmlPtSenses: this._getCommonHtmlParts_senses({mon}),
			htmlPtLanguages: this._getCommonHtmlParts_languages({mon}),

			htmlPtActions: this._getCommonHtmlParts_actions({mon, entsAction}),
			htmlPtBonusActions: this._getCommonHtmlParts_bonusActions({mon, entsBonusAction}),
			htmlPtReactions: this._getCommonHtmlParts_reactions({mon, entsReaction}),
			htmlPtLegendaryActions: this._getCommonHtmlParts_legendaryActions({mon}),
			htmlPtMythicActions: this._getCommonHtmlParts_mythicActions({mon}),

			htmlPtLairActions: this._getCommonHtmlParts_lairActions({legGroup}),
			htmlPtRegionalEffects: this._getCommonHtmlParts_regionalEffects({legGroup}),

			htmlPtFooterExtended: this._getCommonHtmlParts_footerExtended({mon, renderer, legGroup}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_isExcluded ({mon, isSkipExcludesRender}) {
		if (isSkipExcludesRender) return "";
		return Renderer.utils.getExcludedTr({entity: mon, dataProp: "monster", page: UrlUtil.PG_BESTIARY});
	}

	_getCommonHtmlParts_name ({mon, isInlinedToken}) {
		return Renderer.utils.getNameTr(
			mon,
			{
				controlRhs: mon.soundClip ? this._getBtnPronounce({mon}) : "",
				isInlinedToken,
				page: UrlUtil.PG_BESTIARY,
				extensionData: {
					_scaledCr: mon._scaledCr,
					_scaledSpellSummonLevel: mon._scaledSpellSummonLevel,
					_scaledClassSummonLevel: mon._scaledClassSummonLevel,
				},
			},
		);
	}

	_getCommonHtmlParts_sizeTypeAlignment ({mon, isInlinedToken}) {
		return `<tr><td colspan="6"><div ${isInlinedToken ? `class="stats__wrp-avoid-token"` : ""}><i>${Renderer.monster.getTypeAlignmentPart(mon)}</i></div></td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_hitPoints ({mon, isInlinedToken}) {
		const label = this._style === "classic" ? "Hit Points" : "HP";
		const ptTitle = this._style === "classic" ? "" : `title="Hit Points"`;
		const rendered = mon.hp == null ? "\u2014" : Renderer.monster.getRenderedHp(mon.hp);
		return `<tr><td colspan="6"><div ${isInlinedToken ? `class="stats__wrp-avoid-token"` : ""}><strong ${ptTitle}>${label}</strong> ${rendered}</div></td></tr>`;
	}

	_getCommonHtmlParts_resources ({mon, isInlinedToken}) {
		return mon.resource?.length
			? mon.resource
				.map(res => `<tr><td colspan="6"><div ${isInlinedToken ? `class="stats__wrp-avoid-token"` : ""}><strong>${res.name}</strong> ${Renderer.monster.getRenderedResource(res)}</div></td></tr>`)
			: [];
	}

	_getCommonHtmlParts_speed ({mon, isInlinedToken}) {
		return `<tr><td colspan="6"><div ${this._style !== "classic" && isInlinedToken ? `class="stats__wrp-avoid-token"` : ""}><strong>Speed</strong> ${Parser.getSpeedString(mon, {styleHint: this._style})}</div></td></tr>`;
	}

	/* ----- */

	_getHtmlParts_abilityScores ({mon, renderer}) {
		return Renderer.monster.getRenderedAbilityScores(mon, {style: this._style, renderer});
	}

	/* ----- */

	_getCommonHtmlParts_skills ({mon, renderer}) {
		return mon.skill ? `<tr><td colspan="6"><strong>Skills</strong> ${Renderer.monster.getSkillsString(renderer, mon)}</td></tr>` : "";
	}

	_getCommonHtmlParts_vulnerabilities ({mon}) {
		const label = this._style === "classic" ? "Damage Vulnerabilities" : "Vulnerabilities";
		return mon.vulnerable ? `<tr><td colspan="6"><strong>${label}</strong> ${Parser.getFullImmRes(mon.vulnerable, {isTitleCase: this._style !== "classic"})}</td></tr>` : "";
	}

	_getCommonHtmlParts_resistances ({mon}) {
		const label = this._style === "classic" ? "Damage Resistances" : "Resistances";
		return mon.resist ? `<tr><td colspan="6"><strong>${label}</strong> ${Parser.getFullImmRes(mon.resist, {isTitleCase: this._style !== "classic"})}</td></tr>` : "";
	}

	_getCommonHtmlParts_senses ({mon}) {
		return `<tr><td colspan="6"><strong>Senses</strong> ${Renderer.monster.getSensesPart(mon, {isTitleCase: this._style !== "classic"})}</td></tr>`;
	}

	_getCommonHtmlParts_languages ({mon}) {
		return `<tr><td colspan="6"><strong>Languages</strong> ${Renderer.monster.getRenderedLanguages(mon.languages, {styleHint: this._style})}</td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_actions ({mon, entsAction}) {
		return `${entsAction?.length ? `${this._getRenderedSectionHeader({mon, title: "Actions", prop: "action"})}
		${this._getRenderedSection({mon, prop: "action", entries: entsAction})}` : ""}`;
	}

	_getCommonHtmlParts_bonusActions ({mon, entsBonusAction}) {
		return `${entsBonusAction?.length ? `${this._getRenderedSectionHeader({mon, title: "Bonus Actions", prop: "bonus"})}
		${this._getRenderedSection({mon, prop: "bonus", entries: entsBonusAction})}` : ""}`;
	}

	_getCommonHtmlParts_reactions ({mon, entsReaction}) {
		return `${entsReaction?.length ? `${this._getRenderedSectionHeader({mon, title: "Reactions", prop: "reaction"})}
		${this._getRenderedSection({mon, prop: "reaction", entries: entsReaction})}` : ""}`;
	}

	_getCommonHtmlParts_legendaryActions ({mon}) {
		return `${mon.legendary ? `${this._getRenderedSectionHeader({mon, title: "Legendary Actions", prop: "legendary"})}
		${this._getRenderedSection({mon, prop: "legendary", entries: mon.legendary, fnGetHeader: Renderer.monster.getLegendaryActionIntro.bind(Renderer.monster)})}` : ""}`;
	}

	_getCommonHtmlParts_mythicActions ({mon}) {
		return `${mon.mythic ? `${this._getRenderedSectionHeader({mon, title: "Mythic Actions", prop: "mythic"})}
		${this._getRenderedSection({mon, prop: "mythic", entries: mon.mythic})}` : ""}`;
	}

	/* ----- */

	_getCommonHtmlParts_lairActions ({legGroup}) {
		return `${legGroup && legGroup.lairActions ? `<tr><td colspan="6"><h3 class="stats__sect-header-inner stats__sect-header-inner--non-statblock">Lair Actions</h3></td></tr>
		${this._getRenderedSection({prop: "lairaction", entries: legGroup.lairActions, depth: -1})}` : ""}`;
	}

	_getCommonHtmlParts_regionalEffects ({legGroup}) {
		return `${legGroup && legGroup.regionalEffects ? `<tr><td colspan="6"><h3 class="stats__sect-header-inner stats__sect-header-inner--non-statblock">Regional Effects</h3></td></tr>
		${this._getRenderedSection({prop: "regionaleffect", entries: legGroup.regionalEffects, depth: -1})}` : ""}`;
	}

	/* ----- */

	_getCommonHtmlParts_footerExtended ({mon, renderer, legGroup}) {
		const renderedVariants = Renderer.monster.getRenderedVariants(mon, {renderer});

		const htmlSourceAndEnvironment = this._getHtmlPartsourceAndEnvironment(mon, legGroup);

		const ptVariants = renderedVariants ? `<tr><td colspan="6">${renderedVariants}</td></tr>` : "";

		const ptFooter = `${mon.footer ? `<tr><td colspan="6" class="stats__sect-row-inner">${renderer.render({entries: mon.footer})}</td></tr>` : ""}
		${mon.summonedBySpell ? `<tr><td colspan="6"><b>Summoned By:</b> ${renderer.render(`{@spell ${mon.summonedBySpell}}`)}</td></tr>` : ""}
		${htmlSourceAndEnvironment.length === 2 ? `<tr><td colspan="6">${htmlSourceAndEnvironment[1]}</td></tr>` : ""}
		<tr><td colspan="6">${htmlSourceAndEnvironment[0]}</td></tr>`.trim();

		return `${ptVariants}
		${ptFooter.length ? `<tr><td colspan="6" class="p-0 pt-3"></td></tr>` : ""}
		${ptFooter}`;
	}

	_getHtmlPartsourceAndEnvironment (mon, legGroup) {
		const srcCpy = {
			source: mon.source,
			page: mon.page,
			srd: mon.srd,
			srd52: mon.srd52,
			sourceSub: mon.sourceSub,
			otherSources: mon.otherSources,
			additionalSources: mon.additionalSources,
			externalSources: mon.externalSources,
			reprintedAs: mon.reprintedAs,
			__prop: mon.__prop,
		};
		const additional = mon.additionalSources ? MiscUtil.copy(mon.additionalSources) : [];
		if (mon.variant?.length) {
			mon.variant.forEach(v => {
				if (!v.source) return "";
				additional.push({
					source: v.source,
					page: v.page,
				});
			});
		}
		if (legGroup) {
			if (legGroup.source !== mon.source) additional.push({source: legGroup.source, page: legGroup.page});
			if (legGroup.additionalSources) additional.push(...MiscUtil.copy(legGroup.additionalSources));
		}
		srcCpy.additionalSources = additional;

		const pageTrInner = Renderer.utils.getSourceAndPageTrHtml(srcCpy);
		if (!mon.environment?.length) return [pageTrInner];
		return [pageTrInner, `<div><b>Environment:</b> ${Renderer.monster.getRenderedEnvironment(mon.environment)}</div>`];
	}

	/* -------------------------------------------- */

	_$getTdChallenge (mon, opts) {
		const ptLabel = `<strong ${this._style === "classic" ? "" : `title="Challenge Rating"`}>${this._style !== "classic" ? "CR" : "Challenge"}</strong>`;

		if (Parser.crToNumber(mon.cr) >= VeCt.CR_UNKNOWN && this._style === "classic") return `<td colspan="3">${ptLabel} <span>\u2014</span></td>`;

		return $$`<td colspan="${this._style !== "classic" ? "6" : "3"}">${ptLabel}
			<span>${Renderer.monster.getChallengeRatingPart(mon, {styleHint: this._style})}</span>
			${opts.$btnScaleCr || ""}
			${opts.$btnResetScaleCr || ""}
		</td>`;
	}
}

class _RenderBestiaryImplClassic extends _RenderBestiaryImplBase {
	_style = SITE_STYLE__CLASSIC;

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			mon,
			renderer,

			isInlinedToken,

			entsTrait,
		},
	) {
		return {
			htmlPtArmorClass: this._getHtmlParts_armorClass({mon, renderer, isInlinedToken}),

			htmlPtSavingThrows: this._getHtmlParts_savingThrows({mon}),
			htmlPtDamageImmunities: this._getHtmlParts_damageImmunities({mon}),
			htmlPtConditionImmunities: this._getHtmlParts_conditionImmunities({mon}),

			htmlPtPb: this._getHtmlParts_pb({mon}),

			htmlPtTraits: this._getHtmlParts_traits({mon, entsTrait}),
		};
	}

	/* ----- */

	_getHtmlParts_armorClass ({mon, renderer, isInlinedToken}) {
		return `<tr><td colspan="6"><div ${isInlinedToken ? `class="stats__wrp-avoid-token"` : ""}><strong>Armor Class</strong> ${mon.ac == null ? "\u2014" : Parser.acToFull(mon.ac, {renderer})}</div></td></tr>`;
	}

	/* ----- */

	_getHtmlParts_savingThrows ({mon}) {
		return mon.save ? `<tr><td colspan="6"><strong>Saving Throws</strong> ${Renderer.monster.getSavesPart(mon)}</td></tr>` : "";
	}

	_getHtmlParts_damageImmunities ({mon}) {
		return mon.immune ? `<tr><td colspan="6"><strong>Damage Immunities</strong> ${Parser.getFullImmRes(mon.immune)}</td></tr>` : "";
	}

	_getHtmlParts_conditionImmunities ({mon}) {
		return mon.conditionImmune ? `<tr><td colspan="6"><strong>Condition Immunities</strong> ${Parser.getFullCondImm(mon.conditionImmune)}</td></tr>` : "";
	}

	/* ----- */

	_getHtmlParts_pb ({mon}) {
		const ptPb = Renderer.monster.getPbPart(mon);
		if (!ptPb) return `<td colspan="3"></td>`;
		return `<td colspan="3" class="ve-text-right"><strong>Proficiency Bonus</strong> ${ptPb}</td>`;
	}

	/* ----- */

	_getHtmlParts_traits ({mon, entsTrait}) {
		return `${entsTrait?.length ? `<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider mb-0"></div></td></tr>` : ""}
		${entsTrait?.length ? this._getRenderedSection({prop: "trait", entries: entsTrait}) : ""}`;
	}

	/* -------------------------------------------- */

	_$getRenderedCreature ({mon, opts, renderer}) {
		const isInlinedToken = this._isInlinedToken({mon, opts});

		const {
			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			legGroup,
		} = Renderer.monster.getSubEntries(mon, {renderer});

		const {
			htmlPtIsExcluded,
			htmlPtName,
			htmlPtSizeTypeAlignment,

			htmlPtHitPoints,
			htmlPtsResources,
			htmlPtSpeed,

			htmlPtAbilityScores,

			htmlPtSkills,
			htmlPtVulnerabilities,
			htmlPtResistances,
			htmlPtSenses,
			htmlPtLanguages,

			htmlPtActions,
			htmlPtBonusActions,
			htmlPtReactions,
			htmlPtLegendaryActions,
			htmlPtMythicActions,

			htmlPtLairActions,
			htmlPtRegionalEffects,

			htmlPtFooterExtended,
		} = this._getCommonHtmlParts({
			mon,
			renderer,

			isSkipExcludesRender: opts.isSkipExcludesRender,

			isInlinedToken,

			entsAction,
			entsBonusAction,
			entsReaction,
			legGroup,
		});

		const {
			htmlPtArmorClass,

			htmlPtSavingThrows,
			htmlPtDamageImmunities,
			htmlPtConditionImmunities,

			htmlPtPb,

			htmlPtTraits,
		} = this._getHtmlParts({
			mon,
			renderer,

			isInlinedToken,

			entsTrait,
		});

		return $$`
		${Renderer.utils.getBorderTr()}

		${htmlPtIsExcluded}
		${htmlPtName}
		${htmlPtSizeTypeAlignment}

		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider ${isInlinedToken ? `stats__wrp-avoid-token` : ""}"></div></td></tr>

		${htmlPtArmorClass}
		${htmlPtHitPoints}
		${htmlPtsResources.join("")}
		${htmlPtSpeed}

		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>

		${htmlPtAbilityScores}

		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>

		${htmlPtSavingThrows}
		${htmlPtSkills}
		${htmlPtVulnerabilities}
		${htmlPtResistances}
		${htmlPtDamageImmunities}
		${htmlPtConditionImmunities}
		${htmlPtSenses}
		${htmlPtLanguages}

		<tr class="relative">
			${this._$getTdChallenge(mon, opts)}
			${htmlPtPb}
		</tr>

		<tr>${opts.selSummonSpellLevel ? $$`<td colspan="6"><strong class="mr-2">Spell Level</strong> ${opts.selSummonSpellLevel}</td>` : ""}</tr>
		<tr>${opts.selSummonClassLevel ? $$`<td colspan="6"><strong class="mr-2">Class Level</strong> ${opts.selSummonClassLevel}</td>` : ""}</tr>

		${htmlPtTraits}
		${htmlPtActions}
		${htmlPtBonusActions}
		${htmlPtReactions}
		${htmlPtLegendaryActions}
		${htmlPtMythicActions}

		${htmlPtLairActions}
		${htmlPtRegionalEffects}

		${htmlPtFooterExtended}

		${Renderer.utils.getBorderTr()}`;
	}
}

class _RenderBestiaryImplOne extends _RenderBestiaryImplBase {
	_style = SITE_STYLE__ONE;

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			mon,
			renderer,

			isInlinedToken,

			entsTrait,
		},
	) {
		return {
			htmlPtArmorClass: this._getHtmlParts_armorClass({mon, renderer, isInlinedToken}),

			htmlPtSavingThrows: this._getHtmlParts_savingThrows({mon, renderer}),

			htmlPtImmunities: this._getHtmlParts_immunities({mon}),
			htmlPtGear: this._getHtmlParts_gear({mon}),

			htmlPtTraits: this._getHtmlParts_traits({mon, entsTrait}),
		};
	}

	/* ----- */

	_getHtmlParts_armorClass ({mon, renderer, isInlinedToken}) {
		return `<tr><td colspan="6">
			<div class="split-v-center ${isInlinedToken ? `stats__wrp-avoid-token` : ""}">
				<div><strong title="Armor Class">AC</strong> ${mon.ac == null ? "\u2014" : Parser.acToFull(mon.ac, {renderer})}</div>
				<div><strong>Initiative</strong> ${Renderer.monster.getInitiativePart(mon)}</div>
			</div>
		</td></tr>`;
	}

	/* ----- */

	_getHtmlParts_savingThrows ({mon, renderer}) {
		if (!mon.save?.special) return "";
		return `<tr><td colspan="6"><strong>Saving Throws</strong> ${Renderer.monster.getSave(renderer, "special", mon.save.special)}</td></tr>`;
	}

	/* ----- */

	_getHtmlParts_immunities ({mon}) {
		const pt = Renderer.monster.getImmunitiesCombinedPart(mon);
		if (!pt) return "";
		return `<tr><td colspan="6"><strong>Immunities</strong> ${pt}</td></tr>`;
	}

	_getHtmlParts_gear ({mon}) {
		const pt = Renderer.monster.getGearPart(mon);
		if (!pt) return "";
		return `<tr><td colspan="6"><strong>Gear</strong> ${pt}</td></tr>`;
	}

	/* ----- */

	_getHtmlParts_traits ({mon, entsTrait}) {
		return `${entsTrait?.length ? `${this._getRenderedSectionHeader({mon, title: "Traits", prop: "trait"})}
		${this._getRenderedSection({prop: "trait", entries: entsTrait})}` : ""}`;
	}

	/* -------------------------------------------- */

	_$getRenderedCreature ({mon, opts, renderer}) {
		const isInlinedToken = this._isInlinedToken({mon, opts});

		const {
			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			legGroup,
		} = Renderer.monster.getSubEntries(mon, {renderer});

		const {
			htmlPtIsExcluded,
			htmlPtName,
			htmlPtSizeTypeAlignment,

			htmlPtHitPoints,
			htmlPtsResources,
			htmlPtSpeed,

			htmlPtAbilityScores,

			htmlPtSkills,
			htmlPtVulnerabilities,
			htmlPtResistances,
			htmlPtSenses,
			htmlPtLanguages,

			htmlPtActions,
			htmlPtBonusActions,
			htmlPtReactions,
			htmlPtLegendaryActions,
			htmlPtMythicActions,

			htmlPtLairActions,
			htmlPtRegionalEffects,

			htmlPtFooterExtended,
		} = this._getCommonHtmlParts({
			mon,
			renderer,

			isSkipExcludesRender: opts.isSkipExcludesRender,

			isInlinedToken,

			entsAction,
			entsBonusAction,
			entsReaction,
			legGroup,
		});

		const {
			htmlPtArmorClass,

			htmlPtSavingThrows,

			htmlPtImmunities,
			htmlPtGear,

			htmlPtTraits,
		} = this._getHtmlParts({
			mon,
			renderer,

			isInlinedToken,

			entsTrait,
		});

		return $$`
		${Renderer.utils.getBorderTr()}

		${htmlPtIsExcluded}
		${htmlPtName}

		<tr><td colspan="6" class="pt-0"><div class="ve-tbl-divider mt-0 ${isInlinedToken ? `stats__wrp-avoid-token` : ""}"></div></td></tr>

		${htmlPtSizeTypeAlignment}

		${htmlPtArmorClass}
		${htmlPtHitPoints}
		${htmlPtsResources.join("")}
		${htmlPtSpeed}

		${htmlPtAbilityScores}

		${htmlPtSavingThrows}
		${htmlPtSkills}
		${htmlPtVulnerabilities}
		${htmlPtResistances}
		${htmlPtImmunities}
		${htmlPtGear}
		${htmlPtSenses}
		${htmlPtLanguages}

		<tr class="relative">
			${this._$getTdChallenge(mon, opts)}
		</tr>

		<tr>${opts.selSummonSpellLevel ? $$`<td colspan="6"><strong class="mr-2">Spell Level</strong> ${opts.selSummonSpellLevel}</td>` : ""}</tr>
		<tr>${opts.selSummonClassLevel ? $$`<td colspan="6"><strong class="mr-2">Class Level</strong> ${opts.selSummonClassLevel}</td>` : ""}</tr>

		${htmlPtTraits}
		${htmlPtActions}
		${htmlPtBonusActions}
		${htmlPtReactions}
		${htmlPtLegendaryActions}
		${htmlPtMythicActions}

		${htmlPtLairActions}
		${htmlPtRegionalEffects}

		${htmlPtFooterExtended}

		${Renderer.utils.getBorderTr()}`;
	}
}

export class RenderBestiary {
	static _RENDER_CLASSIC = new _RenderBestiaryImplClassic();
	static _RENDER_ONE = new _RenderBestiaryImplOne();

	/**
	 * @param {object} mon Creature data.
	 * @param [opts]
	 * @param [opts.$btnScaleCr] CR scaler button.
	 * @param [opts.$btnResetScaleCr] CR scaler reset button.
	 * @param [opts.selSummonSpellLevel] Summon spell level selector.
	 * @param [opts.selSummonClassLevel] Summon spell level selector.
	 * @param [opts.isSkipExcludesRender] If the "this entity is blocklisted" display should be skipped.
	 * @param [opts.isSkipTokenRender]
	 */
	static $getRenderedCreature (mon, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.$getRenderedCreature(mon, opts);
			case SITE_STYLE__ONE: return this._RENDER_ONE.$getRenderedCreature(mon, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	static $getRenderedLegendaryGroup (legGroup) {
		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(legGroup)}
		<tr><td colspan="6">
			${legGroup.lairActions && legGroup.lairActions.length ? Renderer.get().render({type: "entries", entries: [{type: "entries", name: "Lair Actions", entries: legGroup.lairActions}]}) : ""}
			${legGroup.regionalEffects && legGroup.regionalEffects.length ? Renderer.get().render({type: "entries", entries: [{type: "entries", name: "Regional Effects", entries: legGroup.regionalEffects}]}) : ""}
			${legGroup.mythicEncounter && legGroup.mythicEncounter.length ? Renderer.get().render({type: "entries", entries: [{type: "entries", name: `<i title="This will display the creature's name when this legendary group is referenced from a creature statblock." class="help-subtle">&lt;Creature Name&gt;</i> as a Mythic Encounter`, entries: legGroup.mythicEncounter}]}) : ""}
		</td></tr>
		${Renderer.utils.getBorderTr()}`;
	}
}
