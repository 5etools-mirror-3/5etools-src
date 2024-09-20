export class UtilsFoundryItem {
	static _TYPE_WEAPON = "weapon";
	static _TYPE_TOOL = "tool";
	static _TYPE_CONSUMABLE = "consumable";
	static _TYPE_EQUIPMENT = "equipment";
	static _TYPE_CONTAINER = "container";
	static _TYPE_LOOT = "loot";

	static _ITEM_EQUIPMENT_NAME_RES = [
		"amulet of",
		"badge of",
		"band of",
		"belt of",
		"boots of",
		"bracelet of",
		"bracer of",
		"bracers of",
		"brooch of",
		"cape of",
		"circlet of",
		"clothes of",
		"crown of",
		"eyes of",
		"gauntlets of",
		"gloves of",
		"goggles of",
		"hat of",
		"headband of",
		"helm of",
		"mantle of",
		"mask of",
		"necklace of",
		"periapt of",
		"ring of",
		"rings of",
		"robe of",
		"slippers of",
		"signet",
	].map(it => new RegExp(`\\b${it}\\b`, "i"));

	static getFoundryItemType (item) {
		const itemTypeAbv = item.type ? DataUtil.itemType.unpackUid(item.type).abbreviation : null;

		if (
			itemTypeAbv === Parser.ITM_TYP_ABV__MELEE_WEAPON
			|| itemTypeAbv === Parser.ITM_TYP_ABV__RANGED_WEAPON
			// Anything with damage, treat as a weapon
			|| item.dmg1
		) return this._TYPE_WEAPON;

		if (
			itemTypeAbv === Parser.ITM_TYP_ABV__ARTISAN_TOOL
			|| itemTypeAbv === Parser.ITM_TYP_ABV__TOOL
			|| itemTypeAbv === Parser.ITM_TYP_ABV__INSTRUMENT
			|| itemTypeAbv === Parser.ITM_TYP_ABV__GAMING_SET
		) return this._TYPE_TOOL;

		if (
			itemTypeAbv === Parser.ITM_TYP_ABV__POTION
			|| itemTypeAbv === Parser.ITM_TYP_ABV__SCROLL
			|| (itemTypeAbv === Parser.ITM_TYP_ABV__WAND && item.charges)
			|| (itemTypeAbv === Parser.ITM_TYP_ABV__ROD && item.charges)
			|| (itemTypeAbv === Parser.ITM_TYP_ABV__ADVENTURING_GEAR && item.charges)
			|| item.poison
			|| itemTypeAbv === Parser.ITM_TYP_ABV__AMMUNITION
			|| itemTypeAbv === Parser.ITM_TYP_ABV__AMMUNITION_FUTURISTIC
			|| itemTypeAbv === Parser.ITM_TYP_ABV__EXPLOSIVE
			|| itemTypeAbv === Parser.ITM_TYP_ABV__ILLEGAL_DRUG
		) return this._TYPE_CONSUMABLE;

		if (
			itemTypeAbv === Parser.ITM_TYP_ABV__HEAVY_ARMOR
			|| itemTypeAbv === Parser.ITM_TYP_ABV__MEDIUM_ARMOR
			|| itemTypeAbv === Parser.ITM_TYP_ABV__LIGHT_ARMOR
			|| itemTypeAbv === Parser.ITM_TYP_ABV__SHIELD
			|| item.bardingType // Barding
			|| itemTypeAbv === Parser.ITM_TYP_ABV__SPELLCASTING_FOCUS
		) return this._TYPE_EQUIPMENT;

		if (
			itemTypeAbv === Parser.ITM_TYP_ABV__WAND
			|| itemTypeAbv === Parser.ITM_TYP_ABV__ROD
			|| itemTypeAbv === Parser.ITM_TYP_ABV__RING
		) return this._TYPE_EQUIPMENT;

		if (item.containerCapacity) return this._TYPE_CONTAINER;

		// Classify some "other" items as "trinket"-type equipment
		//  - Items with +AC/+Saving Throw/etc. bonuses (e.g. cloak of protection)
		//  - Ability score modifying items (e.g. belt of giant strength)
		//  - All other wondrous items, as there are few examples that couldn't in some way be seen as "equipment"
		if (
			item.bonusAc
			|| item.bonusSavingThrow
			|| item.bonusAbilityCheck
			|| item.bonusSpellAttack
			|| item.bonusSpellAttack
			|| item.bonusSpellSaveDc
			|| item.bonusProficiencyBonus
			|| item.bonusSavingThrowConcentration
			|| item.ability
			|| item.wondrous
		) return this._TYPE_EQUIPMENT;

		// Try to process various equipment-sounding item names as equipment (e.g. gloves, bracers)
		if (this._ITEM_EQUIPMENT_NAME_RES.some(it => it.test(item.name))) return this._TYPE_EQUIPMENT;

		// Treat everything else as loot
		return this._TYPE_LOOT;
	}
}
