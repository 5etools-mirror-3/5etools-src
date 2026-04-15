import {SITE_STYLE__CLASSIC} from "./consts.js";
import {RenderPageImplBase} from "./render-page-base.js";

/** @abstract */
class _RenderCrochetPatternsImplBase extends RenderPageImplBase {
	_style;
	_page = UrlUtil.PG_HOMECRAFTS;
	_dataProp = "crochetPattern";

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
			entriesMeta,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtSkillLevelDesignedBy: this._getCommonHtmlParts_skillLevelDesignedBy({ent, renderer, entriesMeta}),

			htmlPtFluff: this._getCommonHtmlParts_fluff({ent, renderer}),

			htmlPtMeasurements: this._getCommonHtmlParts_measurements({ent, renderer, entriesMeta}),
			htmlPtYarn: this._getCommonHtmlParts_yarn({ent, renderer}),
			htmlPtHook: this._getCommonHtmlParts_hook({ent, renderer, entriesMeta}),
			htmlPtNotions: this._getCommonHtmlParts_notions({ent, renderer}),
			htmlPtGauge: this._getCommonHtmlParts_gauge({ent, renderer}),
			htmlPtStitches: this._getCommonHtmlParts_stitches({ent, renderer}),
			htmlPtAbbreviations: this._getCommonHtmlParts_abbreviations({ent, renderer}),
			htmlPtNotes: this._getCommonHtmlParts_notes({ent, renderer}),
			htmlPtFinishing: this._getCommonHtmlParts_finishing({ent, renderer}),

			htmlPtInstructions: this._getCommonHtmlParts_instructions({ent, renderer}),

			htmlPtSeeAlso: this._getCommonHtmlParts_seeAlso({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_skillLevelDesignedBy ({ent, renderer, entriesMeta}) {
		const {entrySkillLevel, entryDesignedBy} = entriesMeta;
		return `<tr><td colspan="6" class="ve-pb-3 ve-pt-0">
			<i>Skill Level: ${renderer.render(entrySkillLevel)}.${entryDesignedBy ? ` Designed by ${renderer.render(entryDesignedBy)}.` : ""}</i>
		</td></tr>`;
	}

	/* ----- */

	_getFluffHtml ({ent, renderer}) {
		if (!ent.fluff?.images?.length) return null;

		const fluffReduced = {
			...ent.fluff,
			images: [ent.fluff.images[0]],
		};

		return Renderer.get().withMinimizeLayoutShift(() => Renderer.utils.getFluffTabContent({entity: ent, isImageTab: true, fluff: fluffReduced}));
	}

	_getCommonHtmlParts_fluff ({ent, renderer}) {
		const ptFluff = this._getFluffHtml({ent});
		if (!ptFluff) return "";

		return `<tr class="ve-mobile-sm__hidden homecrafts__wrp-fluff"><td colspan="6">${ptFluff}</td></tr>
		<tr class="ve-mobile-sm__hidden"><td colspan="6" class="ve-py-0"><div class="ve-tbl-divider"></div></td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_measurements ({ent, renderer, entriesMeta}) {
		const {entriesMeasurements} = entriesMeta;
		if (!entriesMeasurements?.length) return "";

		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Finished Measurements</h5>
			${entriesMeasurements.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_yarn ({ent, renderer}) {
		if (!ent.yarn?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Yarn</h5>
			${ent.yarn.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_hook ({ent, renderer, entriesMeta}) {
		const {entriesHooks} = entriesMeta;

		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Hooks</h5>
			${entriesHooks.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_notions ({ent, renderer}) {
		if (!ent.notions?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Notions</h5>
			${ent.notions.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_gauge ({ent, renderer}) {
		if (!ent.gauge?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Gauge</h5>
			${ent.gauge.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_stitches ({ent, renderer}) {
		if (!ent.stitches?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Special Stitches</h5>
			${ent.stitches.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_abbreviations ({ent, renderer}) {
		if (!ent.abbreviations?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Special Abbreviations</h5>
			${ent.abbreviations.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_notes ({ent, renderer}) {
		if (!ent.notes?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Notes</h5>
			${ent.notes.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_finishing ({ent, renderer}) {
		if (!ent.finishing?.length) return "";
		return `<div class="ve-pb-4 ve-pt-0">
			<h5 class="ve-bold ve-small-caps ve-my-0">Finishing</h5>
			${ent.finishing.map(ent => `<div class="ve-mt-1">${renderer.render(ent)}</div>`).join("")}
		</div>`;
	}

	/* ----- */

	_getCommonHtmlParts_instructions ({ent, renderer}) {
		return renderer.setFirstSection(true).render({entries: ent.instructions});
	}

	/* ----- */

	_getCommonHtmlParts_seeAlso ({ent, renderer}) {
		const ptSeeAlso = [
			this._getRenderedSeeAlso({renderer, ent, prop: "seeAlsoCreature", tag: "creature"}),
			this._getRenderedSeeAlso({renderer, ent, prop: "seeAlsoItem", tag: "item"}),
		]
			.filter(Boolean)
			.join("");
		if (!ptSeeAlso) return "";

		return `<tr><td colspan="6">${ptSeeAlso}</td></tr>`;
	}
}

class _RenderCrochetPatternsImplClassic extends _RenderCrochetPatternsImplBase {
	_style = SITE_STYLE__CLASSIC;

	/* -------------------------------------------- */

	_getRendered ({ent, opts, renderer}) {
		const entriesMeta = Renderer.crochetPattern.getCrochetPatternRenderableEntriesMeta(ent);

		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtSkillLevelDesignedBy,

			htmlPtFluff,

			htmlPtMeasurements,
			htmlPtYarn,
			htmlPtHook,
			htmlPtNotions,
			htmlPtGauge,
			htmlPtStitches,
			htmlPtAbbreviations,
			htmlPtNotes,
			htmlPtFinishing,

			htmlPtInstructions,

			htmlPtSeeAlso,

			htmlPtPage,
		} = this._getCommonHtmlParts({
			ent,
			opts,
			renderer,
			entriesMeta,
		});

		return `
			${Renderer.utils.getBorderTr()}

			${htmlPtIsExcluded}
			${htmlPtName}

			${htmlPtSkillLevelDesignedBy}

			${htmlPtFluff}
			
			<tr><td colspan="6">
			<div class="ve-flex ve-w-100 ve-rd-plaintext__wrp-root">
				<div class="ve-w-33 ve-pl-3 ve-pr-2 ve-flex-col">
					${htmlPtMeasurements}
					${htmlPtYarn}
					${htmlPtHook}
					${htmlPtNotions}
					${htmlPtGauge}
					${htmlPtStitches}
					${htmlPtAbbreviations}
					${htmlPtNotes}
					${htmlPtFinishing}
				</div>
			
				<div class="ve-w-66 ve-pr-3 ve-pl-5 ve-rd-plaintext__wrp-primary">
					${htmlPtInstructions}
				</div>
			</div>
			</td></tr>

			${htmlPtSeeAlso}

			${htmlPtPage}
			${Renderer.utils.getBorderTr()}
		`;
	}
}

export class RenderCrochetPatterns {
	static _RENDER_CLASSIC__PATTERNS = new _RenderCrochetPatternsImplClassic();

	static getRenderedCrochetPattern (ent) {
		return this._RENDER_CLASSIC__PATTERNS.getRendered(ent);
	}
}
