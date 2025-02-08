import {AlignmentUtil} from "./converterutils-utils-alignment.js";
import {ConverterConst} from "./converterutils-const.js";

class ConverterUtilsItem {}
ConverterUtilsItem.BASIC_WEAPONS = [
	"club",
	"dagger",
	"greatclub",
	"handaxe",
	"javelin",
	"light hammer",
	"mace",
	"quarterstaff",
	"sickle",
	"spear",
	"light crossbow",
	"dart",
	"shortbow",
	"sling",
	"battleaxe",
	"flail",
	"glaive",
	"greataxe",
	"greatsword",
	"halberd",
	"lance",
	"longsword",
	"maul",
	"morningstar",
	"pike",
	"rapier",
	"scimitar",
	"shortsword",
	"trident",
	"war pick",
	"warhammer",
	"whip",
	"blowgun",
	"hand crossbow",
	"heavy crossbow",
	"longbow",
	"net",
];
ConverterUtilsItem.BASIC_ARMORS = [
	"padded armor",
	"leather armor",
	"studded leather armor",
	"hide armor",
	"chain shirt",
	"scale mail",
	"breastplate",
	"half plate armor",
	"ring mail",
	"chain mail",
	"splint armor",
	"plate armor",
	"shield",
];

export class ChargeTag {
	static _checkAndTag (obj, opts) {
		opts = opts || {};

		const strEntries = JSON.stringify(obj.entries);
		const mCharges = /(?:have|has|with) (\d+|{@dice .*?}) charge/gi.exec(strEntries);
		if (!mCharges) return;

		const ix = mCharges.index;
		obj.charges = isNaN(Number(mCharges[1])) ? mCharges[1] : Number(mCharges[1]);

		if (opts.cbInfo) {
			const ixMin = Math.max(0, ix - 10);
			const ixMax = Math.min(strEntries.length, ix + 10);
			opts.cbInfo(obj, strEntries, ixMin, ixMax);
		}
	}

	static tryRun (it, opts) {
		if (it.entries) this._checkAndTag(it, opts);
		if (it.inherits?.entries) this._checkAndTag(it.inherits, opts);
	}
}

export class RechargeTypeTag {
	static _checkAndTag (obj, opts) {
		if (!obj.entries) return;

		const strEntries = JSON.stringify(obj.entries, null, 2);

		const mShortRest = /regains all expended charges after a short (?:or long )?rest/i.test(strEntries);
		if (mShortRest) return obj.recharge = "restShort";

		const mLongRest = /All charges are restored when you finish a long rest/i.test(strEntries);
		if (mLongRest) return obj.recharge = "restLong";

		const mDawn = /charges? at dawn|charges? (?:daily|nightly),? (?:at|in the twilight before) dawn|charges?(?:, which (?:are|you) regain(?:ed)?)? each day at dawn|charges and regains all of them at dawn|charges and regains[^.]+each dawn|recharging them all each dawn|charges that are replenished each dawn/gi.exec(strEntries);
		if (mDawn) return obj.recharge = "dawn";

		const mDusk = /charges? (?:daily|nightly),? at dusk|charges? each (?:(?:day|night) at dusk|nightfall)|regains all charges at dusk/gi.exec(strEntries);
		if (mDusk) return obj.recharge = "dusk";

		const mMidnight = /charges? (?:daily|nightly),? at midnight|Each night at midnight[^.]+charges/gi.exec(strEntries);
		if (mMidnight) return obj.recharge = "midnight";

		const mDecade = /regains [^ ]+ expended charge every ten years/gi.exec(strEntries);
		if (mDecade) return obj.recharge = "decade";

		if (opts.cbMan) opts.cbMan(obj.name, obj.source);
	}

	static tryRun (it, opts) {
		if (it.charges) this._checkAndTag(it, opts);
		if (it.inherits?.charges) this._checkAndTag(it.inherits, opts);
	}
}

export class RechargeAmountTag {
	// Note that ordering is important--handle dice versions; text numbers first
	static _PTS_CHARGES = [
		"{@dice [^}]+}",
		"(?:one|two|three|four|five|six|seven|eight|nine|ten)",
		"\\d+",
	];

	static _RE_TEMPLATES_CHARGES = [
		// region Dawn
		[
			"(?<charges>",
			")[^.]*?\\b(?:charges? (?:at|each) dawn|charges? (?:daily|nightly),? (?:at|in the twilight before) dawn|charges?(?:, which (?:are|you) regain(?:ed)?)? each day at dawn)",
		],
		[
			"charges and regains (?<charges>",
			") each dawn",
		],
		// endregion

		// region Dusk
		[
			"(?<charges>",
			")[^.]*?\\b(?:charges? (?:daily|nightly),? at dusk|charges? each (?:(?:day|night) at dusk|nightfall))",
		],
		// endregion

		// region Midnight
		[
			"(?<charges>",
			")[^.]*?\\b(?:charges? (?:daily|nightly),? at midnight)",
		],
		[
			"Each night at midnight[^.]+regains (?<charges>",
			")[^.]*\\bcharges",
		],
		// endregion

		// region Decade
		[
			"regains (?<charges>",
			")[^.]*?\\b(?:charges? every ten years)",
		],
		// endregion
	];

