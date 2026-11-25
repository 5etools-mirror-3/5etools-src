export class FontManager {
	static _FONTS = {};

	static _addFontMeta ({fontId, fontUrl}) {
		return (this._FONTS[fontId] ||= {fontId, fontUrl, pLoading: null});
	}

	static async _pLoadFont ({fontMeta}) {
		fontMeta.pLoading ||= (async () => {
			const fontFace = new FontFace(fontMeta.fontId, `url("${fontMeta.fontUrl}")`);
			await fontFace.load();
			await document.fonts.add(fontFace);
			await document.fonts.ready;
		})();
		return fontMeta.pLoading;
	}

	/* -------------------------------------------- */

	static async pAddFont ({fontId, fontUrl}) {
		if (typeof window === "undefined") return;

		if (this._FONTS[fontId]?.pLoading) return this._FONTS[fontId].pLoading;

		const fontMeta = this._addFontMeta({fontId, fontUrl});
		await this._pLoadFont({fontMeta});
	}

	/* -------------------------------------------- */

	static addFontLazy ({fontId, fontUrl}) {
		if (this._FONTS[fontId]) return;
		this._addFontMeta({fontId, fontUrl});
	}

	static async pFinalizeLazy () {
		if (typeof window === "undefined") return {errors: []};

		const fontMetas = Object.values(this._FONTS);
		const results = await Promise.allSettled(
			fontMetas
				.map(fontMeta => this._pLoadFont({fontMeta})),
		);

		await document.fonts.ready;

		return {
			errors: results
				.map(({status, reason}, i) => status === "rejected"
					? {message: `Font "${fontMetas[i].fontId}" failed to load!`, reason}
					: null)
				.filter(Boolean),
		};
	}
}
globalThis.FontManager = FontManager;
