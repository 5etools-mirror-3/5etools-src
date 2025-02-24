import {AlignmentUtil} from "./converterutils-utils-alignment.js";
import {TagCondition, TaggerUtils, TagUtil} from "./converterutils-tags.js";
import {ConverterConst} from "./converterutils-const.js";
import {ItemTag, SpellTag} from "./converterutils-entries.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";

export class AcConvert {
	static _ITEM_LOOKUP = null;
	static _ITEM_LOOKUP_CLASSIC = null;

	static tryPostProcessAc ({mon, cbMan, cbErr, styleHint}) {
		const traitNames = new Set(
			(mon.trait || [])
				.map(it => it.name ? it.name.toLowerCase() : null)
				.filter(Boolean),
		);

		if (this._tryPostProcessAc_special(mon, cbMan, cbErr)) return;

		const nuAc = [];

		const parts = mon.ac.trim().split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX).map(it => it.trim()).filter(Boolean);
		parts.forEach(pt => {
			// Use two expressions to ensure parentheses are paired
			const mAc = /^(\d+)(?: \((.*?)\))?$/.exec(pt) || /^(\d+)(?: (.*?))?$/.exec(pt);

			if (!mAc) {
				if (cbErr) cbErr(pt, `${`${mon.name} ${mon.source} p${mon.page}`.padEnd(48)} => ${pt}`);
				nuAc.push(pt);
				return;
			}

			const [, acRaw, fromRaw] = mAc;

			const acNum = Number(acRaw);

			// Plain number
			if (!fromRaw) return nuAc.push(acNum);

			const nuAcTail = [];
			const cur = {ac: acNum};
			const froms = [];

			let fromClean = fromRaw;

			// region Handle alternates of the form:
			//   - `natural armor; 22 in shield form`
			//   - `natural armor; 16 while flying`
			//   - `natural armor; 16 when flying`
			//   - `natural armor; 18 with hardened by flame`
			//   - `shield; ac 12 without shield`
			fromClean = fromClean
				.replace(/^(?:(?<from>.+); )?(?:(?:ac )?(?<nxtVal>\d+) (?<nxtCond>in .*? form|while .*?|when .*?|includes .*?|without .*?|with .*?))$/i, (...m) => {
					const {from, nxtVal, nxtCond} = m.at(-1);
					nuAcTail.push({
						ac: Number(nxtVal),
						condition: nxtCond,
						braces: true,
					});
					return from || "";
				});
			// endregion

			// region Handle alternates of the form:
			//   - `medium armor; includes shield`
			fromClean = fromClean
				.replace(/^(?<from>.+); (?:(?<nxtCond>includes .*?))$/i, (...m) => {
					cur.condition = `(${m.last().nxtCond})`;
					cur.braces = true;
					return m.last().from;
				});
			// endregion

			// region Handle "in ... form" parts
			fromClean = fromClean
				// FIXME(Future) Find an example of a creature with this AC form to check accuracy of this parse
				.replace(/(?<nxtVal>\d+)? \((?<nxtCond>in .*? form)\)$/i, (...m) => {
					if (m.last().nxtVal) {
						nuAcTail.push({
							ac: Number(m.last().nxtVal),
							condition: m.last().nxtCond,
							braces: true,
						});
						return "";
					}

					if (cur.condition) throw new Error(`Multiple AC conditions! "${cur.condition}" and "${m[0]}"`);
					cur.condition = m[0].trim().toLowerCase();
					return "";
				})
				.trim()
				.replace(/(?<nxtVal>\d+)? (?<nxtCond>in .*? form)$/i, (...m) => {
					if (m.last().nxtVal) {
						nuAcTail.push({
							ac: Number(m.last().nxtVal),
							condition: m.last().nxtCond,
							braces: true,
						});
						return "";
					}

					if (cur.condition) throw new Error(`Multiple AC conditions! "${cur.condition}" and "${m[0]}"`);
					cur.condition = m[0].trim().toLowerCase();
					return "";
				})
				.trim();
			// endregion

			// region Handle "while ..."/"when ..." parts
			fromClean = fromClean
				.replace(/^(while|when) .*$/, (...m) => {
					if (cur.condition) throw new Error(`Multiple AC conditions! "${cur.condition}" and "${m[0]}"`);
					cur.condition = m[0].trim().toLowerCase();
					return "";
				});
			// endregion

			fromClean
				.trim()
				.toLowerCase()
				.replace(/^\(|\)$/g, "")
				.split(",")
				.map(it => it.trim())
				.filter(Boolean)
				.forEach(fromLow => {
					switch (fromLow) {
						// literally nothing
						case "unarmored": break;

						// everything else
						default: {
							const simpleFrom = this._getSimpleFrom({fromLow, traitNames, styleHint});
							if (simpleFrom) return froms.push(simpleFrom);

							// Special parsing for barding, as the pre-barding armor type might not exactly match our known
							//   barding names (e.g. "chainmail barding")
							const mWithBarding = /^(?<ac>\d+) with (?<name>(?<type>.*?) barding)$/.exec(fromLow);
							if (mWithBarding) {
								let simpleFromBarding = this._getSimpleFrom({fromLow: mWithBarding.groups.type, traitNames, styleHint});
								if (simpleFromBarding) {
									simpleFromBarding = simpleFromBarding
										.replace(/{@item ([^}]+)}/, (...m) => {
											let [name, source, displayName] = m[1].split("|");
											name = `${name.replace(/ armor$/i, "")} barding`;

											if (mWithBarding.groups.name === name) return `{@item ${name}${source ? `|${source}` : ""}}`;
											return `{@item ${name}${source ? `|${source}` : "|"}|${mWithBarding.groups.name}}`;
										});

									nuAcTail.push({
										ac: Number(mWithBarding.groups.ac),
										condition: `with ${simpleFromBarding}`,
										braces: true,
									});

									return;
								}
							}

							if (fromLow.endsWith("with mage armor") || fromLow.endsWith("with barkskin")) {
								const numMatch = /(\d+) with (.*)/.exec(fromLow);
								if (!numMatch) throw new Error("Spell AC but no leading number?");

								let spell = null;
								if (numMatch[2] === "mage armor") spell = `{@spell mage armor}`;
								else if (numMatch[2] === "barkskin") spell = `{@spell barkskin}`;
								else throw new Error(`Unhandled spell! ${numMatch[2]}`);

								nuAcTail.push({
									ac: Number(numMatch[1]),
									condition: `with ${spell}`,
									braces: true,
								});

								return;
							}

							if (/^in .*? form$/i.test(fromLow)) {
								// If there's an existing condition, flag a warning
								if (cur.condition && cbMan) cbMan(fromLow, `AC requires manual checking: ${mon.name} ${mon.source} p${mon.page}`);
								cur.condition = `${cur.condition ? `${cur.condition} ` : ""}${fromLow}`;

								return;
							}

							if (cbMan) cbMan(fromLow, `AC requires manual checking: ${mon.name} ${mon.source} p${mon.page}`);
							froms.push(fromLow);
						}
					}
				});

			if (froms.length || cur.condition) {
				if (froms.length) {
					cur.from = froms
						// Ensure "Unarmored Defense" is always properly capitalized
						.map(it => it.toLowerCase() === "unarmored defense" ? "Unarmored Defense" : it);
				}
				nuAc.push(cur);
			} else {
				nuAc.push(cur.ac);
			}

			if (nuAcTail.length) nuAc.push(...nuAcTail);
		});

		mon.ac = nuAc;
	}

	static _tryPostProcessAc_special (mon, cbMan, cbErr) {
		mon.ac = mon.ac.trim();

		const mPlusSpecial = /^(\d+) (plus|\+) (?:PB|the level of the spell|the spell's level|your [^ ]+ modifier|\d+ per spell level)(?: (\+\s*\d )?\([^)]+\))?$/i.exec(mon.ac);
		if (mPlusSpecial) {
			mon.ac = [{special: mon.ac}];
			return true;
		}

		return false;
	}

	static _getSimpleFrom ({fromLow, traitNames, styleHint}) {
		const lookup = styleHint === SITE_STYLE__CLASSIC ? AcConvert._ITEM_LOOKUP_CLASSIC : AcConvert._ITEM_LOOKUP;

		switch (fromLow) {
			// region unhandled/other
			case "unarmored defense":
			case "suave defense":
			case "armor scraps":
			case "barding scraps":
			case "patchwork armor":
			case "see natural armor feature":
			case "barkskin trait":
			case "sylvan warrior":
			case "cage":
			case "chains":
			case "coin mail":
			case "crude armored coat":
			case "improvised armor":
			case "magic robes":
			case "makeshift armor":
			case "natural and mystic armor":
			case "padded armor":
			case "padded leather":
			case "parrying dagger":
			case "plant fiber armor":
			case "plus armor worn":
			case "rag armor":
			case "ring of protection +2":
			case "see below":
			case "wicker armor":
			case "bone armor":
			case "deflection":
			case "mental defense":
			case "blood aegis":
			case "psychic defense":
			case "glory": // BAM :: Reigar
			case "mountain tattoo": // KftGV :: Prisoner 13
			case "disarming charm": // TG :: Forge Fitzwilliam
			case "graz'zt's gift": // KftGV :: Sythian Skalderang
			case "damaged plate": // BGG :: Firegaunt
			case "intellect fortress": // N.b. *not* the spell of the same name, as this usually appears as a creature feature
			case "veiled presence": // BMT :: Enchanting Infiltrator
			case "coat of lies": // Grim Hollow: Lairs of Etharis
			case "rotting buff coat":
			case "battered splint mail":
			case "natural & tailored leather":
			case "canny defense": // Dungeons of Drakkenheim
			case "mail-shirt": // The Lord of the Rings Roleplaying
			case "orc-leather":
			case "heavy orc-mail":
			case "orc leather":
			case "orc-mail":
			case "mail hauberk":
				return fromLow;

			case "plate armor of bhaal": return "plate armor of Bhaal";
				// endregion

			// region homebrew
			// "Flee, Mortals!" retainers
			case "light armor":
			case "medium armor":
			case "heavy armor":
				return fromLow;
			// "Flee, Mortals!"
			case "issenblau plating":
			case "psionic power armor":
			case "precog reflexes":
			case "pathfinder's boots":
				return fromLow;
			// Humblewood Tales
			case "shadowed leather armor":
				return fromLow;
				// endregion

			// region au naturel
			case "natural armor":
			case "natural armour":
			case "natural":
				return "natural armor";
				// endregion

			// region spells
			case "foresight bonus": return `{@spell foresight} bonus`;
			case "natural barkskin": return `natural {@spell barkskin}`;
			case "mage armor": return "{@spell mage armor}";
			// endregion

			// region armor (mostly handled by the item lookup; these are mis-named exceptions (usually for homebrew))
			case "chainmail":
			case "chain armor":
				return "{@item chain mail|phb}";

			case "plate mail":
			case "platemail":
			case "full plate":
				return "{@item plate armor|phb}";

			case "half-plate": return "{@item half plate armor|phb}";

			case "scale armor": return "{@item scale mail|phb}";
			case "splint armor": return "{@item splint armor|phb}";
			case "chain shirt": return "{@item chain shirt|phb}";
			case "shields": return "{@item shield|phb|shields}";

			case "spiked shield": return "{@item shield|phb|spiked shield}";
			// endregion

			// region magic items
			case "dwarven plate": return "{@item dwarven plate}";
			case "elven chain": return "{@item elven chain}";
			case "glamoured studded leather": return "{@item glamoured studded leather}";
			case "bracers of defense": return "{@item bracers of defense}";
			case "badge of the watch": return "{@item Badge of the Watch|wdh}";
			case "cloak of protection": return "{@item cloak of protection}";
			case "ring of protection": return "{@item ring of protection}";
			case "robe of the archmagi": return "{@item robe of the archmagi}";
			case "robe of the archmage": return "{@item robe of the archmagi}";
			case "staff of power": return "{@item staff of power}";
			case "wrought-iron tower": return "{@item wrought-iron tower|CoA}";
			// endregion

			default: {
				if (lookup[fromLow]) {
					const itemMeta = lookup[fromLow];

					if (itemMeta.isExact) return `{@item ${fromLow}${itemMeta.source === Parser.SRC_DMG ? "" : `|${itemMeta.source}`}}`;
					return `{@item ${itemMeta.name}${itemMeta.source === Parser.SRC_DMG ? "|" : `|${itemMeta.source}`}|${fromLow}}`;
				}

				if (/scraps of .*?armor/i.test(fromLow)) { // e.g. "scraps of hide armor"
					return fromLow;
				}

				if (traitNames.has(fromLow)) {
					return fromLow;
				}
			}
		}
	}

	static init (items) {
		const handleBaseName = ({item, lowName, isClassicSource}) => {
			AcConvert._ITEM_LOOKUP[lowName] = {source: item.source, isExact: true};
			if (isClassicSource) AcConvert._ITEM_LOOKUP_CLASSIC[lowName] = AcConvert._ITEM_LOOKUP[lowName];

			const noArmorName = lowName.replace(/(^|\s)(?:armor|mail)(\s|$)/g, "$1$2").trim().replace(/\s+/g, " ");
			if (noArmorName !== lowName) {
				AcConvert._ITEM_LOOKUP[noArmorName] = {source: item.source, name: lowName};
				if (isClassicSource) AcConvert._ITEM_LOOKUP_CLASSIC[noArmorName] = AcConvert._ITEM_LOOKUP[noArmorName];
			}

			return noArmorName;
		};

		const handlePlusName = ({item, lowName, isClassicSource}) => {
			const mBonus = /^(.+) (\+\d+)$/.exec(lowName);
			if (!mBonus) return;

			const plusFirstName = `${mBonus[2]} ${mBonus[1]}`;
			AcConvert._ITEM_LOOKUP[plusFirstName] = {source: item.source, name: lowName};
			if (isClassicSource) AcConvert._ITEM_LOOKUP_CLASSIC[plusFirstName] = AcConvert._ITEM_LOOKUP[plusFirstName];
		};

		AcConvert._ITEM_LOOKUP = {};
		AcConvert._ITEM_LOOKUP_CLASSIC = {};
		items
			.filter(ent => {
				if (!ent.type) return false;
				const {abbreviation} = DataUtil.itemType.unpackUid(ent.type);
				return [
					Parser.ITM_TYP_ABV__HEAVY_ARMOR,
					Parser.ITM_TYP_ABV__MEDIUM_ARMOR,
					Parser.ITM_TYP_ABV__LIGHT_ARMOR,
					Parser.ITM_TYP_ABV__SHIELD,
				].includes(abbreviation);
			})
			.forEach(item => {
				const lowName = item.name.toLowerCase();
				const isClassicSource = SourceUtil.isClassicSource(item.source);

				const noArmorName = handleBaseName({item, lowName, isClassicSource});

				handlePlusName({item, lowName, isClassicSource});
				handlePlusName({item, lowName: noArmorName, isClassicSource});
			});
	}
}