	static _RES_CHARGES = null;

	static _RES_ALL = [
		/charges and regains all of them at dawn/i,
		/recharging them all each dawn/i,
		/charges that are replenished each dawn/i,
		/regains? all expended charges (?:daily )?at dawn/i,
		/regains all charges (?:each day )?at (?:dusk|dawn)/i,
		/All charges are restored when you finish a (?:long|short) rest/i,
		/regains all expended charges after a short (?:or long )?rest/i,
	];

	static _getRechargeAmount (str) {
		if (!isNaN(str)) return Number(str);
		const fromText = Parser.textToNumber(str);
		if (!isNaN(fromText)) return fromText;
		return str;
	}

	static _checkAndTag (obj, opts) {
		if (!obj.entries) return;

		const strEntries = JSON.stringify(obj.entries, null, 2);

		this._RES_CHARGES = this._RES_CHARGES || this._PTS_CHARGES
			.map(pt => {
				return this._RE_TEMPLATES_CHARGES
					.map(template => {
						const [pre, post] = template;
						return new RegExp([pre, pt, post].join(""), "i");
					});
			})
			.flat();

		for (const re of this._RES_CHARGES) {
			const m = re.exec(strEntries);
			if (!m) continue;
			return obj.rechargeAmount = this._getRechargeAmount(m.groups.charges);
		}

		if (this._RES_ALL.some(re => re.test(strEntries))) return obj.rechargeAmount = obj.charges;

		if (opts.cbMan) opts.cbMan(obj.name, obj.source);
	}

	static tryRun (it, opts) {
		if (it.charges && it.recharge) this._checkAndTag(it, opts);
		if (it.inherits?.charges && it.inherits?.recharge) this._checkAndTag(it.inherits, opts);
	}
}

export class AttachedSpellTag {
	static _checkAndTag (obj, opts) {
		const strEntries = JSON.stringify(obj.entries);

		const outSet = new Set();

		const regexps = [ // uses m[1]
			/duplicate the effect of the {@spell ([^}]*)} spell/gi,
			/a creature is under the effect of a {@spell ([^}]*)} spell/gi,
			/(?:gain(?:s)?|under|produces) the (?:[a-zA-Z\\"]+ )?effect of (?:the|a|an) {@spell ([^}]*)} spell/gi,
			/functions as the {@spell ([^}]*)} spell/gi,
			/as with the {@spell ([^}]*)} spell/gi,
			/as if using a(?:n)? {@spell ([^}]*)} spell/gi,
			/cast a(?:n)? {@spell ([^}]*)} spell/gi,
			/as a(?:n)? \d..-level {@spell ([^}]*)} spell/gi,
			/cast(?:(?: a version of)? the)?(?: spell)? {@spell ([^}]*)}/gi,
			/cast the \d..-level version of {@spell ([^}]*)}/gi,
			/{@spell ([^}]*)} \([^)]*\d+ charge(?:s)?\)/gi,
		];

		const regexpsSeries = [ // uses m[0]
			/emanate the [^.]* spell/gi,
			/cast one of the following [^.]*/gi,
			/can be used to cast [^.]*/gi,
			/you can([^.]*expend[^.]*)? cast [^.]* (and|or) [^.]*/gi,
			/you can([^.]*)? cast [^.]* (and|or) [^.]* from the weapon/gi,
			/Spells are cast at their lowest level[^.]*: [^.]*/gi,
		];

		regexps.forEach(re => {
			strEntries.replace(re, (...m) => outSet.add(m[1].toSpellCase()));
		});

		regexpsSeries.forEach(re => {
			strEntries.replace(re, (...m) => this._checkAndTag_addTaggedSpells({str: m[0], outSet}));
		});

		// region Tag spells in tables
		const walker = MiscUtil.getWalker({isNoModification: true});
		this._checkAndTag_tables({obj, walker, outSet});
		// endregion

		obj.attachedSpells = [...outSet];
		if (!obj.attachedSpells.length) delete obj.attachedSpells;
	}

	static _checkAndTag_addTaggedSpells ({str, outSet}) {
		return str.replace(/{@spell ([^}]*)}/gi, (...m) => outSet.add(m[1].toSpellCase()));
	}

	static _checkAndTag_tables ({obj, walker, outSet}) {
		const walkerHandlers = {
			object: [
				(obj) => {
					if (obj.type !== "table") return obj;

					// Require the table to have the string "spell" somewhere in its caption/column labels
					const hasSpellInCaption = obj.caption && /spell/i.test(obj.caption);
					const hasSpellInColLabels = obj.colLabels && obj.colLabels.some(it => /spell/i.test(it));
					if (!hasSpellInCaption && !hasSpellInColLabels) return obj;

					(obj.rows || []).forEach(r => {
						r.forEach(c => this._checkAndTag_addTaggedSpells({str: c, outSet}));
					});

					return obj;
				},
			],
		};
		const cpy = MiscUtil.copy(obj);
		walker.walk(cpy, walkerHandlers);
	}

	static tryRun (it, opts) {
		if (it.entries) this._checkAndTag(it, opts);
		if (it.inherits && it.inherits.entries) this._checkAndTag(it.inherits, opts);
	}
}

