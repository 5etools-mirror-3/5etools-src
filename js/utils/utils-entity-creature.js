export class UtilsEntityCreature {
	static _RE_ITEM_TAG = /{@item ([^}]+)}/g;

	static getEquipmentUids (mon, {walker = null} = {}) {
		walker ||= MiscUtil.getWalker({isNoModification: true});

		if (mon.gear) {
			return mon.gear
				.map(ref => (ref.item || ref).toLowerCase());
		}

		const itemSet = new Set(mon.attachedItems || []);

		for (const acItem of (mon.ac || [])) {
			if (!acItem?.from?.length) continue;
			for (const from of acItem.from) this._getEquipmentUids_stringHandler(itemSet, from);
		}

		for (const trait of (mon.trait || [])) {
			if (!trait.name.toLowerCase().startsWith("special equipment")) continue;
			walker.walk(
				trait.entries,
				{
					string: this._getEquipmentUids_stringHandler.bind(this, itemSet),
				},
			);
			break;
		}

		return [...itemSet];
	}

	static _getEquipmentUids_stringHandler (itemSet, str) {
		str
			.replace(this._RE_ITEM_TAG, (...m) => {
				const unpacked = DataUtil.proxy.unpackUid("item", m[1], "item", {isLower: true});
				itemSet.add(DataUtil.proxy.getUid("item", unpacked));
				return "";
			});
	}
}