/** @abstract */
class _CreatureImmunityResistanceVulnerabilityConverterBase {
	static _modProp;

	static _getCleanIpt ({ipt}) {
		return ipt
			.replace(/^none\b/i, "") // Thanks.
			.replace(/\.+\s*$/, "")
			.trim()
		;
	}

	static _getSplitInput ({ipt}) {
		return ipt
			// Split e.g.
			// "Bludgeoning and Piercing from nonmagical attacks, Acid, Fire, Lightning"
			.split(/(.*\b(?:from|by)\b[^,;.!?]+)(?:[,;] ?)?/gi)
			.map(it => it.trim())
			.filter(Boolean)

			// Split e.g.
			// "poison; bludgeoning, piercing, and slashing from nonmagical attacks"
			.flatMap(pt => pt.split(";"))
			.map(it => it.trim())
			.filter(Boolean)
		;
	}

	/**
	 * @abstract
	 * @return {?object}
	 */
	static _getSpecialFromPart ({pt}) { throw new Error("Unimplemented!"); }

	static _getIxPreNote ({pt}) { return -1; }

	static _getUid (name) { return name.toLowerCase(); }

	static getParsed (ipt, opts) {
		ipt = this._getCleanIpt({ipt});
		if (!ipt) return null;

		let noteAll = null;
		if (ipt.startsWith("(") && ipt.endsWith(")")) {
			ipt = ipt
				.replace(/^\(([^)]+)\)$/, "$1")
				// Reflected in `TagImmResVulnConditional`
				.replace(/ (in .* form)$/i, (...m) => {
					noteAll = m[1];
					return "";
				});
		}

		const spl = this._getSplitInput({ipt});

		const out = [];

		spl
			.forEach(section => {
				let note = noteAll;
				let preNote;
				const newGroup = [];

				section
					.split(/,/g)
					.forEach(pt => {
						pt = pt.trim().replace(/^and /i, "").trim();

						const special = this._getSpecialFromPart({pt});
						if (special) return out.push(special);

						pt = pt.replace(/\((?:from|with|except) [^)]+\)$/i, (...m) => {
							if (note) throw new Error(`Already has note!`);
							note = m[0];
							return "";
						}).trim();

						pt = pt.replace(/(?:damage )?(?:from|during) [^)]+$/i, (...m) => {
							if (note) throw new Error(`Already has note!`);
							note = m[0];
							return "";
						}).trim();

						pt = pt.replace(/\bthat is nonmagical$/i, (...m) => {
							if (note) throw new Error(`Already has note!`);
							note = m[0];
							return "";
						}).trim();

						const ixPreNote = this._getIxPreNote({pt});
						if (ixPreNote > 0) {
							preNote = pt.slice(0, ixPreNote).trim();
							pt = pt.slice(ixPreNote).trim();
						}

						pt = pt.trim();
						if (!pt) return;

						pt
							.split(/ and /gi)
							.forEach(val => newGroup.push(val));
					});

				const newGroupOut = newGroup
					.map(it => this._getUid(it));

				if (note || preNote) {
					if (!newGroupOut.length) {
						out.push({special: [preNote, note].filter(Boolean).join(" ")});
						return;
					}

					const toAdd = {[this._modProp]: newGroupOut};
					if (preNote) toAdd.preNote = preNote;
					if (note) toAdd.note = note;
					out.push(toAdd);
					return;
				}

				// If there is no group metadata, flatten into the main array
				out.push(...newGroupOut);
			});

		return out;
	}
}

class _CreatureDamageImmunityResistanceVulnerabilityConverter extends _CreatureImmunityResistanceVulnerabilityConverterBase {
	static _getCleanIpt ({ipt}) {
		return super._getCleanIpt({ipt})
			// Handle parens used instead of commas (e.g. "Hobgoblin Smokebinder" from Flee, Mortals!)
			.replace(/(?:^|,? )\(([^)]+ in [^)]+ form)\)/gi, ", $1")
			// handle the case where a comma is mistakenly used instead of a semicolon
			.replace(/, (bludgeoning, piercing, and slashing from)/gi, "; $1")
		;
	}

	static _getSpecialFromPart ({pt}) {
		// region `"damage from spells"`
		const mDamageFromThing = /^damage from .*$/i.exec(pt);
		if (mDamageFromThing) return {special: pt};
		// endregion
	}

	static _getIxPreNote ({pt}) {
		return Math.min(...Parser.DMG_TYPES.map(it => pt.toLowerCase().indexOf(it)).filter(ix => ~ix));
	}
}

export class CreatureDamageVulnerabilityConverter extends _CreatureDamageImmunityResistanceVulnerabilityConverter {
	static _modProp = "vulnerable";
}

export class CreatureDamageResistanceConverter extends _CreatureDamageImmunityResistanceVulnerabilityConverter {
	static _modProp = "resist";
}

export class CreatureDamageImmunityConverter extends _CreatureDamageImmunityResistanceVulnerabilityConverter {
	static _modProp = "immune";
}

export class CreatureConditionImmunityConverter extends _CreatureImmunityResistanceVulnerabilityConverterBase {
	static _modProp = "conditionImmune";

	static _getSpecialFromPart ({pt}) { return null; }

	static _getUid (name) {
		return TagCondition.getConditionUid(name);
	}
}

export class TagCreatureSubEntryInto {
	static _PROPS = ["action", "reaction", "bonus", "trait", "legendary", "mythic", "variant"];
	static _MAP = {
		"melee weapon attack:": "{@atk mw}",
		"ranged weapon attack:": "{@atk rw}",
		"melee attack:": "{@atk m}",
		"ranged attack:": "{@atk r}",
		"area attack:": "{@atk a}",
		"area weapon attack:": "{@atk aw}",
		"melee spell attack:": "{@atk ms}",
		"melee or ranged weapon attack:": "{@atk mw,rw}",
		"ranged spell attack:": "{@atk rs}",
		"melee or ranged spell attack:": "{@atk ms,rs}",
		"melee or ranged attack:": "{@atk m,r}",
		"melee power attack:": "{@atk mp}",
		"ranged power attack:": "{@atk rp}",
		"melee or ranged power attack:": "{@atk mp,rp}",
		"melee attack roll:": "{@atkr m}",
		"ranged attack roll:": "{@atkr r}",
		"melee or ranged attack roll:": "{@atkr m,r}",
	};

	static _WALKER = null;

	static tryRun (m, cbMan) {
		this._PROPS.forEach(prop => this._handleProp({m, prop, cbMan}));
	}

