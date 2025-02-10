import {ScaleCreatureUtils} from "../scalecreature-utils.js";
import {CrScalerUtils} from "./scalecreature-scaler-cr-utils.js";
import {CrScalerBase} from "./scalecreature-scaler-cr-base.js";
import {VetoolsConfig} from "../../utils-config/utils-config-config.js";

export class CrScalerArmorClass extends CrScalerBase {
	static _AC_CR_RANGES = {
		"13": [-1, 3],
		"14": [4, 4],
		"15": [5, 7],
		"16": [8, 9],
		"17": [10, 12],
		"18": [13, 16],
		"19": [17, 30],
	};

	static _crToAc (cr) {
		return Number(CrScalerUtils.crRangeToVal(cr, this._AC_CR_RANGES));
	}

	/* -------------------------------------------- */

	constructor (opts) {
		super(opts);

		this._idealAcIn = CrScalerArmorClass._crToAc(this._crInNumber);
		this._idealAcOut = CrScalerArmorClass._crToAc(this._crOutNumber);
	}

	/* -------------------------------------------- */

	_getEnchanted (item, baseMod) {
		const out = [];
		for (let i = 0; i < 3; ++i) {
			out.push({
				tag: `+${i + 1} ${item}|dmg`,
				mod: baseMod + i + 1,
			});
			out.push({
				tag: `${item} +${i + 1}|dmg`,
				mod: baseMod + i + 1,
			});
		}
		return out;
	}

	_getAllVariants (obj) {
		return Object.keys(obj).map(armor => {
			const mod = obj[armor];
			return [{
				tag: `${armor}|phb`,
				mod,
			}].concat(this._getEnchanted(armor, mod));
		}).reduce((a, b) => a.concat(b), []);
	}

	_getAcBaseAndMod (all, tag) {
		const tagBaseType = tag.replace(/( \+\d)?\|.*$/, "");
		const tagBase = all[tagBaseType];
		const tagModM = /^.*? (\+\d)\|.*$/.exec(tag);
		const tagMod = tagModM ? Number(tagModM[1]) : 0;
		return [tagBase, tagMod];
	}

	_isStringContainsTag (tagSet, str) {
		return tagSet.find(it => str.includes(`@item ${it}`));
	}

	_replaceTag (str, oldTag, nuTag) {
		const out = str.replace(`@item ${oldTag}`, `@item ${nuTag}`);
		const spl = out.split("|");
		if (spl.length > 2) {
			return `${spl.slice(0, 2).join("|")}}`;
		}
		return out;
	}

	_canDropShield () {
		return this._mon._shieldRequired === false && this._mon._shieldDropped === false;
	}

	_dropShield (acItem) {
		const idxShield = acItem.from.findIndex(f => this._ALL_SHIELD_VARIANTS.find(s => f._.includes(s.tag)));
		if (idxShield === -1) throw new Error("Should never occur!");
		acItem.from.splice(idxShield, 1);
	}

	// normalises results as "value above 10"
	_getAcVal (name) {
		name = name.trim().toLowerCase();
		const toCheck = [this._HEAVY, this._MEDIUM, this._LIGHT, {shield: 2}];
		for (const tc of toCheck) {
			const armorKey = Object.keys(tc).find(k => name === k);
			if (armorKey) {
				const acBonus = tc[armorKey];
				if (acBonus > 10) return acBonus - 10;
			}
		}
	}

	_getDexCapVal (name) {
		name = name.trim().toLowerCase();
		const ix = [this._HEAVY, this._MEDIUM, this._LIGHT].findIndex(tc => !!Object.keys(tc).find(k => name === k));
		return ix === 0 ? 0 : ix === 1 ? 2 : ix === 3 ? 999 : null;
	}

	// dual-wield shields is 3 AC, according to VGM's Fire Giant Dreadnought
	// Therefore we assume "two shields = +1 AC"
	_DUAL_SHIELD_BONUS = 1;

