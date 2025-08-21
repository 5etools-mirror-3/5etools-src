export class FontManager {
	static _FONTS = {};

	static addFontLazy ({fontId, fontUrl}) {
		if (this._FONTS[fontId]) return;
		this._addFontMeta({fontId, fontUrl});
	}

	static async pAddFont ({fontId, fontUrl}) {
		if (this._FONTS[fontId]?.pLoading) return this._FONTS[fontId].pLoading;

		const fontMeta = this._addFontMeta({fontId, fontUrl});
		await this._pLoadFont({fontMeta});
	}

	static async pFinalizeLazy () {
		const results = await Promise.allSettled(
			Object.values(this._FONTS)
				.map(fontMeta => this._pLoadFont({fontMeta})),
		);

		await document.fonts.ready;

		return {
			errors: results
				.filter(({status}) => status === "rejected")
				.map(({reason}, i) => ({message: `Font "${fontFaces[i].family}" failed to load!`, reason})),
		};
	}

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
}
globalThis.FontManager = FontManager;