	static _handleProp ({m, prop, cbMan}) {
		if (!m[prop]) return;

		this._WALKER ||= MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		m[prop]
			.forEach(it => {
				if (!it.entries) return;

				it.entries = this._WALKER.walk(
					it.entries,
					{
						string: (str) => {
							return str
								// "Trigger: ..."
								.replace(/^(Trigger:)(?= )/g, (...m) => `{@actTrigger}`)
								// "Response: ..."
								.replace(/(?<=^|[.!?;] )(Response:)(?= )/g, (...m) => `{@actResponse}`)
								.replace(/(?<=^|[.!?;] )(Response[-\u2012-\u2014])(?=[A-Z])/g, (...m) => `{@actResponse d}`)

								// "Melee Weapon Attack: ..."
								// "Melee Attack Roll: ..."
								.replace(/^(?<text>(?:(?:[A-Z][a-z]*|or) )*Attack(?: Roll)?:)(?= )/g, (...m) => {
									const {text} = m.at(-1);
									const lower = text.toLowerCase();

									if (this._MAP[lower]) return this._MAP[lower];

									if (cbMan) cbMan(text);

									return m[0];
								})
								// "Strength Saving Throw: ..."
								.replace(/((?<abil>Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:)(?= )/g, (...m) => {
									const {abil} = m.at(-1);
									return `{@actSave ${abil.toLowerCase().slice(0, 3)}}`;
								})
								// "Failure or Success: ..."
								.replace(/(?<=^|[.!?;] )(Failure or Success:)(?= )/g, (...m) => `{@actSaveSuccessOrFail}`)
								.replace(/(?<=^|[.!?;] )(Success or Failure:)(?= )/g, (...m) => `{@actSaveSuccessOrFail}`)
								// "Success: ..."
								.replace(/(?<=^|[.!?;] )(Success:)(?= )/g, (...m) => `{@actSaveSuccess}`)
								// "Failure: ..."
								.replace(/(?<=^|[.!?;] )(?<ordinal>First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth) (?:Failure:)(?= )/g, (...m) => {
									return `{@actSaveFail ${Parser.textToNumber(m.at(-1).ordinal)}}`;
								})
								.replace(/(?<=^|[.!?;] )(Failure:)(?= )/g, (...m) => `{@actSaveFail}`)
							;
						},
					},
				);
			});
	}
}

export class TagHit {
	static tryTagHits (m) {
		TagHit._PROPS.forEach(prop => this._handleProp({m, prop}));
	}

	static _handleProp ({m, prop}) {
		if (!m[prop]) return;

		m[prop]
			.forEach(it => {
				if (!it.entries) return;

				const str = JSON.stringify(it.entries, null, "\t");
				const out = str
					.replace(/Hit or Miss: /g, "{@hom}")
					.replace(/Miss or Hit: /g, "{@hom}")
					.replace(/Hit: /g, "{@h}")
					.replace(/Miss: /g, "{@m}")
				;
				it.entries = JSON.parse(out);
			});
	}
}
TagHit._PROPS = ["action", "reaction", "bonus", "trait", "legendary", "mythic", "variant"];

export class TagDc {
	static tryTagDcs (m) {
		TagDc._PROPS.forEach(prop => this._handleProp({m, prop}));
	}

	static _handleProp ({m, prop}) {
		if (!m[prop]) return;

		m[prop] = m[prop]
			.map(it => {
				const str = JSON.stringify(it, null, "\t");
				const out = str.replace(/DC (\d+)(\s+plus PB|\s*\+\s*PB)?/g, "{@dc $1$2}");
				return JSON.parse(out);
			});
	}
}
TagDc._PROPS = ["action", "reaction", "bonus", "trait", "legendary", "mythic", "variant", "spellcasting"];

export class AlignmentConvert {
	static tryConvertAlignment (stats, cbMan) {
		const {alignmentPrefix, alignment} = AlignmentUtil.tryGetConvertedAlignment(stats.alignment, {cbMan});

		stats.alignment = alignment;
		if (!stats.alignment) delete stats.alignment;

		stats.alignmentPrefix = alignmentPrefix;
		if (!stats.alignmentPrefix) delete stats.alignmentPrefix;
	}
}

export class TraitActionTag {
	static _TAGS = { // true = map directly; string = map to this string
		trait: {
			"turn immunity": "Turn Immunity",
			"brute": "Brute",
			"antimagic susceptibility": "Antimagic Susceptibility",
			"sneak attack": "Sneak Attack",
			"reckless": "Reckless",
			"web sense": "Web Sense",
			"flyby": "Flyby",
			"pounce": "Pounce",
			"water breathing": "Water Breathing",

			"turn resistance": "Turn Resistance",
			"turn defiance": "Turn Resistance",
			"turning defiance": "Turn Resistance",
			"turn resistance aura": "Turn Resistance",
			"undead fortitude": "Undead Fortitude",

			"aggressive": "Aggressive",
			"illumination": "Illumination",
			"rampage": "Rampage",
			"rejuvenation": "Rejuvenation",
			"web walker": "Web Walker",
			"incorporeal movement": "Incorporeal Movement",
			"incorporeal passage": "Incorporeal Movement",

			"keen hearing and smell": "Keen Senses",
			"keen sight and smell": "Keen Senses",
			"keen hearing and sight": "Keen Senses",
			"keen hearing": "Keen Senses",
			"keen smell": "Keen Senses",
			"keen senses": "Keen Senses",

			"hold breath": "Hold Breath",

			"charge": "Charge",

			"fey ancestry": "Fey Ancestry",

			"siege monster": "Siege Monster",

			"pack tactics": "Pack Tactics",

			"regeneration": "Regeneration",
			"fiendish regeneration": "Regeneration",
			"heat regeneration": "Regeneration",
			"cold regeneration": "Regeneration",

			"shapechanger": "Shapechanger",

			"false appearance": "False Appearance",

			"spider climb": "Spider Climb",

			"sunlight sensitivity": "Sunlight Sensitivity",
			"sunlight hypersensitivity": "Sunlight Sensitivity",
			"light sensitivity": "Light Sensitivity",
			"vampire weaknesses": "Sunlight Sensitivity",

			"amphibious": "Amphibious",

			"legendary resistance": "Legendary Resistances",

			"magic weapon": "Magic Weapons",
			"magic weapons": "Magic Weapons",

			"magic resistance": "Magic Resistance",

			"spell immunity": "Spell Immunity",

			"ambush": "Ambusher",
			"ambusher": "Ambusher",

			"amorphous": "Amorphous",
			"amorphous form": "Amorphous",

			"death burst": "Death Burst",
			"death throes": "Death Burst",

			"devil's sight": "Devil's Sight",
			"devil sight": "Devil's Sight",

			"immutable form": "Immutable Form",

			"tree stride": "Tree Stride",

			"unusual nature": "Unusual Nature",

			"tunneler": "Tunneler",

			"beast of burden": "Beast of Burden",

			"mimicry": "Mimicry",
		},
		_other: {
			"multiattack": "Multiattack",
			"frightful presence": "Frightful Presence",
			"teleport": "Teleport",
			"swallow": "Swallow",
			"tentacle": "Tentacles",
			"tentacles": "Tentacles",
			"change shape": "Shapechanger",
			"parry": "Parry",
		},
	};

	static _TAGS_DEEP = {
		trait: {},
		_other: {
			"Swallow": strEntries => /\bswallowed\b/i.test(strEntries),
		},
	};

	static _doAdd ({tags, tag, allowlist}) {
		if (allowlist && !allowlist.has(tag)) return;
		tags.add(tag);
	}

	static _doTag ({m, cbMan, prop, tags, allowlist}) {
		if (!m[prop]) return;

		const lookup = this._TAGS[prop] || this._TAGS._other;

		m[prop]
			.forEach(t => {
				if (!t.name) return;
				t.name = t.name.trim();

				const cleanName = Renderer.stripTags(t.name)
					.toLowerCase()
					.replace(/\([^)]+\)/g, "") // Remove parentheses
					.trim();

				const mapped = lookup[cleanName];
				if (mapped) {
					if (mapped === true) return this._doAdd({tags, tag: t.name, allowlist});
					return this._doAdd({tags, tag: mapped, allowlist});
				}

				if (this._isTraits(prop)) {
					if (cleanName.startsWith("keen ")) return this._doAdd({tags, tag: "Keen Senses", allowlist});
					if (cleanName.endsWith(" absorption")) return this._doAdd({tags, tag: "Damage Absorption", allowlist});
					if (cleanName.endsWith(" camouflage")) return this._doAdd({tags, tag: "Camouflage", allowlist});
				}

				if (this._isActions(prop)) {
					if (/\bbreath\b/.test(cleanName)) return this._doAdd({tags, tag: "Breath Weapon", allowlist});
				}

				if (cbMan) cbMan(prop, tags, cleanName);
			});
	}

	static _doTagDeep ({m, prop, tags, allowlist}) {
		if (!m[prop]) return;

		const lookup = this._TAGS_DEEP[prop] || this._TAGS_DEEP._other;

		m[prop].forEach(t => {
			if (!t.entries) return;
			const strEntries = JSON.stringify(t.entries);

			Object.entries(lookup)
				.forEach(([tagName, fnShouldTag]) => {
					if (fnShouldTag(strEntries)) this._doAdd({tags, tag: tagName, allowlist});
				});
		});
	}

	static _isTraits (prop) { return prop === "trait"; }
	static _isActions (prop) { return prop === "action"; }

	static tryRun (m, {cbMan, allowlistTraitTags, allowlistActionTags} = {}) {
		const traitTags = new Set(m.traitTags || []);
		const actionTags = new Set(m.actionTags || []);

		this._doTag({m, cbMan, prop: "trait", tags: traitTags, allowlist: allowlistTraitTags});
		this._doTag({m, cbMan, prop: "action", tags: actionTags, allowlist: allowlistActionTags});
		this._doTag({m, cbMan, prop: "reaction", tags: actionTags, allowlist: allowlistActionTags});
		this._doTag({m, cbMan, prop: "bonus", tags: actionTags, allowlist: allowlistActionTags});

		this._doTagDeep({m, prop: "action", tags: actionTags, allowlist: allowlistActionTags});

		if (traitTags.size) m.traitTags = [...traitTags].sort(SortUtil.ascSortLower);
		if (actionTags.size) m.actionTags = [...actionTags].sort(SortUtil.ascSortLower);
	}
}