	_HEAVY = {
		"ring mail": 14,
		"chain mail": 16,
		"splint armor": 17,
		"plate armor": 18,
	};
	_MEDIUM = {
		"hide armor": 12,
		"chain shirt": 13,
		"scale mail": 14,
		"breastplate": 14,
		"half plate armor": 15,
	};
	_LIGHT = {
		"padded armor": 11,
		"leather armor": 11,
		"studded leather armor": 12,
	};
	_MAGE_ARMOR = "@spell mage armor";

	_ALL_SHIELD_VARIANTS = null;
	_ALL_HEAVY_VARIANTS = null;
	_ALL_MEDIUM_VARIANTS = null;
	_ALL_LIGHT_VARIANTS = null;
	_initAllVariants () {
		this._ALL_SHIELD_VARIANTS = this._ALL_SHIELD_VARIANTS || [
			{
				tag: "shield|phb",
				mod: 2,
			},
			...this._getEnchanted("shield", 2),
		];

		this._ALL_HEAVY_VARIANTS = this._ALL_HEAVY_VARIANTS || this._getAllVariants(this._HEAVY);
		this._ALL_MEDIUM_VARIANTS = this._ALL_MEDIUM_VARIANTS || this._getAllVariants(this._MEDIUM);
		this._ALL_LIGHT_VARIANTS = this._ALL_LIGHT_VARIANTS || this._getAllVariants(this._LIGHT);
	}

	doAdjust () {
		this._initAllVariants();

		// if the DPR calculations didn't already adjust DEX, we can adjust it here
		// otherwise, respect the changes made in the DPR calculations, and find a combination of AC factors to meet the desired number
		this._mon.ac = this._mon.ac.map(acItem => this._getAdjustedAcItem({acItem}));
	}

	/** Update an existing AC to use our new DEX score, if we have one. */
	_doPreAdjustAcs ({acItem}) {
		if (!this._state.getHasModifiedAbilityScore("dex") || this._mon.dex === this._state.getOriginalScore("dex")) return;
		if (!acItem.from) return;

		const originalDexMod = Parser.getAbilityModNumber(this._state.getOriginalScore("dex"));
		const currentDexMod = Parser.getAbilityModNumber(this._mon.dex);

		if (originalDexMod === currentDexMod) return;

		// Handle mage armor, light armor, and medium armor.
		//   Note that natural armor and "unarmored" also include DEX, but these are handled in the main loop.

		if (this._isMageArmor(acItem)) {
			acItem._acBeforePreAdjustment = acItem.ac;
			acItem.ac = 13 + Parser.getAbilityModNumber(this._mon.dex);
			return;
		}

		const lightTags = this._ALL_LIGHT_VARIANTS.map(it => it.tag);
		const mediumTags = this._ALL_MEDIUM_VARIANTS.map(it => it.tag);

		for (let i = 0; i < acItem.from.length; ++i) {
			const from = acItem.from[i];

			const lightTag = this._isStringContainsTag(lightTags, from);
			if (lightTag) {
				acItem._acBeforePreAdjustment = acItem.ac;

				acItem.ac = acItem.ac - originalDexMod + currentDexMod;

				return;
			}

			const mediumTag = this._isStringContainsTag(mediumTags, from);
			if (mediumTag) {
				const originalDexModMedium = Math.min(2, originalDexMod);
				const currentDexModMedium = Math.min(2, currentDexMod);

				const curAc = acItem.ac;
				acItem.ac = acItem.ac - originalDexModMedium + currentDexModMedium;
				if (curAc !== acItem.ac) acItem._acBeforePreAdjustment = curAc;

				return;
			}
		}
	}

