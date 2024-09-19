export class RenderRaces {
	static $getRenderedRace (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const renderer = Renderer.get().setFirstSection(true);

		const entriesMeta = Renderer.race.getRaceRenderableEntriesMeta(ent, {styleHint});
		const ptHeightWeight = RenderRaces._getHeightAndWeightPart(ent);

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: "race"})}
		${Renderer.utils.getNameTr(ent, {controlRhs: ent.soundClip ? RenderRaces._getPronunciationButton(ent) : "", page: UrlUtil.PG_RACES})}

		<tr><td colspan="6" class="pt-0">
			${entriesMeta.entryAttributes ? renderer.render(entriesMeta.entryAttributes) : ""}
			${entriesMeta.entryAttributes ? `<div class="w-100 py-1"></div>` : ""}
			${renderer.render(entriesMeta.entryMain, 1)}
			${ent.traitTags && ent.traitTags.includes("NPC Race") ? `<section class="ve-muted">
				${renderer.render(`{@note Note: This race is listed in the {@i Dungeon Master's Guide} as an option for creating NPCs. It is not designed for use as a playable race.}`, 2)}
			 </section>` : ""}
		</td></tr>

		${ptHeightWeight ? $$`<tr><td colspan="6"><hr class="rd__hr">${ptHeightWeight}</td></tr>` : ""}

		${Renderer.utils.getPageTr(ent)}
		${Renderer.utils.getBorderTr()}`;
	}

	static _getPronunciationButton (race) {
		return `<button class="ve-btn ve-btn-xs ve-btn-default stats__btn-name-pronounce lst-is-exporting-image__hidden no-print ml-2 mb-2 ve-self-flex-end">
			<span class="glyphicon glyphicon-volume-up stats__icn-pronounce-name"></span>
			<audio class="ve-hidden" preload="none" data-name="aud-pronounce">
			   <source src="${Renderer.utils.getEntryMediaUrl(race, "soundClip", "audio")}" type="audio/mpeg">
			</audio>
		</button>`;
	}

	static _getHeightAndWeightPart (race) {
		const outer = Renderer.race.getHeightAndWeightPart(race);
		if (!outer) return null;
		const ele = e_({outer});
		Renderer.race.bindListenersHeightAndWeight(race, ele);
		return ele;
	}
}