export class LanguageTag {
	/**
	 * @param m A creature statblock.
	 * @param [opt] Options object.
	 * @param [opt.cbAll] Callback to run on every parsed language.
	 * @param [opt.cbTracked] Callback to run on every tracked language.
	 * @param [opt.isAppendOnly] If tags should only be added, not removed.
	 */
	static tryRun (m, opt) {
		opt = opt || {};

		const tags = new Set();

		if (m.languages) {
			m.languages = m.languages.map(it => it.trim()).filter(it => !TagUtil.isNoneOrEmpty(it));
			if (!m.languages.length) {
				delete m.languages;
				return;
			} else {
				m.languages = m.languages.map(it => it.replace(/but can(not|'t) speak/ig, "but can't speak"));
			}

			m.languages.forEach(l => {
				if (opt.cbAll) opt.cbAll(l);

				Object.keys(LanguageTag.LANGUAGE_MAP).forEach(k => {
					const v = LanguageTag.LANGUAGE_MAP[k];

					const re = new RegExp(`(^|[^-a-zA-Z])${k}([^-a-zA-Z]|$)`, "g");

					if (re.exec(l)) {
						if ((v === "XX" || v === "X") && (l.includes("knew in life") || l.includes("spoke in life"))) return;
						if (v !== "CS" && /(one|the) languages? of its creator/i.exec(l)) return;

						if (opt.cbTracked) opt.cbTracked(v);
						tags.add(v);
					}
				});
			});
		}

		if (tags.size) {
			if (!opt.isAppendOnly) m.languageTags = [...tags];
			else {
				(m.languageTags || []).forEach(t => tags.add(t));
				m.languageTags = [...tags];
			}
		} else if (!opt.isAppendOnly) delete m.languageTags;
	}
}
LanguageTag.LANGUAGE_MAP = {
	"Abyssal": "AB",
	"Aquan": "AQ",
	"Auran": "AU",
	"Celestial": "CE",
	"Common": "C",
	"can't speak": "CS",
	"Draconic": "DR",
	"Dwarvish": "D",
	"Elvish": "E",
	"Giant": "GI",
	"Gnomish": "G",
	"Goblin": "GO",
	"Halfling": "H",
	"Infernal": "I",
	"Orc": "O",
	"Primordial": "P",
	"Sylvan": "S",
	"Terran": "T",
	"Undercommon": "U",
	"Aarakocra": "OTH",
	"one additional": "X",
	"Blink Dog": "OTH",
	"Bothii": "OTH",
	"Bullywug": "OTH",
	"one other language": "X",
	"plus six more": "X",
	"plus two more languages": "X",
	"up to five other languages": "X",
	"Druidic": "DU",
	"Giant Eagle": "OTH",
	"Giant Elk": "OTH",
	"Giant Owl": "OTH",
	"Gith": "GTH",
	"Grell": "OTH",
	"Grung": "OTH",
	"Homarid": "OTH",
	"Hook Horror": "OTH",
	"Ice Toad": "OTH",
	"Ixitxachitl": "OTH",
	"Kruthik": "OTH",
	"Netherese": "OTH",
	"Olman": "OTH",
	"Otyugh": "OTH",
	"Primal": "OTH",
	"Sahuagin": "OTH",
	"Sphinx": "OTH",
	"Thayan": "OTH",
	"Thri-kreen": "OTH",
	"Tlincalli": "OTH",
	"Troglodyte": "OTH",
	"Umber Hulk": "OTH",
	"Vegepygmy": "OTH",
	"Winter Wolf": "OTH",
	"Worg": "OTH",
	"Yeti": "OTH",
	"Yikaria": "OTH",
	"all": "XX",
	"all but rarely speaks": "XX",
	"any one language": "X",
	"any two languages": "X",
	"any three languages": "X",
	"any four languages": "X",
	"any five languages": "X",
	"any six languages": "X",
	"one language of its creator's choice": "X",
	"two other languages": "X",
	"telepathy": "TP",
	"thieves' cant": "TC",
	"Thieves' cant": "TC",
	"Deep Speech": "DS",
	"Gnoll": "OTH",
	"Ignan": "IG",
	"Modron": "OTH",
	"Slaad": "OTH",
	"all languages": "XX",
	"any language": "X",
	"knew in life": "LF",
	"spoke in life": "LF",
};

export class SenseFilterTag {
	static tryRun (m, cbAll) {
		if (m.senses) {
			m.senses = m.senses.filter(it => !TagUtil.isNoneOrEmpty(it));
			if (!m.senses.length) delete m.senses;
			else {
				const senseTags = new Set();
				m.senses.map(it => it.trim().toLowerCase())
					.forEach(s => {
						Object.entries(SenseFilterTag.TAGS).forEach(([k, v]) => {
							if (s.includes(k)) {
								if (v === "D" && /\d\d\d ft/.exec(s)) senseTags.add("SD");
								else senseTags.add(v);
							}
						});

						if (cbAll) cbAll(s);
					});

				if (senseTags.size === 0) delete m.senseTags;
				else m.senseTags = [...senseTags];
			}
		} else delete m.senseTags;
	}
}
SenseFilterTag.TAGS = {
	"blindsight": "B",
	"darkvision": "D",
	"tremorsense": "T",
	"truesight": "U",
};

export class SpellcastingTypeTag {
	static tryRun (m, cbAll) {
		if (!m.spellcasting) {
			delete m.spellcastingTags;
		} else {
			const tags = new Set();
			m.spellcasting.forEach(sc => {
				if (!sc.name) return;

				let isAdded = false;

				if (/(^|[^a-zA-Z])psionics([^a-zA-Z]|$)/gi.exec(sc.name)) { tags.add("P"); isAdded = true; }
				if (/(^|[^a-zA-Z])innate([^a-zA-Z]|$)/gi.exec(sc.name)) { tags.add("I"); isAdded = true; }
				if (/(^|[^a-zA-Z])form([^a-zA-Z]|$)/gi.exec(sc.name)) { tags.add("F"); isAdded = true; }
				if (/(^|[^a-zA-Z])shared([^a-zA-Z]|$)/gi.exec(sc.name)) { tags.add("S"); isAdded = true; }

				if (sc.headerEntries) {
					const strHeader = JSON.stringify(sc.headerEntries);
					Object.entries(SpellcastingTypeTag.CLASSES).forEach(([tag, regex]) => {
						regex.lastIndex = 0;
						const match = regex.exec(strHeader);
						if (match) {
							tags.add(tag);
							isAdded = true;
							if (cbAll) cbAll(match[0]);
						}
					});
				}

				if (!isAdded) tags.add("O");

				if (cbAll) cbAll(sc.name);
			});
			if (tags.size) m.spellcastingTags = [...tags];
			else delete m.spellcastingTags;
		}
	}
}
SpellcastingTypeTag.CLASSES = {
	"CA": /(^|[^a-zA-Z])artificer([^a-zA-Z]|$)/gi,
	"CB": /(^|[^a-zA-Z])bard([^a-zA-Z]|$)/gi,
	"CC": /(^|[^a-zA-Z])cleric([^a-zA-Z]|$)/gi,
	"CD": /(^|[^a-zA-Z])druid([^a-zA-Z]|$)/gi,
	"CP": /(^|[^a-zA-Z])paladin([^a-zA-Z]|$)/gi,
	"CR": /(^|[^a-zA-Z])ranger([^a-zA-Z]|$)/gi,
	"CS": /(^|[^a-zA-Z])sorcerer([^a-zA-Z]|$)/gi,
	"CL": /(^|[^a-zA-Z])warlock([^a-zA-Z]|$)/gi,
	"CW": /(^|[^a-zA-Z])wizard([^a-zA-Z]|$)/gi,
};

/** @abstract */
class _PrimaryLegendarySpellsTaggerBase {
	static _IS_INIT = false;
	static _WALKER = null;

	static _PROP_PRIMARY;
	static _PROP_SPELLS;
	static _PROP_LEGENDARY;

	static _BLOCKLIST_NAMES = null;

	static _init () {
		if (this._IS_INIT) return true;
		this._IS_INIT = true;
		this._WALKER = MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});
		return false;
	}

	/**
	 * @abstract
	 * @return void
	 */
	static _handleString ({m = null, str, outSet}) {
		throw new Error("Unimplemented!");
	}

	static _handleEntries ({m = null, entries, outSet}) {
		this._WALKER.walk(
			entries,
			{
				string: (str) => this._handleString({m, str, outSet}),
			},
		);
	}

	static _handleProp ({m, prop, outSet}) {
		if (!m[prop]) return;

		m[prop].forEach(it => {
			if (
				it.name
				&& this._BLOCKLIST_NAMES
				&& this._BLOCKLIST_NAMES.has(it.name.toLowerCase().trim().replace(/\([^)]+\)/g, ""))
			) return;

			if (!it.entries) return;

			this._handleEntries({m, entries: it.entries, outSet});
		});
	}

	static _setPropOut (
		{
			outSet,
			m,
			propOut,
			isAppendOnly,
		},
	) {
		if (!isAppendOnly) delete m[propOut];
		if (!outSet.size) return;
		m[propOut] = [...outSet].sort(SortUtil.ascSortLower);
	}

	static tryRun (m, {isAppendOnly = false} = {}) {
		this._init();

		const outSet = new Set();
		Renderer.monster.CHILD_PROPS
			.filter(prop => prop !== "spellcasting")
			.forEach(prop => this._handleProp({m, prop, outSet}));

		this._setPropOut({outSet, m, propOut: this._PROP_PRIMARY, isAppendOnly});
	}

	/**
	 * @abstract
	 * @return void
	 */
	static _handleSpell ({spell, outSet}) {
		throw new Error("Unimplemented!");
	}

	static tryRunSpells (m, {cbMan, isAppendOnly = false} = {}) {
		if (!m.spellcasting) return;

		this._init();

		const outSet = new Set();

		const spells = TaggerUtils.getSpellsFromString(JSON.stringify(m.spellcasting), {cbMan});

		spells.forEach(spell => this._handleSpell({spell, outSet}));

		this._setPropOut({outSet, m, propOut: this._PROP_SPELLS, isAppendOnly});
	}

	static tryRunRegionalsLairs (m, {cbMan, isAppendOnly = false} = {}) {
		if (!m.legendaryGroup) return;

		this._init();

		const meta = TaggerUtils.findLegendaryGroup({name: m.legendaryGroup.name, source: m.legendaryGroup.source});
		if (!meta) return;

		const outSet = new Set();
		this._handleEntries({entries: meta, outSet});

		// region Also add from spells contained in the legendary group
		const spells = TaggerUtils.getSpellsFromString(JSON.stringify(meta), {cbMan});
		spells.forEach(spell => this._handleSpell({spell, outSet}));
		// endregion

		this._setPropOut({outSet, m, propOut: this._PROP_LEGENDARY, isAppendOnly});
	}

	/** Attempt to detect an e.g. TCE summon creature. */
	static _isSummon (m) {
		if (!m) return false;

		let isSummon = false;

		const reProbableSummon = /level of the spell|spell level|\+\s*PB(?:\W|$)|your (?:[^?!.]+)?level/g;

		this._WALKER.walk(
			m.ac,
			{
				string: (str) => {
					if (isSummon) return;
					if (reProbableSummon.test(str)) isSummon = true;
				},
			},
		);
		if (isSummon) return true;

		this._WALKER.walk(
			m.hp,
			{
				string: (str) => {
					if (isSummon) return;
					if (reProbableSummon.test(str)) isSummon = true;
				},
			},
		);
		if (isSummon) return true;
	}
}

export class DamageTypeTag extends _PrimaryLegendarySpellsTaggerBase {
	static _PROP_PRIMARY = "damageTags";
	static _PROP_LEGENDARY = "damageTagsLegendary";
	static _PROP_SPELLS = "damageTagsSpell";

	// Avoid parsing these, as they commonly have e.g. "self-damage" sections
	//   Note that these names should exclude parenthetical parts (as these are removed before lookup)
	static _BLOCKLIST_NAMES = new Set([
		"vampire weaknesses",
	]);

	static _init () {
		if (super._init()) return;
		Object.entries(Parser.DMGTYPE_JSON_TO_FULL).forEach(([k, v]) => this._TYPE_LOOKUP[v] = k);
	}

