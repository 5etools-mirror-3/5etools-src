export class UtilsStartingEquipment {
	static async _pGetMigratedBlock_pGetMigratedUid (uid) {
		const unpacked = DataUtil.proxy.unpackUid("item", uid, "item", {isLower: true});

		if (unpacked.source !== Parser.SRC_PHB.toLowerCase()) {
			const redirected = await Renderer.redirect.pGetRedirectByUid("item", uid);
			if (!redirected) return null;

			return DataUtil.proxy.getUid("item", redirected);
		}

		const ent = await DataLoader.pCacheAndGet(UrlUtil.PG_ITEMS, unpacked.source, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](unpacked));
		if (!ent) return null;

		const reprintedAsUid = ent.reprintedAs?.find(it => typeof it === "string" && DataUtil.proxy.unpackUid("item", it, "item", {isLower: true}).source === Parser.SRC_XPHB.toLowerCase());
		if (!reprintedAsUid) return null;

		return reprintedAsUid;
	}

	static async _pGetMigratedBlock_pGetMigratedItem (itm) {
		if (typeof itm !== "string" && !itm.item) return itm;

		const uid = typeof itm === "string" ? itm : itm.item;
		const uidMigrated = await this._pGetMigratedBlock_pGetMigratedUid(uid);
		if (!uidMigrated) return itm;

		if (itm.item) {
			itm.item = uidMigrated;
			return itm;
		}

		return uidMigrated;
	}

	static async _pGetMigratedBlock (
		{
			block,
		},
	) {
		const cpy = MiscUtil.copyFast(block);

		await Object.entries(cpy)
			.pSerialAwaitMap(async ([group, arr]) => {
				cpy[group] = await arr.pSerialAwaitMap(itm => this._pGetMigratedBlock_pGetMigratedItem(itm));
			});

		return cpy;
	}

	/* ----- */

	static async pGetMigratedStartingEquipment (startingEquipment) {
		if (!startingEquipment) return startingEquipment;
		return startingEquipment.pSerialAwaitMap(block => this._pGetMigratedBlock({block}));
	}
}
