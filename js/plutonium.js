class PlutoniumPage {
	static async _pOnLoad_pInitGeneric () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
		window.dispatchEvent(new Event("toolsLoaded"));
	}

	static _IMAGES = [
		{path: "plutonium/creatures.gif", id: "wrp-img-creatures"},
		{path: "plutonium/sheet-spells.gif", id: "wrp-img-sheet-spells"},
		{path: "plutonium/tables.gif", id: "wrp-img-tables"},
		{path: "plutonium/rivet.gif", id: "wrp-img-rivet"},
		{path: "plutonium/cleaner.gif", id: "wrp-img-cleaner"},
		{path: "plutonium/mover.gif", id: "wrp-img-mover"},
		{path: "plutonium/sheet-spell-toggler.gif", id: "wrp-img-sheet-spell-toggler"},
		{path: "plutonium/folder.gif", id: "wrp-img-folder"},
		{path: "plutonium/config.webp", id: "wrp-img-config"},
		{path: "plutonium/compact-directory.webp", id: "wrp-img-compact-directory"},
		{path: "plutonium/compact-chat.webp", id: "wrp-img-compact-chat"},
	];

	static _pOnLoad_initElements () {
		this._IMAGES
			.forEach(({path, id}) => {
				const url = Renderer.get().getMediaUrl("img", path);

				$(`#${id}`)
					.html(`<img class="big-help-gif" src="${url}" loading="lazy">`)
					.attr("href", url);
			});
	}

	static async pOnLoad () {
		await this._pOnLoad_pInitGeneric();
		this._pOnLoad_initElements();
	}
}

window.addEventListener("load", () => PlutoniumPage.pOnLoad());