	static _handleString ({m = null, str, outSet}) {
		str.replace(RollerUtil.REGEX_DAMAGE_DICE, (m0, average, prefix, diceExp, suffix) => {
			suffix.replace(ConverterConst.RE_DAMAGE_TYPE, (m0, type) => outSet.add(this._TYPE_LOOKUP[type.toLowerCase()]));
		});

		str.replace(this._STATIC_DAMAGE_REGEX, (m0, type) => {
			outSet.add(this._TYPE_LOOKUP[type.toLowerCase()]);
		});

		str.replace(this._TARGET_TASKES_DAMAGE_REGEX, (m0, type) => {
			outSet.add(this._TYPE_LOOKUP[type.toLowerCase()]);
		});

		if (this._isSummon(m)) {
			str.split(/[.?!]/g)
				.forEach(sentence => {
					let isSentenceMatch = this._SUMMON_DAMAGE_REGEX.test(sentence);
					if (!isSentenceMatch) return;

					sentence.replace(ConverterConst.RE_DAMAGE_TYPE, (m0, type) => {
						outSet.add(this._TYPE_LOOKUP[type.toLowerCase()]);
					});
				});
		}
	}

	static _handleSpell ({spell, outSet}) {
		if (!spell.damageInflict) return;
		spell.damageInflict.forEach(it => outSet.add(DamageTypeTag._TYPE_LOOKUP[it]));
	}
}
DamageTypeTag._STATIC_DAMAGE_REGEX = new RegExp(`\\d+ ${ConverterConst.STR_RE_DAMAGE_TYPE} damage`, "gi");
DamageTypeTag._TARGET_TASKES_DAMAGE_REGEX = new RegExp(`(?:a|the) target takes (?:{@dice |{@damage )[^}]+} ?${ConverterConst.STR_RE_DAMAGE_TYPE} damage`, "gi");
DamageTypeTag._SUMMON_DAMAGE_REGEX = /(?:{@dice |{@damage )[^}]+}(?:\s*\+\s*the spell's level)? ([a-z]+( \([-a-zA-Z0-9 ]+\))?( or [a-z]+( \([-a-zA-Z0-9 ]+\))?)? damage)/gi;
DamageTypeTag._TYPE_LOOKUP = {};

export class MiscTag {
	static _MELEE_WEAPON_MATCHERS = null;
	static _RANGED_WEAPON_MATCHERS = null;
	static _THROWN_WEAPON_MATCHERS = null;

	static _IS_INIT = false;
	static _WALKER = null;

	static init ({items}) {
		if (this._IS_INIT) return;
		this._IS_INIT = true;

		this._WALKER = MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		const weaponsBase = items
			.filter(it => it._category === "Basic" && it.type && [Parser.ITM_TYP_ABV__MELEE_WEAPON, Parser.ITM_TYP_ABV__RANGED_WEAPON].includes(DataUtil.itemType.unpackUid(it.type).abbreviation));

		this._MELEE_WEAPON_MATCHERS = weaponsBase
			.filter(it => it.type && DataUtil.itemType.unpackUid(it.type).abbreviation === Parser.ITM_TYP_ABV__MELEE_WEAPON)
			.map(it => new RegExp(`(^|\\W)(${it.name.escapeRegexp()})(\\W|$)`, "gi"));

		this._RANGED_WEAPON_MATCHERS = weaponsBase
			.filter(it => it.type && DataUtil.itemType.unpackUid(it.type).abbreviation === Parser.ITM_TYP_ABV__RANGED_WEAPON)
			.map(it => new RegExp(`(^|\\W)(${it.name.escapeRegexp()})(\\W|$)`, "gi"));

		this._THROWN_WEAPON_MATCHERS = weaponsBase
			.filter(it => (it.property || []).some(property => DataUtil.itemProperty.unpackUid(property?.uid || property).abbreviation === Parser.ITM_PROP_ABV__THROWN))
			.map(it => new RegExp(`(^|\\W)(${it.name.escapeRegexp()})(\\W|$)`, "gi"));
	}

	/* -------------------------------------------- */

	/** @return empty string for easy use in `.replace` */
	static _addTag ({tagSet, allowlistTags, tag}) {
		if (allowlistTags != null && !allowlistTags.has(tag)) return "";
		tagSet.add(tag);
		return "";
	}

	/* -------------------------------------------- */

	static _handleProp ({m, prop, tagSet, allowlistTags}) {
		if (!m[prop]) return;

		m[prop].forEach(subEntry => {
			this._handleProp_attacks({subEntry, tagSet, allowlistTags});
			this._handleProp_curse({subEntry, tagSet, allowlistTags});
			this._handleProp_disease({subEntry, tagSet, allowlistTags});
			this._handleProp_other({subEntry, tagSet, allowlistTags});
		});
	}

	/* --------------------- */

	static _handleProp_attacks (
		{
			subEntry,
			tagSet,
			allowlistTags,
		},
	) {
		let hasRangedAttack = false;

		// Weapon attacks
		this._WALKER.walk(
			subEntry.entries,
			{
				string: (str) => {
					// - any melee/ranged attack
					str
						.replace(/{@(?<tag>atkr?) (?<text>[^}]+)}/g, (...mx) => {
							const {tag, text} = mx.at(-1);
							const spl = text.split(",");

							if (spl.includes("rw")) {
								this._addTag({tagSet, allowlistTags, tag: "RW"});
								hasRangedAttack = true;
							} else if (spl.some(it => it.includes("r"))) {
								this._addTag({tagSet, allowlistTags, tag: "RA"});
								hasRangedAttack = true;
							}

							if (spl.includes("mw")) this._addTag({tagSet, allowlistTags, tag: "MW"});
							else if (spl.some(it => it.includes("m"))) this._addTag({tagSet, allowlistTags, tag: "MA"});
						});

					// - reach
					str
						.replace(/reach (\d+) ft\./g, (...m) => {
							if (Number(m[1]) > 5) this._addTag({tagSet, allowlistTags, tag: "RCH"});
						});
				},
			},
		);

		if (!subEntry.name) return;

		// Melee weapons
		// Ranged weapon
		[
			{res: this._MELEE_WEAPON_MATCHERS, tag: "MLW"},
			{res: this._RANGED_WEAPON_MATCHERS, tag: "RNG"},
		]
			.forEach(({res, tag}) => {
				res
					.forEach(re => {
						if (!re.test(subEntry.name)) return;

						this._WALKER.walk(
							subEntry.entries,
							{
								string: (str) => {
									const mAtk = /{@atkr? ([^}]+)}/.exec(str || "");
									if (mAtk) {
										const spl = mAtk[1].split(",");
										// Avoid adding the "ranged attack" tag for spell attacks
										if (spl.includes("rs")) return "";
									}
									this._addTag({tagSet, allowlistTags, tag});
									return "";
								},
							},
						);
					});
			});

		// Thrown weapon
		if (hasRangedAttack) this._THROWN_WEAPON_MATCHERS.forEach(r => subEntry.name.replace(r, () => this._addTag({tagSet, allowlistTags, tag: "THW"})));
	}

	/* --------------------- */

	static _handleProp_curse (
		{
			subEntry,
			tagSet,
			allowlistTags,
		},
	) {
		this._WALKER.walk(
			subEntry.entries,
			{
				string: (str) => {
					const strClean = str
						.replace(/{@spell bestow curse[^}]+}/gi, " - ") // Ignore the spell; it already has a dedicated filter
					;

					const isCurseLine = /\bbe(?:comes)? cursed\b/.test(strClean)
						|| /\bis cursed\b/.test(strClean)
					;

					if (!isCurseLine) return;

					// Treat "curses" with limited durations as generic combat effects, rather than real curses
					const isLimitedDuration = /\bfor \d+ (turn|round|minute)s?\b/i.test(strClean)
						|| /\bfor 1 hour\b/i.test(strClean) // Consider e.g. "24 hours" sufficient time
						|| /\bnext turn\b/i.test(strClean)
					;

					if (isLimitedDuration) return false;

					this._addTag({tagSet, allowlistTags, tag: "CUR"});
				},
			},
		);
	}

	/* --------------------- */

	static _RES_DISEASE = [
		/\bbecome diseased\b/i,
		/\binfected with a disease\b/i,

		/\binfected with the [^.!?]+ disease\b/i,

		/\bsuffer the [^.!?]+ disease\b/i,

		/\bcontract a disease\b/i,
		/\bcontract the [^.!?]+ disease\b/i,

		/\bsaving throw against disease\b/i,

		/\bany effect that cures disease\b/i,
		/\buntil the disease is cured\b/i,
	];

	static _handleProp_disease (
		{
			subEntry,
			tagSet,
			allowlistTags,
		},
	) {
		this._WALKER.walk(
			subEntry.entries,
			{
				string: (str) => {
					if (this._RES_DISEASE.some(re => re.test(str))) this._addTag({tagSet, allowlistTags, tag: "DIS"});
				},
			},
		);
	}

	/* --------------------- */

	static _handleProp_other (
		{
			subEntry,
			tagSet,
			allowlistTags,
		},
	) {
		this._WALKER.walk(
			subEntry.entries,
			{
				string: (str) => {
					// AoE effects
					str.replace(/\d+-foot[- ](line|cube|cone|emanation|radius|sphere|hemisphere|cylinder)/g, () => this._addTag({tagSet, allowlistTags, tag: "AOE"}));
					str.replace(/each creature within \d+ feet/gi, () => this._addTag({tagSet, allowlistTags, tag: "AOE"}));

					// Hit point max reduction
					str.replace(/\bhit point maximum is reduced\b/gi, () => this._addTag({tagSet, allowlistTags, tag: "HPR"}));
				},
			},
		);
	}

	/* -------------------------------------------- */

	static tryRun (m, {isAdditiveOnly = false, allowlistTags = null} = {}) {
		const tagSet = new Set(isAdditiveOnly ? m.miscTags || [] : []);
		MiscTag._handleProp({m, prop: "action", tagSet, allowlistTags});
		MiscTag._handleProp({m, prop: "trait", tagSet, allowlistTags});
		MiscTag._handleProp({m, prop: "reaction", tagSet, allowlistTags});
		MiscTag._handleProp({m, prop: "bonus", tagSet, allowlistTags});
		MiscTag._handleProp({m, prop: "legendary", tagSet, allowlistTags});
		MiscTag._handleProp({m, prop: "mythic", tagSet, allowlistTags});
		if (tagSet.size) m.miscTags = [...tagSet];
		else if (!isAdditiveOnly) delete m.miscTags;
	}
}

export class SpellcastingTraitConvert {
	static _SPELL_SRC_MAP = {};
	static _SPELL_SRC_MAP_CLASSIC = {};
	static SPELL_SRD_MAP = {};

	static init (spellData) {
		spellData.forEach(sp => {
			this._SPELL_SRC_MAP[sp.name.toLowerCase()] = sp.source;
			if (SourceUtil.isClassicSource(sp.source)) this._SPELL_SRC_MAP_CLASSIC[sp.name.toLowerCase()] = sp.source;

			if (typeof sp.srd === "string") this.SPELL_SRD_MAP[sp.srd.toLowerCase()] = sp.name;
			if (typeof sp.srd52 === "string") this.SPELL_SRD_MAP[sp.srd52.toLowerCase()] = sp.name;
		});
	}