	_getAdjustedAcItem ({acItem}) {
		// Pre-adjust ACs to match our new DEX score, if we have one
		this._doPreAdjustAcs({acItem});

		// region Attempt to adjust this item until we find some output that works
		let iter = 0;
		let out = null;
		while (out == null) {
			if (iter > 100) throw new Error(`Failed to calculate new AC! Input was:\n${JSON.stringify(acItem, null, "\t")}`);
			out = this._getAdjustedAcItem_getAdjusted({acItem, iter});
			iter++;
		}
		// endregion

		// region Finalisation/cleanup
		// finalise "from"
		let handledEnchBonus = !acItem._enchTotal;
		if (acItem.from) {
			if (acItem._enchTotal) {
				acItem.from.forEach(f => {
					if (handledEnchBonus) return;

					if (f.ench && f.ench < 3) {
						const enchToGive = Math.min(3 - f.ench, acItem._enchTotal);
						acItem._enchTotal -= enchToGive;
						f.ench += enchToGive;
						acItem.ac += enchToGive;
						f._ = `{@item +${f.ench} ${f.name}}`;
						if (acItem._enchTotal <= 0) handledEnchBonus = true;
					} else if (out._gearBonus) {
						const enchToGive = Math.min(3, acItem._enchTotal);
						acItem._enchTotal -= enchToGive;
						f._ = `{@item +${enchToGive} ${f.name}}`;
						if (acItem._enchTotal <= 0) handledEnchBonus = true;
					}
				});
			}
			acItem.from = acItem.from.map(it => it._);
		}

		// if there's an unhandled enchantment, give the creature enchanted leather. This implies an extra point of AC, but this is an acceptable workaround
		if (!handledEnchBonus) {
			const enchToGive = Math.min(3, acItem._enchTotal);
			acItem._enchTotal -= enchToGive;
			acItem.ac += enchToGive + 1;
			(acItem.from = acItem.from || []).unshift(`{@item +${enchToGive} leather armor}`);

			if (acItem._enchTotal > 0) acItem.ac += acItem._enchTotal; // as a fallback, add any remaining enchantment AC to the total
		}

		if (acItem._miscOffset != null) acItem.ac += acItem._miscOffset;

		// cleanup
		[
			"_enchTotal",
			"_gearBonus",
			"_dexCap",
			"_miscOffset",
			"_isShield",
			"_isDualShields",
		].forEach(it => delete acItem[it]);
		// endregion

		return out;
	}

	_isMageArmor (acItem) {
		return acItem.condition && acItem.condition.toLowerCase().includes(this._MAGE_ARMOR);
	}

