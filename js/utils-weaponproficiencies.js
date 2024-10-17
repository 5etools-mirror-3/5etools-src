export class UtilsWeaponProficiencies {
	static async _pGetMigratedBlock_pGetMigratedUid (uid) {
		const unpacked = DataUtil.proxy.unpackUid("item", uid, "item", {isLower: true});
		if (unpacked.source !== Parser.SRC_PHB.toLowerCase()) return uid;

		return DataUtil.proxy.getUid("item", {...unpacked, source: Parser.SRC_XPHB});
	}

	static async _pGetMigratedBlock (
		{
			weaponProficienciesBlock,
		},
	) {
		const cpy = MiscUtil.copyFast(weaponProficienciesBlock);

		await Object.entries(cpy)
			.pSerialAwaitMap(async ([key, value]) => {
				switch (key) {
					case "simple":
					case "martial":
					case "firearms":
					case "improvised":
					case "choose":
					case "all":
						return;
					default:
						delete cpy[key];
						cpy[await this._pGetMigratedBlock_pGetMigratedUid(key)] = value;
				}
			});

		return cpy;
	}

	/* ----- */

	static async pGetMigratedWeaponProficiencies (weaponProficiencies) {
		if (!weaponProficiencies) return weaponProficiencies;
		return weaponProficiencies.pSerialAwaitMap(weaponProficienciesBlock => this._pGetMigratedBlock({weaponProficienciesBlock}));
	}
}