	static tryParseSpellcasting (ent, {isMarkdown, cbMan, cbErr, prop, displayAs, actions, reactions, styleHint}) {
		const spellcastingEntry = {
			"name": ent.name,
			"type": "spellcasting",
			"headerEntries": [],
		};

		const [entHeaderInput, ...entsRestInput] = ent.entries;

		spellcastingEntry.headerEntries.push(
			this._getFirstHeaderEntry({entName: ent.name, entHeaderInput, cbMan, prop, spellcastingEntry, styleHint}),
		);

		let hasAnyHeader = false;
		entsRestInput
			.forEach(line => {
				line = line.replace(/,\s*\*/g, ",*"); // put asterisks on the correct side of commas

				const entFaux = {entries: [line]};
				const propPathUsage = this.getMutUsagePropPath({entry: entFaux, prop});
				if (propPathUsage) {
					line = entFaux.entries[0];

					const value = this._getParsedSpells({line, styleHint});

					MiscUtil.getOrSet(spellcastingEntry, ...propPathUsage, value);

					return;
				}

				if (/^Constant(?::| -) /.test(line)) {
					hasAnyHeader = true;
					spellcastingEntry.constant = this._getParsedSpells({line, isMarkdown, styleHint});
					return;
				}

				if (/^At[- ][Ww]ill(?::| -) /.test(line)) {
					hasAnyHeader = true;
					spellcastingEntry.will = this._getParsedSpells({line, isMarkdown, styleHint});
					return;
				}

				if (line.includes("Cantrip")) {
					hasAnyHeader = true;
					const value = this._getParsedSpells({line, isMarkdown, styleHint});
					if (!spellcastingEntry.spells) spellcastingEntry.spells = {"0": {"spells": []}};
					spellcastingEntry.spells["0"].spells = value;
					return;
				}

				if (/[- ][Ll]evel/.test(line) && /(?::| -) /.test(line)) {
					hasAnyHeader = true;
					let property = line.substring(0, 1);
					const allSpells = this._getParsedSpells({line, isMarkdown, styleHint});
					spellcastingEntry.spells = spellcastingEntry.spells || {};

					const out = {};
					if (line.includes(" slot")) {
						const mWarlock = /^(\d)..(?:[- ][Ll]evel)?-(\d)..[- ][Ll]evel \((\d) (\d)..[- ][Ll]evel slots?\)/.exec(line);
						if (mWarlock) {
							out.lower = parseInt(mWarlock[1]);
							out.slots = parseInt(mWarlock[3]);
							property = mWarlock[4];
						} else {
							const mSlots = /\((\d) slots?\)/.exec(line);
							if (!mSlots) throw new Error(`Could not find slot count!`);
							out.slots = parseInt(mSlots[1]);
						}
					}
					// add these last, to have nicer ordering
					out.spells = allSpells;

					spellcastingEntry.spells[property] = out;
					return;
				}

				if (hasAnyHeader) {
					(spellcastingEntry.footerEntries ||= []).push(this._parseToHit(line));
				} else {
					spellcastingEntry.headerEntries.push(this._parseToHit(line));
				}
			});

		SpellcastingTraitConvert.mutSpellcastingAbility(spellcastingEntry);
		SpellcastingTraitConvert._mutDisplayAs(spellcastingEntry, displayAs);

		this._addSplitOutSpells({spellcastingEntry, arrayOther: actions, styleHint});
		this._addSplitOutSpells({spellcastingEntry, arrayOther: reactions, styleHint});

		return spellcastingEntry;
	}

	static _getFirstHeaderEntry ({entName, entHeaderInput, cbMan, prop, spellcastingEntry, styleHint}) {
		const entFaux = {name: entName, type: "entries", entries: [entHeaderInput]};

		const usagePath = this.getMutUsagePropPath({entry: entFaux, prop})
			|| this.getMutUsagePropPath({entry: entFaux, prop});
		const usagePathRoot = usagePath?.[0];

		SpellTag.tryRunStrictCapsWords(entFaux, {styleHint});

		const [entHeaderInputTaggedCapsWords] = entFaux.entries;

		let line = this._parseToHit(entHeaderInputTaggedCapsWords);

		// If the caps-word tagger applied, assume it caught everything
		if (entHeaderInputTaggedCapsWords !== entHeaderInput) {
			entHeaderInputTaggedCapsWords
				.replace(/{@spell [^}]+}( \([^)]+\))?/g, (...m) => {
					if (!usagePath) {
						cbMan(`Found spell in header with no usage info: ${m[0]}`);
						return m[0];
					}

					MiscUtil.getOrSet(spellcastingEntry, ...usagePath, []).push(m[0]);

					const hidden = MiscUtil.getOrSet(spellcastingEntry, "hidden", []);
					if (!hidden.includes(usagePathRoot)) hidden.push(usagePathRoot);

					return m[0];
				});
			return line;
		}

		line = line
			.replace(/(?<ptPre>casts? (?:the )?)(?<ptSpellsRaw>[^.,?!:]+)(?<ptPost>\.| spell |at[ -]will)/g, (...m) => {
				const {ptPre, ptSpellsRaw, ptPost} = m.at(-1);

				const isWill = ptPost.toLowerCase().replace(/-/g, " ") === "at will";

				if (!usagePath && !isWill) {
					cbMan(`Found spell in header with no usage info: ${ptSpellsRaw}`);
					return m[0];
				}

				const ptSpellsOut = ptSpellsRaw
					.split(" and ")
					.map(sp => {
						const value = this._getParsedSpells({line: sp, styleHint});
						const hidden = MiscUtil.getOrSet(spellcastingEntry, "hidden", []);

						if (isWill) {
							const tgt = MiscUtil.getOrSet(spellcastingEntry, "will", []);
							tgt.push(...value);

							if (!hidden.includes("will")) hidden.push("will");
						} else {
							const tgt = MiscUtil.getOrSet(spellcastingEntry, ...usagePath, []);
							tgt.push(...value);

							if (!hidden.includes(usagePathRoot)) hidden.push(usagePathRoot);
						}

						return value.join(", ");
					})
					.join(" and ");

				return [
					ptPre,
					ptSpellsOut,
					ptPost,
				]
					.join(" ")
					.replace(/ +/g, " ");
			});

		return line;
	}

	/* -------------------------------------------- */

	static _USES_RE_INFOS_NAME = [
		{re: /(?<cnt>\d+)\/rest(?<ptEach> each)?/i, prop: "rest"},
		{re: /(?<cnt>\d+)\/day(?<ptEach> each)?/i, prop: "daily"},
		{re: /(?<cnt>\d+)\/week(?<ptEach> each)?/i, prop: "weekly"},
		{re: /(?<cnt>\d+)\/month(?<ptEach> each)?/i, prop: "monthly"},
		{re: /(?<cnt>\d+)\/year(?<ptEach> each)?/i, prop: "yearly"},
	];

	static _USES_RE_INFOS_ENTRY = this._USES_RE_INFOS_NAME
		.map(({re, prop}) => ({re: new RegExp(`^${re.source}`, "i"), prop}));

	static _getReFrequencyMatchMeta ({res, str}) {
		const metasPerDurationName = res
			.map(({re, prop}) => ({m: re.exec(str), prop}))
			.filter(({m}) => !!m);

		if (metasPerDurationName.length) {
			// Arbitrarily pick the first
			const [metaPerDuration] = metasPerDurationName;

			const propPer = `${metaPerDuration.m.groups.cnt}${metaPerDuration.m.groups.ptEach ? "e" : ""}`;

			return {propPath: [metaPerDuration.prop, propPer], length: metaPerDuration.m.length};
		}

		return null;
	}

	static getMutUsagePropPath ({entry, prop}) {
		return this._getMutUsagePropPath_fromName({entry, prop})
			|| this._getMutUsagePropPath_fromEntries({entry, prop});
	}

	static _getMutUsagePropPath_fromName ({entry, prop}) {
		if (!entry.name) return null;

		const frequencyMeta = this._getReFrequencyMatchMeta({res: this._USES_RE_INFOS_NAME, str: entry.name});
		if (frequencyMeta) return frequencyMeta.propPath;

		const mRecharge = /{@recharge( (?<val>\d))?}/.exec(entry.name);
		if (mRecharge) {
			return ["recharge", mRecharge.groups.val || "6"];
		}

		if (["legendary", "mythic"].includes(prop)) {
			const mCosts = /\(Costs (?<cnt>\d+) Actions[);]/i.exec(entry.name);
			// (Mythic Actions consume Legendary Action uses)
			if (mCosts) return ["legendary", mCosts.groups.cnt];
			return ["legendary", "1"];
		}
	}

	static _getMutUsagePropPath_fromEntries ({entry, prop}) {
		if (!entry.entries?.length) return null;

		const walker = MiscUtil.getWalker();

		let outWalker = null;
		entry.entries = walker.walk(entry.entries, {string: str => {
			if (outWalker) return str;

			const frequencyMeta = this._getReFrequencyMatchMeta({res: this._USES_RE_INFOS_ENTRY, str});
			if (frequencyMeta) {
				outWalker = frequencyMeta.propPath;
				return str.slice(frequencyMeta.length);
			}

			if (/finish a (?<ptRestLong>{@variantrule Long Rest\|XPHB}|Long Rest)/.test(str)) {
				outWalker = ["restLong", "1"];
				return str;
			}

			return str;
		}});

		return outWalker;
	}

	/* -------------------------------------------- */

	static _getParsedSpells ({line, isMarkdown, styleHint}) {
		const mLabelSep = /(?::| -) /.exec(line);
		let spellPart = line.substring((mLabelSep?.index || 0) + (mLabelSep?.[0]?.length || 0)).trim();

		if (isMarkdown) {
			const cleanPart = (part) => {
				part = part.trim();
				while (part.startsWith("*") && part.endsWith("*")) {
					part = part.replace(/^\*(.*)\*$/, "$1");
				}
				return part;
			};

			const cleanedInner = spellPart.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX).map(it => cleanPart(it)).filter(it => it);
			spellPart = cleanedInner.join(", ");

			while (spellPart.startsWith("*") && spellPart.endsWith("*")) {
				spellPart = spellPart.replace(/^\*(.*)\*$/, "$1");
			}
		}

		// move asterisks before commas (e.g. "chaos bolt,*" -> "chaos bolt*,")
		spellPart = spellPart.replace(/,\s*\*/g, "*,");

		return spellPart.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX).map(it => this._parseSpell(it, {styleHint}));
	}

	static _parseSpell (str, {styleHint}) {
		str = str.trim();

		const ptsSuffix = [];

		// region Homebrew (e.g. "Flee, Mortals!", page 3)
		const mBrewSuffixCastingTime = / +(?<time>[ABR+])\s*$/.exec(str);
		if (mBrewSuffixCastingTime) {
			str = str.slice(0, -mBrewSuffixCastingTime[0].length);
			const action = mBrewSuffixCastingTime.groups.time;
			// TODO(Future) pass in source?
			ptsSuffix.unshift(`{@sup {@cite Casting Times|FleeMortals|${action}}}`);
		}
		// endregion

		const ixAsterisk = str.indexOf("*");
		if (~ixAsterisk) {
			ptsSuffix.unshift("*");
			str = str.substring(0, ixAsterisk);
		}

		const ixParenOpen = str.indexOf(" (");
		if (~ixParenOpen) {
			ptsSuffix.unshift(str.substring(ixParenOpen).trim());
			str = str.substring(0, ixParenOpen);
		}

		str = this._parseSpell_getNonSrdSpellName(str);

		return [
			`{@spell ${str}${this._parseSpell_getSourcePart(str, {styleHint})}}`,
			ptsSuffix.join(" "),
		]
			.filter(Boolean)
			.join(" ");
	}

	static _parseSpell_getNonSrdSpellName (spellName) {
		const nonSrdName = SpellcastingTraitConvert.SPELL_SRD_MAP[spellName.toLowerCase().trim()];
		if (!nonSrdName) return spellName;

		if (spellName.toSpellCase() === spellName) return nonSrdName.toSpellCase();
		if (spellName.toLowerCase() === spellName) return nonSrdName.toLowerCase();
		if (spellName.toTitleCase() === spellName) return nonSrdName.toTitleCase();
		return spellName;
	}

	static _parseSpell_getSourcePart (spellName, {styleHint}) {
		const source = SpellcastingTraitConvert._getSpellSource(spellName, {styleHint});
		return `${source && source !== Parser.SRC_PHB ? `|${source}` : ""}`;
	}

	static _parseToHit (line) {
		return line
			.replace(/ (?<op>[-+])(?<num>\d+)(?<suffix> to hit with spell)/g, (...m) => {
				const {op, num, suffix} = m.at(-1);
				return ` {@hit ${op === "-" ? "-" : ""}${num}}${suffix}`;
			})
		;
	}

	static mutSpellcastingAbility (spellcastingEntry) {
		if (spellcastingEntry.headerEntries) {
			const m = /strength|dexterity|constitution|charisma|intelligence|wisdom/gi.exec(JSON.stringify(spellcastingEntry.headerEntries));
			if (m) spellcastingEntry.ability = m[0].substring(0, 3).toLowerCase();
		}
	}

	static _mutDisplayAs (spellcastingEntry, displayAs) {
		if (!displayAs || displayAs === "trait") return;
		spellcastingEntry.displayAs = displayAs;
	}

	static _getSpellSource (spellName, {styleHint}) {
		const lookup = styleHint === SITE_STYLE__CLASSIC ? this._SPELL_SRC_MAP_CLASSIC : this._SPELL_SRC_MAP;
		if (spellName && lookup[spellName.toLowerCase()]) return lookup[spellName.toLowerCase()];
		return null;
	}

	/**
	 * Add other actions/reactions with names such as:
	 * - "Fire Storm (7th-Level Spell; 1/Day)"
	 * - "Shocking Grasp (Cantrip)"
	 * - "Shield (1st-Level Spell; 3/Day)"
	 * as hidden spells (if they don't already exist). */
	static _addSplitOutSpells ({spellcastingEntry, arrayOther, styleHint}) {
		if (!arrayOther?.length) return;
		arrayOther.forEach(ent => {
			if (!ent.name) return;
			const mName = /^(.*?) \((\d(?:st|nd|rd|th)-level spell; (\d+\/day)|cantrip)\)/i.exec(ent.name);
			if (!mName) return;

			const [, spellName, spellLevelRecharge, spellRecharge] = mName;

			const spellTag = this._parseSpell(spellName, {styleHint});
			const uids = this._getSpellUids(spellTag);

			if (spellLevelRecharge.toLowerCase() === "cantrip") {
				spellcastingEntry.will = spellcastingEntry.will || [];
				if (this._isExistingSpell(spellcastingEntry.will, uids)) return;
				spellcastingEntry.will.push({entry: spellTag, hidden: true});
				return;
			}

			const [numCharges, rechargeDuration] = spellRecharge.toLowerCase().split("/").map(it => it.trim()).filter(Boolean);
			switch (rechargeDuration) {
				case "day": {
					const chargeKey = `${numCharges}e`;
					const tgt = MiscUtil.getOrSet(spellcastingEntry, "daily", chargeKey, []);
					if (this._isExistingSpell(tgt, uids)) return;
					tgt.push({entry: spellTag, hidden: true});
					break;
				}

				// (expand this as required)

				default: throw new Error(`Unhandled recharge duration "${rechargeDuration}"`);
			}
		});
	}

	static _getSpellUids (str) {
		const uids = [];
		str.replace(/{@spell ([^}]+)}/gi, (...m) => {
			const [name, source = Parser.SRC_PHB.toLowerCase()] = m[1].toLowerCase().split("|").map(it => it.trim());
			uids.push(`${name}|${source}`);
		});
		return uids;
	}

	static _isExistingSpell (spellArray, uids) {
		return spellArray.some(it => {
			const str = (it.entry || it).toLowerCase().trim();
			const existingUids = this._getSpellUids(str);
			return existingUids.some(it => uids.includes(it));
		});
	}
}