	_getAdjustedAcItem_getAdjusted ({acItem, iter}) {
		const getEnchTotal = () => acItem._enchTotal || 0;
		const getBaseGearBonus = () => acItem._gearBonus || 0;
		const getDexCap = () => acItem._dexCap || 999;

		// strip enchantments and total bonuses
		if (typeof acItem !== "number") {
			acItem._enchTotal = acItem._enchTotal || 0; // maintain this between loops, in case we throw away the enchanted gear
			acItem._gearBonus = 0; // recalculate this each time
			acItem._dexCap = 999; // recalculate this each time
		}

		if (acItem.from) {
			acItem.from = acItem.from.map(f => {
				if (f._) f = f._; // if a previous loop modified it

				const m = /@item (\+\d+) ([^+\d]+)\|([^|}]+)/gi.exec(f); // e.g. {@item +1 chain mail}
				if (m) {
					const [_, name, bonus, source] = m;

					const acVal = this._getAcVal(name);
					if (acVal) acItem._gearBonus += acVal;

					const dexCap = this._getDexCapVal(name);
					if (dexCap != null) acItem._dexCap = Math.min(acItem._dexCap, dexCap);

					const ench = Number(bonus);
					acItem._enchTotal += ench;
					return {
						_: f,
						name: name.trim(),
						ench: ench,
						source: source,
					};
				} else {
					const m = /@item ([^|}]+)(\|[^|}]+)?(\|[^|}]+)?/gi.exec(f);
					if (m) {
						const [_, name, source, display] = m;
						const out = {_: f, name};
						if (source) out.source = source;
						if (display) out.display = display;

						const acVal = this._getAcVal(name);
						if (acVal) {
							acItem._gearBonus += acVal;
							out._gearBonus = acVal;
						}

						const dexCap = this._getDexCapVal(name);
						if (dexCap != null) acItem._dexCap = Math.min(acItem._dexCap, dexCap);

						return out;
					} else return {_: f, name: f};
				}
			});
		}

		// for armored creatures, try to calculate the expected AC, and use this as a starting point for scaling
		const expectedBaseScore = this._state.getHasModifiedAbilityScore("dex")
			? (getBaseGearBonus() + Math.min(Parser.getAbilityModNumber(this._state.getOriginalScore("dex")), getDexCap()) + (this._isMageArmor(acItem) ? 13 : 10))
			: null;

		let canAdjustDex = !this._state.getHasModifiedAbilityScore("dex");
		const dexGain = Parser.getAbilityModNumber(this._mon.dex) - Parser.getAbilityModNumber(this._state.getOriginalScore("dex") || this._mon.dex);

		const curr = acItem._acBeforePreAdjustment != null
			? acItem._acBeforePreAdjustment
			: (acItem.ac || acItem);
		// don't include enchantments in AC-CR calculations
		const currWithoutEnchants = curr - (iter === 0 ? getEnchTotal() : 0); // only take it off on the first iteration, as it gets saved

		// ignore any other misc modifications from abilities, enchanted items, etc
		if (typeof acItem !== "number") {
			// maintain this between loops, keep the original "pure" version
			acItem._miscOffset = acItem._miscOffset != null
				? acItem._miscOffset
				: (expectedBaseScore != null ? currWithoutEnchants - expectedBaseScore : null);
		}

		const effectiveCurrent = expectedBaseScore == null ? currWithoutEnchants : expectedBaseScore;
		const target = ScaleCreatureUtils.getScaledToRatio(effectiveCurrent, this._idealAcIn, this._idealAcOut);
		let targetNoShield = target;
		const acGain = target - effectiveCurrent;

		const dexMismatch = acGain - dexGain;

		const adjustDex = ({dexMismatch}) => {
			this._state.setHasModifiedAbilityScore("dex");
			this._mon.dex = CrScalerUtils.calcNewAbility(this._mon, "dex", Parser.getAbilityModNumber(this._mon.dex) + dexMismatch);
			canAdjustDex = false;
			return true;
		};

		const handleNoArmor = () => {
			const target_noArmor = ScaleCreatureUtils.getScaledToRatio(acItem, this._idealAcIn, this._idealAcOut);
			const acGain_noArmor = target_noArmor - acItem;
			const dexMismatch_noArmor = acGain_noArmor - dexGain;

			if (dexMismatch_noArmor > 0) {
				if (canAdjustDex) {
					adjustDex({dexMismatch: dexMismatch_noArmor});
					return target_noArmor;
				}

				// fill the gap with natural armor
				if (VetoolsConfig.get("styleSwitcher", "style") === "classic") {
					return {
						ac: target_noArmor,
						from: ["natural armor"],
					};
				}
				return target_noArmor;
			}

			if (dexMismatch_noArmor < 0 && canAdjustDex) { // increase/reduce DEX to move the AC up/down
				adjustDex({dexMismatch: dexMismatch_noArmor});
				return target_noArmor;
			}

			// AC adjustment perfectly matches DEX adjustment; or there's nothing we can do because of a previous DEX adjustment
			return target_noArmor;
		};

		// "FROM" ADJUSTERS ========================================================================================

		const handleMageArmor = () => {
			// if there's mage armor, try adjusting dex
			if (this._isMageArmor(acItem)) {
				if (canAdjustDex) {
					acItem.ac = target;
					delete acItem._acBeforePreAdjustment;
					return adjustDex({dexMismatch});
				} else {
					// We have already set the AC in the pre-adjustment step.
					//   Mage armor means there was no other armor, so stop here.
					return true;
				}
			}
			return false;
		};

		const handleShield = () => {
			// if there's a shield, try dropping it
			if (acItem.from) {
				const fromShields = acItem.from.filter(f => this._ALL_SHIELD_VARIANTS.find(s => f._.includes(`@item ${s.tag}`)));
				if (fromShields.length) {
					if (fromShields.length > 1) throw new Error("AC contained multiple shields!"); // should be impossible

					// check if shields are an important part of this creature
					// if they have abilities/etc which refer to the shield, don't remove the shield
					const shieldRequired = this._mon._shieldRequired != null ? this._mon._shieldRequired : (() => {
						const checkShields = (prop) => {
							if (!this._mon[prop]) return false;
							for (const it of this._mon[prop]) {
								if (it.name && it.name.toLowerCase().includes("shield")) return true;
								if (it.entries && JSON.stringify(it.entries).match(/shield/i)) return true;
							}
						};
						return this._mon._shieldRequired = checkShields("trait")
							|| checkShields("action")
							|| checkShields("bonus")
							|| checkShields("reaction")
							|| checkShields("legendary")
							|| checkShields("mythic");
					})();
					this._mon._shieldDropped = false;

					const fromShield = fromShields[0];
					const fromShieldStr = fromShield._;
					fromShield._isShield = true;
					const idx = acItem.from.findIndex(it => it === fromShieldStr);

					if (fromShieldStr.endsWith("|shields}")) {
						fromShield._isDualShields = true;

						const shieldVal = this._ALL_SHIELD_VARIANTS.find(s => fromShieldStr.includes(s.tag));
						const shieldValModDual = shieldVal.mod + this._DUAL_SHIELD_BONUS;
						targetNoShield -= shieldValModDual;

						if (!shieldRequired && (acGain <= -shieldValModDual)) {
							acItem.from.splice(idx, 1);
							acItem.ac -= shieldValModDual;
							this._mon._shieldDropped = true;
							if (acItem.ac === target) return true;
						}
					} else {
						const shieldVal = this._ALL_SHIELD_VARIANTS.find(s => fromShieldStr.includes(s.tag));
						targetNoShield -= shieldVal.mod;

						if (!shieldRequired && (acGain <= -shieldVal.mod)) {
							acItem.from.splice(idx, 1);
							acItem.ac -= shieldVal.mod;
							this._mon._shieldDropped = true;
							if (acItem.ac === target) return true;
						}
					}
				}
			}
			return false;
		};

		// FIXME this can result in armor with strength requirements greater than the user can manage
		const handleHeavyArmor = () => {
			// if there's heavy armor, try adjusting it
			const PL3_PLATE = 21;

			const heavyTags = this._ALL_HEAVY_VARIANTS.map(it => it.tag);

			const isHeavy = (ac) => {
				return ac >= 14 && ac <= PL3_PLATE; // ring mail (14) to +3 Plate (21)
			};

			const isBeyondHeavy = (ac) => {
				return ac > PL3_PLATE; // more than +3 plate
			};

			const getHeavy = (ac) => {
				const nonEnch = Object.keys(this._HEAVY).find(armor => this._HEAVY[armor] === ac);
				if (nonEnch) return `${nonEnch}|phb`;
				switch (ac) {
					case 19: return [`+1 plate armor|dmg`, `+2 splint armor|dmg`][RollerUtil.roll(1, CrScalerUtils.RNG)];
					case 20: return `+2 plate armor|dmg`;
					case PL3_PLATE: return `+3 plate armor|dmg`;
				}
			};

			const applyPl3Plate = ({ixFrom, heavyTag}) => {
				acItem.from[ixFrom]._ = this._replaceTag(acItem.from[ixFrom]._, heavyTag, getHeavy(PL3_PLATE));
				acItem.ac = PL3_PLATE;
				delete acItem._acBeforePreAdjustment;
			};

			// For e.g. "Helmed Horror". Note that this should only ever *increase* shield AC.
			const applyBeyondHeavyShieldUpgrade = ({idealShieldAc}) => {
				const fromShield = acItem.from.find(it => it._isShield);
				const shieldVal = this._ALL_SHIELD_VARIANTS.find(s => fromShield._.includes(s.tag));
				const adjustmentDualShields = (fromShield._isDualShields ? this._DUAL_SHIELD_BONUS : 0);
				const shieldValMod = shieldVal.mod + adjustmentDualShields;
				const deltaShieldRequired = idealShieldAc - shieldValMod;
				if (deltaShieldRequired <= 0) return acItem.ac += shieldValMod;

				const deltaShieldMax = (5 + adjustmentDualShields) - shieldValMod;
				const deltaShield = Math.min(deltaShieldRequired, deltaShieldMax);
				const shieldValOut = this._ALL_SHIELD_VARIANTS.find(s => s.mod === (shieldVal.mod + deltaShield));

				fromShield._ = this._replaceTag(fromShield._, shieldVal.tag, shieldValOut.tag);

				acItem.ac += shieldValOut.mod + adjustmentDualShields;
			};

			if (acItem.from) {
				for (let i = 0; i < acItem.from.length; ++i) {
					const heavyTag = this._isStringContainsTag(heavyTags, acItem.from[i]._);
					if (heavyTag) {
						if (
							targetNoShield !== target
							&& isBeyondHeavy(targetNoShield)
							&& isBeyondHeavy(target)
						) {
							const deltaHeavy = (PL3_PLATE - 10) - acItem.from[i]._gearBonus;
							const idealShieldAc = target - (targetNoShield - deltaHeavy);

							applyPl3Plate({ixFrom: i, heavyTag}); // cap it at +3 plate
							applyBeyondHeavyShieldUpgrade({idealShieldAc}); // try to upgrade the shield
							return true;
						} if (isHeavy(targetNoShield)) {
							const bumpOne = targetNoShield === 15; // there's no heavy armor with 15 AC
							if (bumpOne) targetNoShield++;
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, heavyTag, getHeavy(targetNoShield));
							acItem.ac = target + (bumpOne ? 1 : 0);
							delete acItem._acBeforePreAdjustment;
							return true;
						} else if (this._canDropShield() && isHeavy(target)) {
							const targetWithBump = target + (target === 15 ? 1 : 0); // there's no heavy armor with 15 AC
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, heavyTag, getHeavy(targetWithBump));
							acItem.ac = targetWithBump;
							delete acItem._acBeforePreAdjustment;
							this._dropShield(acItem);
							return true;
						} else if (isBeyondHeavy(targetNoShield)) {
							applyPl3Plate({ixFrom: i, heavyTag}); // cap it at +3 plate and call it a day
							return true;
						} else { // drop to medium
							const [tagBase, tagMod] = this._getAcBaseAndMod(this._LIGHT, heavyTag);
							const tagAc = tagBase + tagMod;
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, heavyTag, `half plate armor|phb`);
							acItem.ac = (acItem.ac - tagAc) + 15 + Math.min(2, Parser.getAbilityModNumber(this._mon.dex));
							delete acItem._acBeforePreAdjustment;
							return false;
						}
					}
				}
			}
			return false;
		};

		const handleMediumArmor = () => {
			// if there's medium armor, try adjusting dex, then try adjusting it
			const mediumTags = this._ALL_MEDIUM_VARIANTS.map(it => it.tag);

			const isMedium = (ac, asPos) => {
				const min = 12 + (canAdjustDex ? -5 : Parser.getAbilityModNumber(this._mon.dex)); // hide; 12
				const max = 18 + (canAdjustDex ? 2 : Math.min(2, Parser.getAbilityModNumber(this._mon.dex))); // half-plate +3; 18
				if (asPos) return ac < min ? -1 : ac > max ? 1 : 0;
				return ac >= min && ac <= max;
			};

			const getMedium = (ac, curArmor) => {
				const getByBase = (base) => {
					switch (base) {
						case 14:
							return [`scale mail|phb`, `breastplate|phb`][RollerUtil.roll(1, CrScalerUtils.RNG)];
						case 16:
							return [`+1 half plate armor|dmg`, `+2 breastplate|dmg`, `+2 scale mail|dmg`][RollerUtil.roll(2, CrScalerUtils.RNG)];
						case 17:
							return `+2 half plate armor|dmg`;
						case 18:
							return `+3 half plate armor|dmg`;
						default: {
							const nonEnch = Object.keys(this._MEDIUM).find(it => this._MEDIUM[it] === base);
							return `${nonEnch}|phb`;
						}
					}
				};

				if (canAdjustDex) {
					let fromArmor = curArmor.ac;
					let maxFromArmor = fromArmor + 2;
					let minFromArmor = fromArmor - 5;

					const withinDexRange = () => {
						return ac >= minFromArmor && ac <= maxFromArmor;
					};

					const getTotalAc = () => {
						return fromArmor + Math.min(2, Parser.getAbilityModNumber(this._mon.dex));
					};

					let loops = 0;
					while (1) {
						if (loops > 1000) throw new Error(`Failed to find valid light armor!`);

						if (withinDexRange()) {
							canAdjustDex = false;
							this._state.setHasModifiedAbilityScore("dex");

							if (ac > getTotalAc()) this._mon.dex += 2;
							else this._mon.dex -= 2;
						} else {
							if (ac < minFromArmor) fromArmor -= 1;
							else fromArmor += 1;
							if (fromArmor < 12 || fromArmor > 18) throw Error("Should never occur!"); // sanity check
							maxFromArmor = fromArmor + 2;
							minFromArmor = fromArmor - 5;
						}

						if (getTotalAc() === ac) break;
						loops++;
					}

					return getByBase(fromArmor);
				} else {
					const dexOffset = Math.min(Parser.getAbilityModNumber(this._mon.dex), 2);
					return getByBase(ac - dexOffset);
				}
			};

			if (acItem.from) {
				for (let i = 0; i < acItem.from.length; ++i) {
					const mediumTag = this._isStringContainsTag(mediumTags, acItem.from[i]._);
					if (mediumTag) {
						const [tagBase, tagMod] = this._getAcBaseAndMod(this._MEDIUM, mediumTag);
						const tagAc = tagBase + tagMod;
						if (isMedium(targetNoShield)) {
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, mediumTag, getMedium(targetNoShield, {tag: mediumTag, ac: tagAc}));
							acItem.ac = target;
							delete acItem._acBeforePreAdjustment;
							return true;
						} else if (this._canDropShield() && isMedium(target)) {
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, mediumTag, getMedium(target, {tag: mediumTag, ac: tagAc}));
							acItem.ac = target;
							delete acItem._acBeforePreAdjustment;
							this._dropShield(acItem);
							return true;
						} else if (canAdjustDex && isMedium(targetNoShield, true) === -1) { // drop to light
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, mediumTag, `studded leather armor|phb`);
							acItem.ac = (acItem.ac - tagAc - Math.min(2, Parser.getAbilityModNumber(this._mon.dex))) + 12 + Parser.getAbilityModNumber(this._mon.dex);
							delete acItem._acBeforePreAdjustment;
							return false;
						} else {
							// if we need more AC, switch to heavy, and restart the conversion
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, mediumTag, `ring mail|phb`);
							acItem.ac = 14;
							delete acItem._acBeforePreAdjustment;
							return -1;
						}
					}
				}
			}
			return false;
		};

		const handleLightArmor = () => {
			// if there's light armor, try adjusting dex, then try adjusting it
			const lightTags = this._ALL_LIGHT_VARIANTS.map(it => it.tag);

			const isLight = (ac, asPos) => {
				const min = 11 + (canAdjustDex ? -5 : Parser.getAbilityModNumber(this._mon.dex)); // padded/leather; 11
				const max = 15 + (canAdjustDex ? 100 : Parser.getAbilityModNumber(this._mon.dex)); // studded leather +3; 15
				if (asPos) return ac < min ? -1 : ac > max ? 1 : 0;
				return ac >= min && ac <= max;
			};

			const getLight = (ac, curArmor) => {
				const getByBase = (base) => {
					switch (base) {
						case 11:
							return [`padded armor|phb`, `leather armor|phb`][RollerUtil.roll(1, CrScalerUtils.RNG)];
						case 12:
							return `studded leather armor|phb`;
						case 13:
							return [`+1 padded armor|dmg`, `+1 leather armor|dmg`][RollerUtil.roll(1, CrScalerUtils.RNG)];
						case 14:
							return [`+2 padded armor|dmg`, `+2 leather armor|dmg`, `+1 studded leather armor|dmg`][RollerUtil.roll(2, CrScalerUtils.RNG)];
						case 15:
							return `+2 studded leather armor|dmg`;
					}
				};

				if (canAdjustDex) {
					let fromArmor = curArmor.ac;
					let minFromArmor = fromArmor - 5;

					const withinDexRange = () => {
						return ac >= minFromArmor;
					};

					const getTotalAc = () => {
						return fromArmor + Parser.getAbilityModNumber(this._mon.dex);
					};

					let loops = 0;
					while (1) {
						if (loops > 1000) throw new Error(`Failed to find valid light armor!`);

						if (withinDexRange()) {
							canAdjustDex = false;
							this._state.setHasModifiedAbilityScore("dex");

							if (ac > getTotalAc()) this._mon.dex += 2;
							else this._mon.dex -= 2;
						} else {
							if (ac < minFromArmor) fromArmor -= 1;
							else fromArmor += 1;
							if (fromArmor < 11 || fromArmor > 15) throw Error("Should never occur!"); // sanity check
							minFromArmor = fromArmor - 5;
						}

						if (getTotalAc() === ac) break;
						loops++;
					}

					return getByBase(fromArmor);
				} else {
					const dexOffset = Parser.getAbilityModNumber(this._mon.dex);
					return getByBase(ac - dexOffset);
				}
			};

			if (acItem.from) {
				for (let i = 0; i < acItem.from.length; ++i) {
					const lightTag = this._isStringContainsTag(lightTags, acItem.from[i]._);
					if (lightTag) {
						const [tagBase, tagMod] = this._getAcBaseAndMod(this._LIGHT, lightTag);
						const tagAc = tagBase + tagMod;
						if (isLight(targetNoShield)) {
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, lightTag, getLight(targetNoShield, {tag: lightTag, ac: tagAc}));
							acItem.ac = target;
							delete acItem._acBeforePreAdjustment;
							return true;
						} else if (this._canDropShield() && isLight(target)) {
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, lightTag, getLight(target, {tag: lightTag, ac: tagAc}));
							acItem.ac = target;
							delete acItem._acBeforePreAdjustment;
							this._dropShield(acItem);
							return true;
						} else if (!canAdjustDex && isLight(targetNoShield, true) === -1) { // drop armor
							if (acItem.from.length === 1) { // revert to pure numerical
								acItem._droppedArmor = true;
								return -1;
							} else { // revert to base 10
								acItem.from.splice(i, 1);
								acItem.ac = (acItem.ac - tagAc) + 10;
								delete acItem._acBeforePreAdjustment;
								return -1;
							}
						} else {
							// if we need more, switch to medium, and restart the conversion
							acItem.from[i]._ = this._replaceTag(acItem.from[i]._, lightTag, `chain shirt|phb`);
							acItem.ac = (acItem.ac - tagAc - Parser.getAbilityModNumber(this._mon.dex)) + 13 + Math.min(2, Parser.getAbilityModNumber(this._mon.dex));
							delete acItem._acBeforePreAdjustment;
							return -1;
						}
					}
				}
			}
			return false;
		};

		const handleNaturalArmor = () => {
			// if there's natural armor, try adjusting dex, then try adjusting it

			if (acItem.from && acItem.from.map(it => it._).includes("natural armor")) {
				if (canAdjustDex) {
					acItem.ac = target;
					delete acItem._acBeforePreAdjustment;
					return adjustDex({dexMismatch});
				} else {
					acItem.ac = target; // natural armor of all modifiers is still just "natural armor," so this works
					delete acItem._acBeforePreAdjustment;
					return true;
				}
			}
			return false;
		};

		if (acItem.ac && !acItem._droppedArmor) {
			const toRun = [
				handleMageArmor,
				handleShield,
				handleHeavyArmor,
				handleMediumArmor,
				handleLightArmor,
				handleNaturalArmor,
			];
			let lastVal = 0;
			for (let i = 0; i < toRun.length; ++i) {
				lastVal = toRun[i]();
				if (lastVal === -1) return null;
				else if (lastVal) break;
			}

			// if there was no reasonable way to adjust the AC, forcibly set it here as a fallback
			if (!lastVal) {
				acItem.ac = target;
				delete acItem._acBeforePreAdjustment;
			}
			return acItem;
		} else {
			return handleNoArmor();
		}
	}
}
