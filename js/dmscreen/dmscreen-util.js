export class DmScreenUtil {
	static getPanelApps ({board, type}) {
		return board.getPanelsByType(type)
			.flatMap(it => it.tabDatas.filter(td => td.type === type).map(td => td.panelApp));
	}

	/* -------------------------------------------- */

	static async pGetScaledCreature ({name, source, scaledCr, scaledSummonSpellLevel, scaledSummonClassLevel}) {
		const mon = await DataLoader.pCacheAndGet(
			UrlUtil.PG_BESTIARY,
			source,
			UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY]({name: name, source: source}),
		);

		if (scaledCr == null && scaledSummonSpellLevel == null && scaledSummonClassLevel == null) return mon;

		if (scaledCr != null) return ScaleCreature.scale(mon, scaledCr);
		if (scaledSummonSpellLevel != null) return ScaleSpellSummonedCreature.scale(mon, scaledCr);
		if (scaledSummonClassLevel != null) return ScaleClassSummonedCreature.scale(mon, scaledCr);

		throw new Error(`Should never occur!`);
	}
}