export class SpellcastingTraitHiddenConvert {
	static _WALKER;
	static _RE_SPELL = /{@spell (?<text>[^}]+)}(?<ptLevel> \(level \d+ version\))?/g;

	static _getSpellUid (text) {
		const unpacked = DataUtil.proxy.unpackUid("spell", text, "spell", {isLower: true});
		return DataUtil.proxy.getUid("spell", unpacked);
	}

	static _getSpellUidsExisting ({stats}) {
		const spellUidsExisting = new Set();
		if (!stats.spellcasting?.length) return spellUidsExisting;

		this._WALKER.walk(stats.spellcasting, {string: str => {
			[...str.matchAll(this._RE_SPELL)]
				.forEach(m => spellUidsExisting.add(this._getSpellUid(m.groups.text)));
		}});

		return spellUidsExisting;
	}

	static _mutStatblockProp_getSpellcastingSameAbility ({stats, entSub}) {
		let spellcastingTraitNameLower = null;
		this._WALKER.walk(entSub.entries, {string: str => {
			const mUsesTheSame = /using the same spellcasting ability as (?<name>[^.!?]+)/i.exec(str);
			if (mUsesTheSame) return spellcastingTraitNameLower = mUsesTheSame.groups.name.trim().toLowerCase();
		}});
		if (!spellcastingTraitNameLower) return null;

		return stats.spellcasting?.find(entExisting => entExisting.name.toLowerCase().trim() === spellcastingTraitNameLower);
	}

	static _mutStatblockProp_getOtherAbility ({stats, entSub}) {
		let abil = null;
		this._WALKER.walk(entSub.entries, {string: str => {
			const mUsing = /using (?<abilRaw>\w+) as the spellcasting ability/i.exec(str);
			if (!mUsing) return;

			return abil = mUsing.groups.abilRaw.toLowerCase().slice(0, 3);
		}});
		return abil;
	}

	static _mutStatblockProp ({stats, prop, spellUidsExisting}) {
		stats[prop] = stats[prop]
			.map(entSub => {
				if (!entSub.name || !entSub.entries?.length) return entSub;

				const entSpellcastingTraitAbility = this._mutStatblockProp_getSpellcastingSameAbility({stats, entSub});
				const abilityOther = this._mutStatblockProp_getOtherAbility({stats, entSub});

				if (!entSpellcastingTraitAbility && !abilityOther) return entSub;
				const ability = entSpellcastingTraitAbility?.ability || abilityOther;

				const spellTags = [];

				this._WALKER.walk(entSub.entries, {string: str => {
					[...str.matchAll(this._RE_SPELL)]
						.forEach(m => {
							const {text, ptLevel} = m.groups;
							if (spellUidsExisting.has(this._getSpellUid(text))) return;

							const {name, source} = DataUtil.proxy.unpackUid("spell", text, "spell");
							spellTags.push(`{@spell ${name}|${source}}${ptLevel || ""}`);
						});
				}});

				if (!spellTags.length) return entSub;

				const entSpellcasting = {
					type: "spellcasting",
					name: entSub.name,
					headerEntries: entSub.entries,
					ability,
					displayAs: prop,
				};

				const usagePath = SpellcastingTraitConvert.getMutUsagePropPath({entry: entSub, prop}) || ["will"];

				entSpellcasting.hidden = [usagePath[0]];
				MiscUtil.set(entSpellcasting, ...usagePath, spellTags.unique());

				(stats.spellcasting ||= []).push(entSpellcasting);

				return null;
			})
			.filter(Boolean);
	}

	static mutStatblock ({stats, props, styleHint}) {
		if (styleHint === SITE_STYLE__CLASSIC && !stats.spellcasting?.length) return;

		this._WALKER ||= MiscUtil.getWalker({isNoModification: true, isBreakOnReturn: true});

		const spellUidsExisting = this._getSpellUidsExisting({stats});

		props
			.filter(prop => !["variant", "spellcasting"].includes(prop))
			.filter(prop => stats[prop])
			.forEach(prop => this._mutStatblockProp({stats, prop, spellUidsExisting}));
	}
}

export class RechargeConvert {
	static tryConvertRecharge (traitOrAction, cbAll, cbMan) {
		if (traitOrAction.name) {
			traitOrAction.name = traitOrAction.name.replace(/\((Recharge )(\d.*?)\)$/gi, (...m) => {
				if (cbAll) cbAll(m[2]);
				const num = m[2][0];
				if (num === "6") return `{@recharge}`;
				if (isNaN(Number(num))) {
					if (cbMan) cbMan(traitOrAction.name);
					return m[0];
				}
				return `{@recharge ${num}}`;
			});
		}
	}
}

export class SpeedConvert {
	static _SPEED_TYPES = new Set(Parser.SPEED_MODES);

	static _splitSpeed (str) {
		const cSplitter = str.includes(";") ? ";" : ",";

		let ret = [];
		let stack = "";
		let cntParens = 0;

		const checkPopStack = () => {
			if (stack) ret.push(stack);
			stack = "";
		};

		Array.from(str)
			.forEach(c => {
				switch (c) {
					case ",":
					case ";":
						if (cSplitter !== c) return stack += c;
						if (!cntParens) return checkPopStack();
						return stack += c;

					case "(": cntParens++; return stack += c;
					case ")": cntParens--; return stack += c;

					default: return stack += c;
				}
			});

		checkPopStack();
		return ret.map(it => it.trim()).filter(Boolean);
	}

	static _tagHover (mon) {
		if (!mon.speed?.fly?.condition) return;

		mon.speed.fly.condition = mon.speed.fly.condition.trim();
		if (mon.speed.fly.condition.toLowerCase().includes("hover")) mon.speed.canHover = true;
	}

