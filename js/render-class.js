import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "./consts.js";
import {VetoolsConfig} from "./utils-config/utils-config-config.js";

/** @abstract */
class _RenderClassesSidebarImplBase {
	_style;

	getRenderedClassSidebar (comp, cls) {
		const renderer = Renderer.get().setFirstSection(true);

		return this._getRenderedClassSidebar({comp, cls, renderer});
	}

	/**
	 * @abstract
	 *
	 * @return {HTMLElementExtended}
	 */
	_getRenderedClassSidebar ({comp, cls, renderer}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	_getCommonElements (
		{
			comp,
			cls,
			renderer,
		},
	) {
		return {
			eleName: this._getCommonElements_name({comp, cls}),
			eleAuthors: this._getCommonElements_authors({comp, cls}),

			eleGroup: this._getCommonElements_group({comp, cls}),

			eleRequirements: this._getCommonElements_requirements({comp, cls, renderer}),

			eleMulticlassing: this._getCommonElements_multiclassing({comp, cls, renderer}),

			elePage: this._getCommonElements_page({comp, cls, renderer}),
		};
	}

	/* ----- */

	_getCommonElements_name ({comp, cls}) {
		const dataPartSendToFoundry = `data-page="${UrlUtil.PG_CLASSES}" data-source="${cls.source.qq()}" data-hash="${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls).qq()}"`;

		const btnSendToFoundry = ExtensionUtil.ACTIVE ? Renderer.utils.getBtnSendToFoundryHtml({isMb: false}) : null;

		const btnToggleSidebar = e_({
			tag: "div",
			clazz: "cls-side__btn-toggle no-select",
			text: `[\u2212]`,
			click: () => comp._state.isHideSidebar = !comp._state.isHideSidebar,
		});
		comp._addHookBase("isHideSidebar", () => {
			btnToggleSidebar.txt(comp._state.isHideSidebar ? `[+]` : `[\u2212]`);
		})();

		return ee`<tr><th colspan="6" class="ve-text-left">
			<div class="split-v-center pr-1" ${dataPartSendToFoundry}>
				<div class="cls-side__name">${cls.name}</div>
				<div class="ve-flex-v-center">${btnSendToFoundry}${btnToggleSidebar}</div>
			</div>
		</th></tr>`;
	}

	_getCommonElements_authors ({comp, cls}) {
		return `${cls.authors ? `<tr><th class="ve-text-left" colspan="6">By ${cls.authors.join(", ")}</th></tr>` : ""}`;
	}

	/* ----- */

	_getCommonElements_group ({comp, cls}) {
		if (!cls.classGroup) return null;

		const ele = e_({
			tag: "tr",
			html: `<td colspan="6" class="cls-side__section">
				<h5 class="cls-side__section-head">Groups</h5>
				<div>${cls.classGroup.map(it => it.toTitleCase()).join(", ")}</div>
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* ----- */

	_getPtRequirements ({renderer, requirements, intro = null}) {
		if (!requirements) return "";

		const renderPart = (obj, joiner = ", ") => Object.keys(obj).filter(k => Parser.ABIL_ABVS.includes(k)).sort(SortUtil.ascSortAtts).map(k => `${Parser.attAbvToFull(k)} ${obj[k]}`).join(joiner);
		const orPart = requirements.or ? requirements.or.map(obj => renderPart(obj, " or ")).join("; ") : "";
		const basePart = renderPart(requirements);
		const abilityPart = [orPart, basePart].filter(Boolean).join("; ");

		const allEntries = [
			abilityPart ? `{@b Ability Score Minimum:} ${abilityPart}` : null,
			...requirements.entries || [],
		]
			.filter(Boolean);

		return `<div>
			${intro || ""}
			${renderer.setFirstSection(true).render({type: "section", entries: allEntries})}
		</div>`;
	}

	_getCommonElements_requirements ({comp, cls, renderer}) {
		if (!cls.requirements) return null;

		const ele = e_({
			tag: "tr",
			html: `<td colspan="6" class="cls-side__section">
				<h5 class="cls-side__section-head">Prerequisites</h5>
				${this._getPtRequirements({renderer, requirements: cls.requirements})}
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* ----- */

	_getCommonElements_multiclassing ({comp, cls, renderer}) {
		if (!cls.multiclassing) return null;

		const {multiclassing: mc} = cls;

		const htmlMCcPrereqPreText = mc.requirements || mc.requirementsSpecial
			? `<div>To qualify for a new class, you must meet the ${mc.requirementsSpecial ? "" : "ability score "}prerequisites for both your current class and your new one.</div>`
			: "";

		const ptMcPrereq = cls.primaryAbility
			? `To qualify for a new class, you must have a score of at least 13 in the primary ability of the new class and your current classes.`
			: this._getPtRequirements({renderer, requirements: mc.requirements});

		const ptMcPrereqSpecial = mc.requirementsSpecial
			? `<div>
				${htmlMCcPrereqPreText}
				<b>${htmlMCcPrereqPreText ? "Other " : ""}Prerequisites:</b> ${renderer.render(mc.requirementsSpecial || "")}
			</div>`
			: "";

		const ptMcProfsIntro = mc.requirements && mc.proficienciesGained
			? `<div>When you gain a level in a class other than your first, you gain only some of that class's starting proficiencies.</div>`
			: "";

		const ptMcProfsArmor = mc.proficienciesGained?.armor
			? `<div><b>${this._style === SITE_STYLE__CLASSIC ? "Armor" : "Armor Training"}:</b> ${Renderer.class.getRenderedArmorProfs(mc.proficienciesGained.armor, {styleHint: this._style})}</div>`
			: "";

		const ptMcProfsWeapons = mc.proficienciesGained?.weapons
			? `<div><b>${this._style === SITE_STYLE__CLASSIC ? "Weapons" : "Weapon Proficiencies"}:</b> ${Renderer.class.getRenderedWeaponProfs(mc.proficienciesGained.weapons, {styleHint: this._style})}</div>`
			: "";

		const ptMcProfsTools = mc.proficienciesGained?.tools
			? `<div><b>${this._style === SITE_STYLE__CLASSIC ? "Tools" : "Tool Proficiencies"}:</b> ${Renderer.class.getRenderedToolProfs(mc.proficienciesGained.tools, {styleHint: this._style})}</div>`
			: "";

		const ptMcProfsSkills = mc.proficienciesGained?.skills
			? `<div><b>${this._style === SITE_STYLE__CLASSIC ? "Skills" : "Skill Proficiencies"}:</b> ${Renderer.class.getRenderedSkillProfs(mc.proficienciesGained.skills, {styleHint: this._style})}</div>`
			: "";

		const ptsProfs = this._style === SITE_STYLE__CLASSIC
			? [
				ptMcProfsArmor,
				ptMcProfsWeapons,
				ptMcProfsTools,
				ptMcProfsSkills,
			]
			: [
				ptMcProfsSkills,
				ptMcProfsWeapons,
				ptMcProfsTools,
				ptMcProfsArmor,
			];

		const ptMcEntries = mc.entries
			? renderer.setFirstSection(true).render({type: "section", entries: mc.entries})
			: "";

		const ele = e_({
			tag: "tr",
			html: `<td class="cls-side__section" colspan="6">
				<h5 class="cls-side__section-head">Multiclassing</h5>
				${ptMcPrereq}
				${ptMcPrereqSpecial}
				${ptMcEntries}
				${ptMcProfsIntro}
				${ptsProfs.join("")}
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* ----- */

	_getCommonElements_page ({comp, cls, renderer}) {
		const ele = e_({
			tag: "tr",
			html: `<td class="cls-side__section pt-3" colspan="6">
				${Renderer.utils.getSourceAndPageTrHtml(cls)}
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}
}

class _RenderClassesSidebarImplClassic extends _RenderClassesSidebarImplBase {
	_style = SITE_STYLE__CLASSIC;

	/* -------------------------------------------- */

	_getElements (
		{
			comp,
			cls,
			renderer,
		},
	) {
		return {
			eleHp: this._getElements_hp({comp, cls, renderer}),

			eleStartingEquipment: this._getElements_startingEquipment({comp, cls, renderer}),

			eleProficiencies: this._getElements_proficiencies({comp, cls}),
		};
	}

	/* ----- */

	_getElements_hp ({comp, cls, renderer}) {
		if (!cls.hd) return null;

		const ele = e_({
			tag: "tr",
			html: `<td colspan="6" class="cls-side__section">
				<h5 class="cls-side__section-head">Hit Points</h5>
				<div><strong>Hit Dice:</strong> ${renderer.render(Renderer.class.getHitDiceEntry(cls.hd, {styleHint: this._style}))}</div>
				<div><strong>Hit Points at 1st Level:</strong> ${Renderer.class.getHitPointsAtFirstLevel(cls.hd, {styleHint: this._style})}</div>
				<div><strong>Hit Points at Higher Levels:</strong> ${Renderer.class.getHitPointsAtHigherLevels(cls.name, cls.hd, {styleHint: this._style})}</div>
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* ----- */

	_getElements_startingEquipment ({comp, cls, renderer}) {
		const renderedStartingEquipment = Renderer.class.getHtmlPtStartingEquipment(cls, {renderer, styleHint: this._style});
		if (!renderedStartingEquipment) return null;

		const eleDisp = e_({
			tag: "div",
			html: renderedStartingEquipment,
		});

		const ele = ee`<tr>
			<td class="cls-side__section" colspan="6">
				<h5 class="cls-side__section-head">Starting Equipment</h5>
				<div>${eleDisp}</div>
			</td>
		</tr>`;

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* ----- */

	_getElements_proficiencies ({comp, cls}) {
		const {startingProficiencies: profs = {}} = cls;

		const ele = e_({
			tag: "tr",
			html: `<td colspan="6" class="cls-side__section">
				<h5 class="cls-side__section-head">Proficiencies</h5>
				<div><b>Armor:</b> <span>${profs.armor ? Renderer.class.getRenderedArmorProfs(profs.armor, {styleHint: this._style}) : "none"}</span></div>
				<div><b>Weapons:</b> <span>${profs.weapons ? Renderer.class.getRenderedWeaponProfs(profs.weapons, {styleHint: this._style}) : "none"}</span></div>
				<div><b>Tools:</b> <span>${profs.tools ? Renderer.class.getRenderedToolProfs(profs.tools, {styleHint: this._style}) : "none"}</span></div>
				<div><b>Saving Throws:</b> <span>${cls.proficiency ? cls.proficiency.map(p => Parser.attAbvToFull(p)).join(", ") : "none"}</span></div>
				<div><b>Skills:</b> <span>${profs.skills ? Renderer.class.getRenderedSkillProfs(profs.skills, {styleHint: this._style}) : "none"}</span></div>
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* -------------------------------------------- */

	_getRenderedClassSidebar ({comp, cls, renderer}) {
		const {
			eleName,
			eleAuthors,
			eleGroup,
			eleRequirements,
			eleMulticlassing,
			elePage,
		} = this._getCommonElements({
			comp,
			cls,
			renderer,
		});
		const {
			eleHp,
			eleProficiencies,
			eleStartingEquipment,
		} = this._getElements({
			comp,
			cls,
			renderer,
		});

		return ee`<table class="w-100 stats shadow-big cls__stats">
			<tr><th class="ve-tbl-border" colspan="6"></th></tr>

			${eleName}
			${eleAuthors}

			${eleGroup}
			${eleRequirements}
			${eleHp}
			${eleProficiencies}
			${eleStartingEquipment}
			${eleMulticlassing}
			${elePage}

			<tr><th class="ve-tbl-border" colspan="6"></th></tr>
		</table>`;
	}
}

class _RenderClassesSidebarImplOne extends _RenderClassesSidebarImplBase {
	_style = SITE_STYLE__ONE;

	/* -------------------------------------------- */

	_getElements (
		{
			comp,
			cls,
			renderer,
		},
	) {
		return {
			eleCoreTraits: this._getElements_coreTraits({comp, cls, renderer}),
		};
	}

	/* ----- */

	_getElements_coreTraits ({comp, cls, renderer}) {
		const pts = [
			Renderer.class.getHtmlPtPrimaryAbility(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtHitPoints(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtSavingThrows(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtSkills(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtWeaponProficiencies(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtToolProficiencies(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtArmorProficiencies(cls, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtStartingEquipment(cls, {renderer, styleHint: this._style}),
		]
			.filter(Boolean)
			.join(`<div class="py-2 w-100"></div>`);

		const ele = e_({
			tag: "tr",
			html: `<td colspan="6" class="cls-side__section">
				<h5 class="cls-side__section-head">Core Traits</h5>
				${pts}
			</td>`,
		});

		comp._addHookBase("isHideSidebar", () => {
			ele.toggleVe(!comp._state.isHideSidebar);
		})();

		return ele;
	}

	/* -------------------------------------------- */

	_getRenderedClassSidebar ({comp, cls, renderer}) {
		const {
			eleName,
			eleAuthors,
			eleGroup,
			eleRequirements,
			eleMulticlassing,
			elePage,
		} = this._getCommonElements({
			comp,
			cls,
			renderer,
		});
		const {
			eleCoreTraits,
		} = this._getElements({
			comp,
			cls,
			renderer,
		});

		return ee`<table class="w-100 stats shadow-big cls__stats">
			<tr><th class="ve-tbl-border" colspan="6"></th></tr>

			${eleName}
			${eleAuthors}

			${eleGroup}
			${eleRequirements}
			${eleCoreTraits}
			${eleMulticlassing}
			${elePage}

			<tr><th class="ve-tbl-border" colspan="6"></th></tr>
		</table>`;
	}
}

export class RenderClassesSidebar {
	static _RENDER_CLASSIC = new _RenderClassesSidebarImplClassic();
	static _RENDER_ONE = new _RenderClassesSidebarImplOne();

	static getRenderedClassSidebar (comp, cls) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case SITE_STYLE__CLASSIC: return this._RENDER_CLASSIC.getRenderedClassSidebar(comp, cls);
			case SITE_STYLE__ONE: return this._RENDER_ONE.getRenderedClassSidebar(comp, cls);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}
}
