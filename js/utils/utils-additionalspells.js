export class UtilsAdditionalSpells {
	static async _pGetMigratedBlock_pGetMigratedUid (uid) {
		const [uidClean, ...rest] = uid.split("#");

		const redirected = await Renderer.redirect.pGetRedirectByUid("spell", uidClean);
		if (!redirected) return uid;

		const uidRedirected = DataUtil.proxy.getUid("spell", redirected);
		return [uidRedirected, ...rest].join("#");
	}

	static async _pGetMigratedBlock (
		{
			additionalSpellBlock,
		},
	) {
		const cpy = MiscUtil.copyFast(additionalSpellBlock);

		await Object.entries(cpy)
			.pSerialAwaitMap(async ([additionType, additionMeta]) => {
				switch (additionType) {
					case "innate":
					case "known":
					case "prepared":
					case "expanded": {
						cpy[additionType] = await this._pGetMigratedBlock_pGetMigratedAdditionMeta({additionMeta});
						break;
					}

					// No migration required
					case "name":
					case "ability":
					case "resourceName": break;

					default: throw new Error(`Unhandled spell addition type "${additionType}"`);
				}
			});

		return cpy;
	}

	static async _pGetMigratedBlock_pGetMigratedAdditionMeta ({additionMeta}) {
		await Object.entries(additionMeta)
			.pSerialAwaitMap(async ([levelKey, levelMeta]) => {
				if (levelMeta instanceof Array) {
					additionMeta[levelKey] = await levelMeta.pSerialAwaitMap(spellItem => this._pGetMigratedBlock_pGetMigratedSpellItem({spellItem}));
					return;
				}

				await Object.entries(levelMeta)
					.pSerialAwaitMap(async ([rechargeType, levelMetaInner]) => {
						levelMeta[rechargeType] = await this._pGetMigratedBlock_pGetMigratedRechargeBlock({rechargeType, levelMetaInner});
					});
			});
		return additionMeta;
	}

	static async _pGetMigratedBlock_pGetMigratedSpellItem ({spellItem}) {
		if (typeof spellItem === "string") {
			return this._pGetMigratedBlock_pGetMigratedUid(spellItem);
		}

		// A filter expression
		if (spellItem.all != null) return spellItem;

		if (spellItem.choose != null) {
			// A filter expression
			if (typeof spellItem.choose === "string") return spellItem;

			if (spellItem.choose.from) { // An array of choices
				spellItem.choose.from = await spellItem.choose.from
					.pSerialAwaitMap(uid => this._pGetMigratedBlock_pGetMigratedUid(uid));
				return spellItem;
			}

			throw new Error(`Unhandled additional spell format: "${JSON.stringify(spellItem)}"`);
		}

		throw new Error(`Unhandled additional spell format: "${JSON.stringify(spellItem)}"`);
	}

	static async _pGetMigratedBlock_pGetMigratedRechargeBlock (opts) {
		const {rechargeType, levelMetaInner} = opts;

		switch (rechargeType) {
			case "rest":
			case "daily":
			case "resource":
			case "limited": {
				Object.entries(levelMetaInner)
					.pSerialAwaitMap(async ([rechargeKey, spellList]) => {
						levelMetaInner[rechargeKey] = await spellList.pSerialAwaitMap(spellItem => this._pGetMigratedBlock_pGetMigratedSpellItem({spellItem}));
					});
				return levelMetaInner;
			}

			case "will":
			case "ritual":
			case "_": {
				return levelMetaInner.pSerialAwaitMap(spellItem => this._pGetMigratedBlock_pGetMigratedSpellItem({spellItem}));
			}

			default: throw new Error(`Unhandled spell recharge type "${rechargeType}"`);
		}
	}

	/* ----- */

	static async pGetMigratedAdditionalSpells (additionalSpells) {
		if (!additionalSpells) return additionalSpells;
		return additionalSpells.pSerialAwaitMap(additionalSpellBlock => this._pGetMigratedBlock({additionalSpellBlock}));
	}
}