	static tryConvertSpeed (mon, cbMan) {
		if (typeof mon.speed !== "string") return;

		let line = mon.speed.trim().replace(/^speed[:.]?\s*/i, "");

		const out = {};
		let byHand = false;
		let prevSpeed = null;

		const setByHand = () => {
			byHand = true;
			prevSpeed = null;
		};

		this._splitSpeed(line).map(it => it.trim()).forEach(s => {
			// For e.g. shapechanger speeds, store them behind a "condition" on the previous speed
			if (prevSpeed && /^\((\w+?\s+)?(\d+)\s*ft\.?( .*)?\)$/i.test(s)) {
				if (typeof out[prevSpeed] === "number") out[prevSpeed] = {number: out[prevSpeed], condition: s};
				else out[prevSpeed].condition = s;
				prevSpeed = null;
				return;
			}

			// E.g. "20 ft., Climb or Fly 20 ft. (DM's choice)"
			const mOrDmsChoice = /^(?<mode1>\w+) or (?<mode2>\w+) (?<feet>\d+) ft\. (?<note>\(DM's choice\))$/i.exec(s);
			if (mOrDmsChoice) {
				let {mode1, mode2, feet, note} = mOrDmsChoice.groups;

				mode1 = mode1.trim().toLowerCase();
				if (!this._SPEED_TYPES.has(mode1)) return setByHand();
				mode2 = mode2.trim().toLowerCase();
				if (!this._SPEED_TYPES.has(mode2)) return setByHand();
				feet = Number(feet);

				out.choose = {
					from: [mode1, mode2],
					amount: feet,
					note: note.trim(),
				};
				prevSpeed = null;

				return;
			}

			const mBasic = /^(?<mode>\w+?\s+)?(?<feet>\d+)\s*ft\.?(?<condition> .*)?$/i.exec(s);
			if (!mBasic) return setByHand();

			let {mode, feet, condition} = mBasic.groups;
			feet = Number(feet);

			mode = mode ? mode.trim().toLowerCase() : "walk";

			if (!this._SPEED_TYPES.has(mode)) return setByHand();

			prevSpeed = mode;
			if (condition) {
				if (out[mode]) {
					// e.g. Werebear (XMM)
					return ((out.alternate ||= {})[mode] ||= []).push({
						number: feet,
						condition: condition.trim(),
					});
				}

				return out[mode] = {
					number: feet,
					condition: condition.trim(),
				};
			}

			if (out[mode] && out.alternate?.[mode]) return setByHand();
			if (out[mode]) return ((out.alternate ||= {})[mode] ||= []).push(feet);
			return out[mode] = feet;
		});

		// flag speed as invalid
		if (
			Object.entries(out)
				.filter(([k, s]) => {
					if (k === "alternate") return false;
					const val = s.number ?? s.amount ?? s;
					return val % 5 !== 0;
				}).length
		) {
			if (cbMan) cbMan(`${mon.name ? `(${mon.name}) ` : ""}Speed likely requires manual conversion: "${line}"`);
		}

		// flag speed as needing hand-parsing
		if (byHand) {
			out.UNPARSED_SPEED = line;
			if (cbMan) cbMan(`${mon.name ? `(${mon.name}) ` : ""}Speed requires manual conversion: "${line}"`);
		}

		mon.speed = out;
		this._tagHover(mon);
	}
}

export class DetectNamedCreature {
	static tryRun (mon) {
		if (this._tryRun_nickname(mon)) return;
		this._tryRun_heuristic(mon);
	}

	static _tryRun_nickname (mon) {
		if (
			/^[^"]+ "[^"]+" [^"]+/.test(mon.name)
			|| /^[^']+ '[^']+' [^']+/.test(mon.name)
		) {
			mon.isNamedCreature = true;
			return true;
		}
		return false;
	}

	static _tryRun_heuristic (mon) {
		const totals = {yes: 0, no: 0};

		this._doCheckProp(mon, totals, "trait");
		this._doCheckProp(mon, totals, "spellcasting");
		this._doCheckProp(mon, totals, "action");
		this._doCheckProp(mon, totals, "reaction");
		this._doCheckProp(mon, totals, "bonus");
		this._doCheckProp(mon, totals, "legendary");
		this._doCheckProp(mon, totals, "mythic");

		if (totals.yes && totals.yes > totals.no) mon.isNamedCreature = true;

		return true;
	}

	static _doCheckProp (mon, totals, prop) {
		if (!mon.name) return;
		if (mon.isNamedCreature) return;
		if (!mon[prop]) return;

		mon[prop].forEach(it => {
			const prop = it.entries?.length ? "entries" : it.headerEntries?.length ? "headerEntries" : null;
			if (!prop) return;
			if (typeof it[prop][0] !== "string") return;

			const namePart = (mon.name.split(/[ ,:.!;]/g)[0] || "").trim().escapeRegexp();

			const isNotNamedCreature = new RegExp(`^The ${namePart}`).test(it[prop][0]);
			const isNamedCreature = new RegExp(`^${namePart}`).test(it[prop][0]);

			if (isNotNamedCreature && isNamedCreature) return;
			if (isNamedCreature) totals.yes++;
			if (isNotNamedCreature) totals.no++;
		});
	}
}

export class TagImmResVulnConditional {
	static tryRun (mon) {
		this._handleProp(mon, "resist");
		this._handleProp(mon, "immune");
		this._handleProp(mon, "vulnerable");
		this._handleProp(mon, "conditionImmune");
	}

	static _handleProp (mon, prop) {
		if (!mon[prop] || !(mon[prop] instanceof Array)) return;
		mon[prop].forEach(it => this._handleProp_recurse(it, prop));
	}

	static _handleProp_recurse (obj, prop) {
		if (obj.note) {
			const note = obj.note.toLowerCase().trim().replace(/^\(/, "").replace(/^damage/, "").trim();
			if (
				note.startsWith("while ")
				|| note.startsWith("from ")
				|| note.startsWith("from ")
				|| note.startsWith("if ")
				|| note.startsWith("against ")
				|| note.startsWith("except ")
				|| note.startsWith("with ")
				|| note.startsWith("that is ")
				|| /in .* form$/i.test(note)
			) {
				obj.cond = true;
			}
		}

		if (obj[prop]) obj[prop].forEach(it => this._handleProp_recurse(it, prop));
	}
}

export class DragonAgeTag {
	static tryRun (mon) {
		const type = mon.type?.type ?? mon.type;
		if (type !== "dragon") return;

		mon.name.replace(/\b(?<age>young|adult|wyrmling|greatwyrm|ancient|aspect)\b/i, (...m) => {
			mon.dragonAge = m.last().age.toLowerCase();
		});
	}
}

export class AttachedItemTag {
	static _WEAPON_DETAIL_CACHE;

	static init ({items}) {
		this._WEAPON_DETAIL_CACHE ||= {};

		for (const item of items) {
			const itemTypeAbv = item.type ? DataUtil.itemType.unpackUid(item.type).abbreviation : null;

			if (itemTypeAbv === Parser.ITM_TYP_ABV__GENERIC_VARIANT) continue;
			if (![Parser.ITM_TYP_ABV__MELEE_WEAPON, Parser.ITM_TYP_ABV__RANGED_WEAPON].includes(itemTypeAbv)) continue;

			const lowName = item.name.toLowerCase();
			// If there's e.g. a " +1" suffix on the end, make a copy with it as a prefix instead
			const prefixBonusKey = lowName.replace(/^(.*?)( \+\d+)$/, (...m) => `${m[2].trim()} ${m[1].trim()}`);
			// And vice-versa
			const suffixBonusKey = lowName.replace(/^(\+\d+) (.*?)$/, (...m) => `${m[2].trim()} ${m[1].trim()}`);
			const suffixBonusKeyComma = lowName.replace(/^(\+\d+) (.*?)$/, (...m) => `${m[2].trim()}, ${m[1].trim()}`);

			const itemKeys = [
				lowName,
				prefixBonusKey === lowName ? null : prefixBonusKey,
				suffixBonusKey === lowName ? null : suffixBonusKey,
				suffixBonusKeyComma === lowName ? null : suffixBonusKeyComma,
			].filter(Boolean);

			const cpy = MiscUtil.copy(item);

			itemKeys.forEach(k => {
				if (!this._WEAPON_DETAIL_CACHE[k]) {
					this._WEAPON_DETAIL_CACHE[k] = cpy;
					return;
				}

				// If there is already something in the cache, prefer DMG + PHB entries, then official sources
				const existing = this._WEAPON_DETAIL_CACHE[k];
				if (existing.source === Parser.SRC_XDMG || existing.source === Parser.SRC_XPHB) return;
				if (existing.source === Parser.SRC_DMG || existing.source === Parser.SRC_PHB) return;
				if (SourceUtil.isNonstandardSource(existing.source)) return;
				this._WEAPON_DETAIL_CACHE[k] = cpy;
			});
		}
	}

	static _isLikelyWeapon (act) {
		if (!act.entries?.length || typeof act.entries[0] !== "string") return false;
		const mAtk = /^{@atkr? ([^}]+)}/.exec(act.entries[0].trim());
		if (!mAtk) return;
		return mAtk[1].split(",").some(it => it.includes("w"));
	}

	// FIXME tags too aggressively; should limit by e.g.:
	//   - for creatures with a known "book" source, never use items from a known "adventure" source
	//   - for creatures with a known "adventure" source, never use items from a *different* "adventure" source
	//   - for a creature from a known source, never tag items from a more recent known source
	static tryRun (mon, {cbNotFound = null, isAddOnly = false} = {}) {
		if (!this._WEAPON_DETAIL_CACHE) throw new Error(`Attached item cache was not initialized!`);

		if (!mon.action?.length) return;

		const itemSet = new Set();

		mon.action
			.forEach(act => {
				const weapon = this._WEAPON_DETAIL_CACHE[Renderer.monsterAction.getWeaponLookupName(act)];
				if (weapon) return itemSet.add(DataUtil.proxy.getUid("item", weapon));

				if (!cbNotFound) return;

				if (!this._isLikelyWeapon(act)) return;

				cbNotFound(act.name);
			});

		if (isAddOnly && mon.attachedItems) mon.attachedItems.forEach(it => itemSet.add(it));

		if (!itemSet.size) delete mon.attachedItems;
		else mon.attachedItems = [...itemSet].sort(SortUtil.ascSortLower);
	}
}

export class CreatureSavingThrowTagger extends _PrimaryLegendarySpellsTaggerBase {
	static _PROP_PRIMARY = "savingThrowForced";
	static _PROP_SPELLS = "savingThrowForcedSpell";
	static _PROP_LEGENDARY = "savingThrowForcedLegendary";

	static _handleString ({m = null, str, outSet}) {
		str.replace(/{@dc (?<save>[^|}]+)(?:\|[^}]+)?}\s+(?<abil>Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i, (...m) => {
			outSet.add(m.last().abil.toLowerCase());
			return "";
		});
	}

	static _handleSpell ({spell, outSet}) {
		if (!spell.savingThrow) return;
		spell.savingThrow.forEach(it => outSet.add(it));
	}
}

export class CreatureSpecialEquipmentTagger {
	/**
	 * @param mon
	 * @param {"classic" | "one" | null} styleHint
	 */
	static tryRun (mon, {styleHint = null} = {}) {
		if (!mon.trait) return;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		mon.trait = mon.trait
			.map(ent => {
				if (!/\bEquipment\b/.test(ent.name || "")) return ent;
				return ItemTag.tryRun(ent, {styleHint});
			});
	}
}