export class BonusTag {
	static _runOn (obj, prop, opts) {
		opts = opts || {};
		let strEntries = JSON.stringify(obj.entries);

		// Clean the root--"inherits" data may have specific bonuses as per the variant (e.g. +3 weapon -> +3) that
		//   we don't want to remove.
		// Legacy "bonus" data will be cleaned up if an updated bonus type is found.
		if (prop !== "inherits") {
			delete obj.bonusWeapon;
			delete obj.bonusWeaponAttack;
			delete obj.bonusAc;
			delete obj.bonusSavingThrow;
			delete obj.bonusSpellAttack;
			delete obj.bonusSpellSaveDc;
		}

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*(?:attack|hit) and damage rolls)/ig, (...m) => {
			if (m[0].toLowerCase().includes("spell")) return m[0];

			obj.bonusWeapon = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeapon}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*(?:attack rolls|hit))/ig, (...m) => {
			if (obj.bonusWeapon) return m[0];
			if (m[0].toLowerCase().includes("spell")) return m[0];

			obj.bonusWeaponAttack = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeaponAttack}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on)(?: your)? [^.]*(?:AC|Armor Class|armor class|{@variantrule Armor Class\|XPHB}))/g, (...m) => {
			obj.bonusAc = `+${m[1]}`;
			return opts.isVariant ? `{=bonusAc}${m[2]}` : m[0];
		});

		// FIXME(Future) false positives:
		//   - Black Dragon Scale Mail
		strEntries = strEntries.replace(/\+\s*(\d)([^.\d]+(?:bonus )?(?:to|on) [^.]*saving throws)/g, (...m) => {
			obj.bonusSavingThrow = `+${m[1]}`;
			return opts.isVariant ? `{=bonusSavingThrow}${m[2]}` : m[0];
		});

		// FIXME(Future) false negatives:
		//   - Robe of the Archmagi
		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*spell attack rolls)/g, (...m) => {
			obj.bonusSpellAttack = `+${m[1]}`;
			return opts.isVariant ? `{=bonusSpellAttack}${m[2]}` : m[0];
		});

		// FIXME(Future) false negatives:
		//   - Robe of the Archmagi
		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*saving throw DCs)/g, (...m) => {
			obj.bonusSpellSaveDc = `+${m[1]}`;
			return opts.isVariant ? `{=bonusSpellSaveDc}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(BonusTag._RE_BASIC_WEAPONS, (...m) => {
			obj.bonusWeapon = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeapon}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(BonusTag._RE_BASIC_ARMORS, (...m) => {
			obj.bonusAc = `+${m[1]}`;
			return opts.isVariant ? `{=bonusAc}${m[2]}` : m[0];
		});

		// region Homebrew
		// "this weapon is a {@i dagger +1}"
		strEntries = strEntries.replace(/({@i(?:tem)? )([^}]+ )\+(\d+)((?:|[^}]+)?})/, (...m) => {
			const ptItem = m[2].trim().toLowerCase();
			if (ConverterUtilsItem.BASIC_WEAPONS.includes(ptItem)) {
				obj.bonusWeapon = `+${m[3]}`;
				return opts.isVariant ? `${m[1]}${m[2]}{=bonusWeapon}${m[2]}` : m[0];
			} else if (ConverterUtilsItem.BASIC_ARMORS.includes(ptItem)) {
				obj.bonusAc = `+${m[3]}`;
				return opts.isVariant ? `${m[1]}${m[2]}{=bonusAc}${m[2]}` : m[0];
			}
			return m[0];
		});

		// Damage roll with no attack roll
		strEntries = strEntries.replace(/\+\s*(\d)([^.]+(?:bonus )?(?:to|on) [^.]*damage rolls)/ig, (...m) => {
			if (obj.bonusWeapon) return m[0];

			obj.bonusWeaponDamage = `+${m[1]}`;
			return opts.isVariant ? `{=bonusWeaponDamage}${m[2]}` : m[0];
		});

		strEntries = strEntries.replace(/(grants )\+\s*(\d)((?: to| on)?(?: your)? [^.]*(?:AC|Armor Class|armor class))/g, (...m) => {
			obj.bonusAc = `+${m[2]}`;
			return opts.isVariant ? `${m[1]}{=bonusAc}${m[3]}` : m[0];
		});
		// endregion

		// If the bonus weapon attack and damage are identical, combine them
		if (obj.bonusWeaponAttack && obj.bonusWeaponDamage && obj.bonusWeaponAttack === obj.bonusWeaponDamage) {
			obj.bonusWeapon = obj.bonusWeaponAttack;
			delete obj.bonusWeaponAttack;
			delete obj.bonusWeaponDamage;
		}

		// TODO(Future) expand this?
		strEntries.replace(/scores? a critical hit on a (?:(?:{@dice )?d20}? )?roll of 19 or 20/gi, () => {
			obj.critThreshold = 19;
		});

		// TODO(Future) `.bonusWeaponCritDamage` (these are relatively uncommon)

		// region Speed bonus
		this._mutSpeedBonus({obj, strEntries});
		// endregion

		obj.entries = JSON.parse(strEntries);
	}

	static _mutSpeedBonus ({obj, strEntries}) {
		strEntries.replace(BonusTag._RE_SPEED_MULTIPLE, (...m) => {
			const {mode, factor} = m.last();
			obj.modifySpeed = {multiplier: {[this._getSpeedKey(mode)]: Parser.textToNumber(factor)}};
		});

		[BonusTag._RE_SPEED_BECOMES, BonusTag._RE_SPEED_GAIN, BonusTag._RE_SPEED_GAIN__EXPEND_CHARGE, BonusTag._RE_SPEED_GIVE_YOU].forEach(re => {
			strEntries.replace(re, (...m) => {
				const {mode, value} = m.last();
				obj.modifySpeed = MiscUtil.merge(obj.modifySpeed || {}, {static: {[this._getSpeedKey(mode)]: Number(value)}});
			});
		});

		strEntries.replace(BonusTag._RE_SPEED_EQUAL_WALKING, (...m) => {
			const {mode} = m.last();
			obj.modifySpeed = MiscUtil.merge(obj.modifySpeed || {}, {equal: {[this._getSpeedKey(mode)]: "walk"}});
		});

		strEntries.replace(BonusTag._RE_SPEED_BONUS_ALL, (...m) => {
			const {value} = m.last();
			obj.modifySpeed = MiscUtil.merge(obj.modifySpeed || {}, {bonus: {"*": Number(value)}});
		});

		strEntries.replace(BonusTag._RE_SPEED_BONUS_SPECIFIC, (...m) => {
			const {mode, value} = m.last();
			obj.modifySpeed = MiscUtil.merge(obj.modifySpeed || {}, {bonus: {[this._getSpeedKey(mode)]: Number(value)}});
		});
	}

	static _getSpeedKey (speedText) {
		speedText = speedText.toLowerCase().trim();
		switch (speedText) {
			case "walking":
			case "burrowing":
			case "climbing":
			case "flying": return speedText.replace(/ing$/, "");
			case "swimming": return "swim";
			default: throw new Error(`Unhandled speed text "${speedText}"`);
		}
	}

	static tryRun (it, opts) {
		if (it.inherits && it.inherits.entries) this._runOn(it.inherits, "inherits", opts);
		else if (it.entries) this._runOn(it, null, opts);
	}
}
BonusTag._RE_BASIC_WEAPONS = new RegExp(`\\+\\s*(\\d)(\\s+(?:${ConverterUtilsItem.BASIC_WEAPONS.join("|")}|weapon))`);
BonusTag._RE_BASIC_ARMORS = new RegExp(`\\+\\s*(\\d)(\\s+(?:${ConverterUtilsItem.BASIC_ARMORS.join("|")}|armor))`);
BonusTag._PT_SPEEDS = `(?<mode>walking|flying|swimming|climbing|burrowing)`;
BonusTag._PT_SPEED_VALUE = `(?<value>\\d+)`;
BonusTag._RE_SPEED_MULTIPLE = new RegExp(`(?<factor>double|triple|quadruple) your ${BonusTag._PT_SPEEDS} speed`, "gi");
BonusTag._RE_SPEED_BECOMES = new RegExp(`your ${BonusTag._PT_SPEEDS} speed becomes ${BonusTag._PT_SPEED_VALUE} feet`, "gi");
BonusTag._RE_SPEED_GAIN = new RegExp(`you (?:gain|have) a ${BonusTag._PT_SPEEDS} speed of ${BonusTag._PT_SPEED_VALUE} feet`, "gi");
BonusTag._RE_SPEED_GAIN__EXPEND_CHARGE = new RegExp(`expend (?:a|\\d+) charges? to gain a ${BonusTag._PT_SPEEDS} speed of ${BonusTag._PT_SPEED_VALUE} feet`, "gi");
BonusTag._RE_SPEED_GIVE_YOU = new RegExp(`give you a ${BonusTag._PT_SPEEDS} speed of ${BonusTag._PT_SPEED_VALUE} feet`, "gi");
BonusTag._RE_SPEED_EQUAL_WALKING = new RegExp(`you (?:gain|have) a ${BonusTag._PT_SPEEDS} speed equal to your walking speed`, "gi");
BonusTag._RE_SPEED_BONUS_ALL = new RegExp(`you (?:gain|have) a bonus to speed of ${BonusTag._PT_SPEED_VALUE} feet`, "gi");
BonusTag._RE_SPEED_BONUS_SPECIFIC = new RegExp(`increas(?:ing|e) your ${BonusTag._PT_SPEEDS} by ${BonusTag._PT_SPEED_VALUE} feet`, "gi");

export class BasicTextClean {
	static tryRun (it, opts) {
		const walker = MiscUtil.getWalker({keyBlocklist: new Set(["type"])});
		walker.walk(it, {
			array: (arr) => {
				return arr.filter(it => {
					if (typeof it !== "string") return true;

					if (/^\s*Proficiency with .*? allows you to add your proficiency bonus to the attack roll for any attack you make with it\.\s*$/i.test(it)) return false;
					if (/^\s*A shield is made from wood or metal and is carried in one hand\. Wielding a shield increases your Armor Class by 2. You can benefit from only one shield at a time\.\s*$/i.test(it)) return false;
					if (/^\s*This armor consists of a coat and leggings \(and perhaps a separate skirt\) of leather covered with overlapping pieces of metal, much like the scales of a fish\. The suit includes gauntlets\.\s*$/i.test(it)) return false;

					return true;
				});
			},
		});
	}
}

export class ItemOtherTagsTag {
	static tryRun (it, opts) {
		if (!(it.entries || (it.inherits && it.inherits.entries))) return;

		const tgt = it.entries ? it : it.inherits;

		const strEntries = JSON.stringify(it.entries || it.inherits.entries);

		strEntries.replace(/"Sentience"/, () => tgt.sentient = true);
		strEntries.replace(/"Curse"/, () => tgt.curse = true);

		strEntries.replace(/you[^.]* (gain|have)? proficiency/gi, () => tgt.grantsProficiency = true);
		strEntries.replace(/you gain[^.]* following proficiencies/gi, () => tgt.grantsProficiency = true);
		strEntries.replace(/you are[^.]* considered proficient/gi, () => tgt.grantsProficiency = true);

		strEntries.replace(/[Yy]ou can speak( and understand)? [A-Z]/g, () => tgt.grantsLanguage = true);
	}
}

export class ItemMiscTag {
	/** @return empty string for easy use in `.replace` */
	static _addTag ({tagSet, allowlistTags, tag}) {
		if (allowlistTags != null && !allowlistTags.has(tag)) return "";
		tagSet.add(tag);
		return "";
	}

	static tryRun (ent, {isAdditiveOnly = false, allowlistTags = null} = {}) {
		const tagSet = new Set(isAdditiveOnly ? ent.miscTags || [] : []);
		const tgt = ent.inherits || ent;
		this._tryRun_consumable({tagSet, allowlistTags, tgt});
		if (tagSet.size) ent.miscTags = [...tagSet].sort(SortUtil.ascSortLower);
		else if (!isAdditiveOnly) delete ent.miscTags;
	}

	static _tryRun_consumable ({tagSet, allowlistTags, tgt}) {
		if (
			tgt.type
			&& [
				Parser.ITM_TYP_ABV__AMMUNITION_FUTURISTIC,
				Parser.ITM_TYP_ABV__EXPLOSIVE,
				Parser.ITM_TYP_ABV__FOOD_AND_DRINK,
				Parser.ITM_TYP_ABV__ILLEGAL_DRUG,
				Parser.ITM_TYP_ABV__POTION,
				Parser.ITM_TYP_ABV__SCROLL,
			]
				.includes(DataUtil.itemType.unpackUid(tgt.type).abbreviation)
		) {
			this._addTag({tagSet, allowlistTags, tag: "CNS"});
			return;
		}

		if (tgt.poison) {
			this._addTag({tagSet, allowlistTags, tag: "CNS"});
		}
	}
}

export class ItemSpellcastingFocusTag {
	static tryRun (it, opts) {
		const focusClasses = new Set(it.focus || []);
		ItemSpellcastingFocusTag._RE_CLASS_NAMES = ItemSpellcastingFocusTag._RE_CLASS_NAMES || new RegExp(`(${Parser.ITEM_SPELLCASTING_FOCUS_CLASSES.join("|")})`, "gi");

		let isMiscFocus = false;
		if (it.entries || (it.inherits && it.inherits.entries)) {
			const tgt = it.entries ? it : it.inherits;

			const walker = MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST, isNoModification: true});
			walker.walk(
				tgt,
				{
					string: (str) => {
						str
							.replace(/spellcasting focus for your([^.?!:]*) spells/, (...m) => {
								if (!m[1].trim()) {
									isMiscFocus = true;
									return;
								}

								m[1].trim().replace(ItemSpellcastingFocusTag._RE_CLASS_NAMES, (...n) => {
									focusClasses.add(n[1].toTitleCase());
								});
							});
						return str;
					},
				},
			);
		}

		// The focus type may be implicitly specified by the attunement requirement
		if (isMiscFocus && it.reqAttune && typeof it.reqAttune === "string" && /^by a /i.test(it.reqAttune)) {
			const validClasses = new Set(Parser.ITEM_SPELLCASTING_FOCUS_CLASSES.map(it => it.toLowerCase()));
			it.reqAttune
				.replace(/^by a/i, "")
				.split(/, | or /gi)
				.map(it => it.trim().replace(/ or | a /gi, "").toLowerCase())
				.filter(Boolean)
				.filter(it => validClasses.has(it))
				.forEach(it => focusClasses.add(it.toTitleCase()));
		}

		if (focusClasses.size) it.focus = [...focusClasses].sort(SortUtil.ascSortLower);
	}
}
ItemSpellcastingFocusTag._RE_CLASS_NAMES = null;

export class DamageResistanceTag {
	static tryRun (it, opts) {
		DamageResistanceImmunityVulnerabilityTag.tryRun(
			"resist",
			/you (?:have|gain|are) (?:resistance|resistant) (?:to|against) [^?.!]+/ig,
			it,
			opts,
		);
	}
}

export class DamageImmunityTag {
	static tryRun (it, opts) {
		DamageResistanceImmunityVulnerabilityTag.tryRun(
			"immune",
			/you (?:have|gain|are) (?:immune|immunity) (?:to|against) [^?.!]+/ig,
			it,
			opts,
		);
	}
}

export class DamageVulnerabilityTag {
	static tryRun (it, opts) {
		DamageResistanceImmunityVulnerabilityTag.tryRun(
			"vulnerable",
			/you (?:have|gain|are) (?:vulnerable|vulnerability) (?:to|against) [^?.!]+/ig,
			it,
			opts,
		);
	}
}

export class DamageResistanceImmunityVulnerabilityTag {
	static _checkAndTag (prop, reOuter, obj, opts) {
		if (prop === "resist" && obj.hasRefs) return; // Assume these are already tagged

		const all = new Set();
		const outer = [];
		DamageResistanceImmunityVulnerabilityTag._WALKER.walk(
			obj.entries,
			{
				string: (str) => {
					str.replace(reOuter, (full, ..._) => {
						outer.push(full);
						full = full.split(/ except /gi)[0];
						full.replace(ConverterConst.RE_DAMAGE_TYPE, (full, dmgType) => {
							all.add(dmgType.toLowerCase());
						});
					});
				},
			},
		);
		if (all.size) obj[prop] = [...all].sort(SortUtil.ascSortLower);
		else delete obj[prop];

		if (outer.length && !all.size) {
			if (opts.cbMan) opts.cbMan(`Could not find damage types in string(s) ${outer.map(it => `"${it}"`).join(", ")}`);
		}
	}

	static tryRun (prop, reOuter, it, opts) {
		DamageResistanceImmunityVulnerabilityTag._WALKER = DamageResistanceImmunityVulnerabilityTag._WALKER || MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST, isNoModification: true});

		if (it.entries) this._checkAndTag(prop, reOuter, it, opts);
		if (it.inherits && it.inherits.entries) this._checkAndTag(prop, reOuter, it.inherits, opts);
	}
}
DamageResistanceImmunityVulnerabilityTag._WALKER = null;

export class ConditionImmunityTag {
	static _checkAndTag (obj) {
		const all = new Set();
		ConditionImmunityTag._WALKER.walk(
			obj.entries,
			{
				string: (str) => {
					str.replace(/you (?:have|gain|are) (?:[^.!?]+ )?immun(?:e|ity) to disease/gi, (...m) => {
						all.add("disease");
					});

					str.replace(/you (?:have|gain|are) (?:[^.!?]+ )?(?:immune) ([^.!?]+)/gi, (...m) => {
						m[1].replace(/{@condition ([^}]+)}/gi, (...n) => {
							all.add(n[1].toLowerCase());
						});
					});
				},
			},
		);
		if (all.size) obj.conditionImmune = [...all].sort(SortUtil.ascSortLower);
		else delete obj.conditionImmune;
	}

	static tryRun (it, opts) {
		ConditionImmunityTag._WALKER = ConditionImmunityTag._WALKER || MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST, isNoModification: true});

		if (it.entries) this._checkAndTag(it, opts);
		if (it.inherits && it.inherits.entries) this._checkAndTag(it.inherits, opts);
	}
}
ConditionImmunityTag._WALKER = null;

export class ReqAttuneTagTag {
	static _checkAndTag (obj, opts, isAlt) {
		const prop = isAlt ? "reqAttuneAlt" : "reqAttune";

		if (typeof obj[prop] === "boolean" || obj[prop] === "optional") return;

		let req = obj[prop].replace(/^by/i, "");

		const tags = [];

		// "by a creature with the Mark of Finding"
		req = req.replace(/(?:a creature with the )?\bMark of ([A-Z][^ ]+)/g, (...m) => {
			const races = ReqAttuneTagTag._EBERRON_MARK_RACES[`Mark of ${m[1]}`];
			if (!races) return "";
			races.forEach(race => tags.push({race: race.toLowerCase()}));
			return "";
		});

		// "by a member of the Azorius guild"
		req = req.replace(/(?:a member of the )?\b(Azorius|Boros|Dimir|Golgari|Gruul|Izzet|Orzhov|Rakdos|Selesnya|Simic)\b guild/g, (...m) => {
			tags.push({background: ReqAttuneTagTag._RAVNICA_GUILD_BACKGROUNDS[m[1]].toLowerCase()});
			return "";
		});

		// "by a creature with an intelligence score of 3 or higher"
		req = req.replace(/(?:a creature with (?:an|a) )?\b(strength|dexterity|constitution|intelligence|wisdom|charisma)\b score of (\d+)(?: or higher)?/g, (...m) => {
			const abil = m[1].slice(0, 3).toLowerCase();
			tags.push({[abil]: Number(m[2])});
		});

		// "by a creature that can speak Infernal"
		req = req.replace(/(?:a creature that can )?speak \b(Abyssal|Aquan|Auran|Celestial|Common|Deep Speech|Draconic|Druidic|Dwarvish|Elvish|Giant|Gnomish|Goblin|Halfling|Ignan|Infernal|Orc|Primordial|Sylvan|Terran|Thieves' cant|Undercommon)\b/g, (...m) => {
			tags.push({languageProficiency: m[1].toLowerCase()});
			return "";
		});

		// "by a creature that has proficiency in the Arcana skill"
		req = req.replace(/(?:a creature that has )?(?:proficiency|proficient).*?\b(Acrobatics|Animal Handling|Arcana|Athletics|Deception|History|Insight|Intimidation|Investigation|Medicine|Nature|Perception|Performance|Persuasion|Religion|Sleight of Hand|Stealth|Survival)\b skill/g, (...m) => {
			tags.push({skillProficiency: m[1].toLowerCase()});
			return "";
		});

		// "by a dwarf"
		req = req.replace(/(?:(?:a|an) )?\b(Dragonborn|Dwarf|Elf|Gnome|Half-Elf|Half-Orc|Halfling|Human|Tiefling|Warforged)\b/gi, (...m) => {
			const source = m[1].toLowerCase() === "warforged" ? Parser.SRC_ERLW : "";
			tags.push({race: `${m[1]}${source ? `|${source}` : ""}`.toLowerCase()});
			return "";
		});

		// "by a humanoid", "by a small humanoid"
		req = req.replace(/a (?:\b(tiny|small|medium|large|huge|gargantuan)\b )?\b(aberration|beast|celestial|construct|dragon|elemental|fey|fiend|giant|humanoid|monstrosity|ooze|plant|undead)\b/gi, (...m) => {
			const size = m[1] ? m[1][0].toUpperCase() : null;
			const out = {creatureType: m[2].toLowerCase()};
			if (size) out.size = size;
			tags.push(out);
			return "";
		});

		// "by a spellcaster"
		req = req.replace(/(?:a )?\bspellcaster\b/gi, (...m) => {
			tags.push({spellcasting: true});
			return "";
		});

		// "by a creature that has psionic ability"
		req = req.replace(/(?:a creature that has )?\bpsionic ability/gi, (...m) => {
			tags.push({psionics: true});
			return "";
		});

		// "by a bard, cleric, druid, sorcerer, warlock, or wizard"
		req = req.replace(new RegExp(`(?:(?:a|an) )?\\b${ConverterConst.STR_RE_CLASS}\\b`, "gi"), (...m) => {
			const source = m.last().name.toLowerCase() === "artificer" ? Parser.SRC_TCE : null;
			tags.push({class: `${m.last().name}${source ? `|${source}` : ""}`.toLowerCase()});
			return "";
		});

		// region Alignment
		// "by a creature of evil alignment"
		// "by a dwarf, fighter, or paladin of good alignment"
		// "by an elf or half-elf of neutral good alignment"
		// "by an evil cleric or paladin"
		const alignmentParts = req.split(/,| or /gi)
			.map(it => it.trim())
			.filter(it => it && it !== "," && it !== "or");

		alignmentParts.forEach(part => {
			Object.values(AlignmentUtil.ALIGNMENTS)
				.forEach(it => {
					if (it.regexWeak.test(part)) {
						// We assume the alignment modifies all previous entries
						if (tags.length) tags.forEach(by => by.alignment = [...it.output]);
						else tags.push({alignment: [...it.output]});
					}
				});
		});
		// endregion

		const propOut = isAlt ? "reqAttuneAltTags" : "reqAttuneTags";
		if (tags.length) obj[propOut] = tags;
		else delete obj[propOut];
	}

	static tryRun (it, opts) {
		if (it.reqAttune) this._checkAndTag(it, opts);
		if (it.inherits?.reqAttune) this._checkAndTag(it.inherits, opts);

		if (it.reqAttuneAlt) this._checkAndTag(it, opts, true);
		if (it.inherits?.reqAttuneAlt) this._checkAndTag(it.inherits, opts, true);
	}
}
ReqAttuneTagTag._RAVNICA_GUILD_BACKGROUNDS = {
	"Azorius": "Azorius Functionary|GGR",
	"Boros": "Boros Legionnaire|GGR",
	"Dimir": "Dimir Operative|GGR",
	"Golgari": "Golgari Agent|GGR",
	"Gruul": "Gruul Anarch|GGR",
	"Izzet": "Izzet Engineer|GGR",
	"Orzhov": "Orzhov Representative|GGR",
	"Rakdos": "Rakdos Cultist|GGR",
	"Selesnya": "Selesnya Initiate|GGR",
	"Simic": "Simic Scientist|GGR",
};
ReqAttuneTagTag._EBERRON_MARK_RACES = {
	"Mark of Warding": ["Dwarf (Mark of Warding)|ERLW"],
	"Mark of Shadow": ["Elf (Mark of Shadow)|ERLW"],
	"Mark of Scribing": ["Gnome (Mark of Scribing)|ERLW"],
	"Mark of Detection": ["Half-Elf (Variant; Mark of Detection)|ERLW"],
	"Mark of Storm": ["Half-Elf (Variant; Mark of Storm)|ERLW"],
	"Mark of Finding": [
		"Half-Orc (Variant; Mark of Finding)|ERLW",
		"Human (Variant; Mark of Finding)|ERLW",
	],
	"Mark of Healing": ["Halfling (Mark of Healing)|ERLW"],
	"Mark of Hospitality": ["Halfling (Mark of Hospitality)|ERLW"],
	"Mark of Handling": ["Human (Mark of Handling)|ERLW"],
	"Mark of Making": ["Human (Mark of Making)|ERLW"],
	"Mark of Passage": ["Human (Mark of Passage)|ERLW"],
	"Mark of Sentinel": ["Human (Mark of Sentinel)|ERLW"],
};

export class LightTag {
	static _getSingleRegex_lightInShape ({lightType, radiusName}) {
		return new RegExp(`\\b${lightType} light in a (?<${radiusName}>\\d+)-foot[- ](?<shape>radius|cone)\\b`, "gi");
	}
	static _getSingleRegex_lightOutTo ({lightType, radiusName}) {
		return new RegExp(`\\b${lightType} light out to (?:a range of )?(?<${radiusName}>\\d+) feet\\b`, "gi");
	}
	static _getSingleRegex_shapeOfLight ({lightType, radiusName}) {
		return new RegExp(`\\b(?<${radiusName}>\\d+)-foot[- ](?<shape>radius|cone) of ${lightType} light\\b`, "gi");
	}

	static _checkAndTag (obj, opts) {
		if (obj.light?.length) return;

		const light = [];

		MiscUtil.getWalker({isNoModification: true}).walk(obj.entries, {string: str => {
			let strStrippedTmp = Renderer.stripTags(str);
			[
				// Bright and dim
				/\bbright light in a (?<rBright>\d+)-foot[- ](?<shape>radius|cone) and dim light for an (?<isAdditional>additional) (?<rDim>\d+) (?:feet|foot|ft\.)\b/gi,
				/\blight in a \d+-foot[- ](?<shape>radius|cone); the (?<isAdditional>closest) (?<rBright>\d+) feet is bright light, and the farthest (?<rDim>\d+) feet is dim light\b/gi,
				/\bbright light in a (?<shape>radius|cone) of your choice up to (?<rBrightDim>\d+) feet and dim light for the (?<isAdditional>same) distance beyond that\b/gi,

				// Bright only
				this._getSingleRegex_lightInShape({lightType: "bright", radiusName: "rBright"}),
				this._getSingleRegex_lightOutTo({lightType: "bright", radiusName: "rBright"}),
				this._getSingleRegex_shapeOfLight({lightType: "bright", radiusName: "rBright"}),

				// Dim only
				this._getSingleRegex_lightInShape({lightType: "dim", radiusName: "rDim"}),
				this._getSingleRegex_lightOutTo({lightType: "dim", radiusName: "rDim"}),
				this._getSingleRegex_shapeOfLight({lightType: "dim", radiusName: "rDim"}),
			]
				.forEach(re => {
					strStrippedTmp = strStrippedTmp
						.replace(re, (...m) => {
							const {rBright, rDim, rBrightDim, shape, isAdditional} = m.at(-1);

							const rBrightNum = rBright ? Number(rBright) : rBrightDim ? Number(rBrightDim) : null;
							const rDimNum = rDim ? Number(rDim) : rBrightDim ? Number(rBrightDim) : null;
							const shapeClean = shape ? shape.toLowerCase().trim() : null;

							const out = {};
							if (rBrightNum) out.bright = rBrightNum;
							if (rDimNum) out.dim = isAdditional && rBrightNum ? (rBrightNum + rDimNum) : rDimNum;

							// Treat "radius" as the default
							if (shapeClean && shapeClean !== "radius") out.shape = shapeClean;

							light.push(out);
						});
				});
		}});

		if (light.length) obj.light = light;
	}

	static tryRun (ent, opts) {
		if (ent.entries) this._checkAndTag(ent, opts);
		if (ent.inherits && ent.inherits.entries) this._checkAndTag(ent.inherits, opts);
	}
}
