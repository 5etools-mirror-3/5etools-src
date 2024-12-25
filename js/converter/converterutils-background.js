class BackgroundConverterConst {
	static RE_NAME_SKILLS = /^Skill Proficienc(?:ies|y):/;
	static RE_NAME_TOOLS = /^(?:Tools?|Tool Proficienc(?:ies|y)):/;
	static RE_NAME_LANGUAGES = /^Languages?:/;
	static RE_NAME_EQUIPMENT = /^Equipment?:/;
}

export class ConverterBackgroundUtil {
	static getEquipmentEntry (background) {
		const list = background.entries.find(ent => ent.type === "list");
		if (!list) return null;
		return list.items.find(ent => BackgroundConverterConst.RE_NAME_EQUIPMENT.test(ent.name));
	}
}

export class EquipmentBreakdown {
	static _WALKER;

	static tryRun (
		bg,
		{
			isSkipExisting = false,
			cbWarning = () => {},
			mappingsManual = {},
			allowlistOrEnds = [],
			blocklistSplits = [],
		} = {},
	) {
		if (!bg.entries) return cbWarning(`No entries found on "${bg.name}"`);

		if (isSkipExisting && bg.startingEquipment) return;
		delete bg.startingEquipment;

		this._WALKER ||= MiscUtil.getWalker({isNoModification: true, isBreakOnReturn: true});

		const entryEquipment = ConverterBackgroundUtil.getEquipmentEntry(bg);
		if (!entryEquipment) return;

		const entry = entryEquipment.entry || entryEquipment.entries[0];
		if (!entry) throw new Error(`Unimplemented!`);

		this._convert({
			bg,
			entry,
			mappingsManual,
			allowlistOrEnds,
			blocklistSplits,
		});
	}

	/**
	 * Output structure:
	 *
	 * ```
	 * equipment: [
	 *   {
	 *     "_": [
	 *       <equipment details>
	 *     ]
	 *   },
	 *   {
	 *     "a": [
	 *       <equipment details; choice A>
	 *     ],
	 *     "b": [
	 *       <equipment details; choice B>
	 *     ]
	 *   }
	 * ]
	 * ```
	 *
	 * @param bg
	 * @param entry
	 * @param mappingsManual
	 * @param allowlistOrEnds
	 * @param blocklistSplits
	 * @private
	 */
	static _convert (
		{
			bg,
			entry,
			mappingsManual,
			allowlistOrEnds,
			blocklistSplits,
		},
	) {
		blocklistSplits.forEach((str, i) => entry = entry.replace(str, `__SPLIT_${i}__`));
		const parts = entry
			.split(/\. /g)
			.map(it => it.trim())
			.map(it => it.split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX).map(it => it.trim()))
			.flat()
			.map(it => {
				return it.replace(/__SPLIT_(\d+)__/gi, (...m) => {
					const ix = Number(m[1]);
					return blocklistSplits[ix];
				});
			});

		const out = parts
			.map(pt => {
				// Strip leading "and" and trailing punctuation
				pt = pt
					.trim()
					.replace(/^and /i, "")
					.replace(/[.!?]$/, "")
					.trim();

				// Split up choices
				const ptChoices = this._splitChoices({str: pt, allowlistOrEnds})
					.map(c => c.trim().replace(/,$/, "").trim());

				const outChoices = ptChoices
					.map(ch => {
						const chOriginal = ch;

						// Pull out quantities
						let quantity = 1;
						ch = ch
							.replace(/^(any one|an|a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)/i, (...m) => {
								quantity = Parser.textToNumber(
									m[1]
										.replace(/^any/i, "").trim(),
								);
								return "";
							})
							.trim();

						if (isNaN(quantity)) throw new Error(`Quantity found in "${chOriginal}" was not a number!`);

						// Pull out coinage
						let valueCp = 0;
						let cntValueContainingWith = 0;
						let cntValueWorth = 0;
						ch = ch
							// Remove trailing parenthetical parts, e.g. "... (Azorius-minted 1-zino coins)"
							.replace(/(containing|with|worth) (\d+\s*[csgep]p)(\s+\([^)]+\))?/g, (...m) => {
								switch (m[1].toLowerCase().trim()) {
									case "containing":
									case "with": cntValueContainingWith += 1; break;
									case "worth": cntValueWorth += 1; break;
									default: throw new Error(`Unhandled "${m[1]}"`);
								}

								valueCp += Parser.coinValueToNumber(m[2]);
								return "";
							})
							.replace(/\s+/g, " ")
							.trim()
							// Handle e.g. "1 sp"--the quantity will have been pulled out already
							.replace(/^[csgep]p$/g, (...m) => {
								valueCp = Parser.coinValueToNumber(`${quantity} ${m[0]}`);
								return "";
							})
							.trim()
							// Handle e.g. "(10 gp)"
							.replace(/\((\d+\s*[csgep]p)\)/g, (...m) => {
								valueCp += Parser.coinValueToNumber(m[1]);
								return "";
							})
							.trim();

						// Pull out "set of... " for clothes
						if (/clothes/i.test(ch)) {
							ch = ch.replace(/^set of /i, "");
						}

						// Pull out parenthetical parts that aren't in @item tags
						const ptParenMeta = this._getWithoutParenParts(ch);
						let ptDisplay = ch; // Keep a copy of the part to display as the item name
						let ptDisplayNoTags = Renderer.stripTags(ptDisplay);

						let ptPlain = ptParenMeta.plain.map(it => it.trim()).join(" ").trim();
						let ptParens = ptParenMeta.inParens.map(it => it.trim()).join(" ").trim();

						// Handle any manual mappings
						if (mappingsManual[chOriginal]) {
							return mappingsManual[chOriginal];
						}

						// Handle any pure coinage
						if (!ptPlain && valueCp) {
							return {value: valueCp};
						}

						// If the plain part seems to just be a single @item tag, use this
						const mItem = /{@item ([^}]+)}/.exec(ptPlain);
						const mFilter = /{@filter ([^}]+)}/.exec(ptPlain);

						// If the plain part is a flavorful name of an @item, use this
						const mItemParens = /^\({@item ([^}]+)}\)$/.exec(ptParens);

						if (mItem) {
							// consider doing something with displayText?
							const [name, source, displayText] = mItem[1].split("|").map(it => it.trim()).filter(Boolean);
							const idItem = [name, source].join("|").toLowerCase();

							if (quantity !== 1 || ptPlain !== ptDisplay || valueCp) {
								const info = {item: idItem};

								if (quantity !== 1) info.quantity = quantity;
								if (ptPlain !== ptDisplay) info.displayName = ptDisplayNoTags;
								if (valueCp) info.containsValue = valueCp;

								return info;
							}

							if (!ptPlain.startsWith("{@") || !ptPlain.endsWith("}")) {
								return {
									item: idItem,
									displayName: ptDisplayNoTags,
								};
							}

							return idItem;
						}

						if (mFilter) {
							// Strip junk text
							let ptPlainFilter = ptPlain
								.replace(/^set of/gi, "").trim()
								.replace(/ you are proficient with$/gi, "").trim()
								.replace(/ with which you are proficient$/gi, "").trim()
								.replace(/ of your choice$/gi, "").trim()
								.replace(/ \([^)]+\)/gi, "").trim()
								// Brew
								.replace(/^wind /gi, "").trim();

							// We expect that the entire text is now a filter tag
							if (!ptPlainFilter.startsWith("{@") || !ptPlainFilter.endsWith("}")) throw new Error(`Text "${ptPlainFilter}" was not a single tag!`);

							const info = this._getFilterType(mFilter[1].split("|")[0]);
							if (quantity !== 1) info.quantity = quantity;
							if (valueCp) info.containsValue = valueCp;
							return info;
						}

						if (mItemParens) {
							// consider doing something with displayText?
							const [name, source, displayText] = mItemParens[1].split("|").map(it => it.trim()).filter(Boolean);
							const idItem = [name, source].join("|").toLowerCase();

							const info = {
								item: idItem,
								displayName: ptPlain,
							};

							if (quantity !== 1) info.quantity = quantity;
							if (valueCp) info.containsValue = valueCp;

							return info;
						}

						// Otherwise, create a custom item
						const info = {special: ptDisplayNoTags.trim()};
						if (quantity !== 1) info.quantity = quantity;
						if (valueCp) {
							if (cntValueWorth > cntValueContainingWith) info.worthValue = valueCp;
							else info.containsValue = valueCp;
						}
						return info;
					})
					.flat();

				// Assign each choice a letter (or use underscore if it's the only choice)
				if (outChoices.length === 1) {
					if (outChoices[0].isList) return {"_": outChoices[0].data};
					return {"_": [outChoices[0]]};
				}

				const outPart = {};
				outChoices.forEach((ch, i) => {
					const letter = Parser.ALPHABET[i].toLowerCase();
					outPart[letter] = [ch];
				});
				return outPart;
			});

		// Combine no-choice sections together
		const outReduced = [];
		out
			.forEach(info => {
				if (!info._) return outReduced.push(info);

				const existing = outReduced.find(x => x._);
				if (existing) return existing._.push(...info._);
				return outReduced.push(info);
			});

		bg.startingEquipment = outReduced;
	}

	static _splitChoices ({str, allowlistOrEnds}) {
		const out = [];

		let expectAt = false;
		let braceDepth = 0;
		let parenDepth = 0;
		let stack = "";
		for (let i = 0; i < str.length; ++i) {
			const c = str[i];
			switch (c) {
				case "(": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;
					parenDepth++;

					break;
				}
				case ")": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;
					if (parenDepth) parenDepth--;

					break;
				}
				case "{": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;
					braceDepth++;
					expectAt = true;

					break;
				}
				case "}": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;
					if (braceDepth) braceDepth--;

					break;
				}

				case "@": { expectAt = false; stack += c; break; }

				case " ": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;
					if (
						!braceDepth
						&& !parenDepth
					) {
						// An oxford comma implies earlier commas in this part are separating or'd parts, so back-split
						if (
							stack.endsWith(", or ")
							&& !allowlistOrEnds.some(it => stack.endsWith(it))
						) {
							const backSplit = stack.slice(0, -5).split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX).map(it => it.trim());
							out.push(...backSplit);
							stack = "";
						} else if (
							stack.endsWith(" or ")
							&& !allowlistOrEnds.some(it => stack.endsWith(it))
						) {
							out.push(stack.slice(0, -4));
							stack = "";
						}
					}

					break;
				}

				default: {
					if (expectAt) { braceDepth--; expectAt = false; }
					stack += c;
					break;
				}
			}
		}

		out.push(stack);

		// Split two conjoined items
		if (out.length === 1 && out[0].includes(" and ")) {
			let cntItem = 0;
			out[0].replace(/{@item/g, () => {
				cntItem++;
				return "";
			});
			if (cntItem > 1) {
				if (cntItem !== 2) throw new Error(`Unhandled conjunction count "${cntItem}"`);

				const spl = out[0].split(" and ");
				out[0] = spl[0];
				out.push(spl[1]);
			}
		}

		return out;
	}

	static _getWithoutParenParts (str) {
		const out = [];
		const outParens = [];

		let expectAt = false;
		let braceDepth = 0;
		let parenCount = 0;
		let stack = "";
		for (let i = 0; i < str.length; ++i) {
			const c = str[i];
			switch (c) {
				case "(": {
					if (expectAt) { braceDepth--; expectAt = false; }

					if (!braceDepth) {
						if (!parenCount) {
							out.push(stack);
							stack = "";
						}

						parenCount++;
					}

					stack += c;

					break;
				}
				case ")": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;

					if (!braceDepth && parenCount) {
						parenCount--;

						if (!parenCount) {
							outParens.push(stack);
							stack = "";
						}
					}

					break;
				}
				case "{": {
					if (expectAt) { braceDepth--; expectAt = false; }

					braceDepth++;
					expectAt = true;

					stack += c;

					break;
				}
				case "}": {
					if (expectAt) { braceDepth--; expectAt = false; }

					stack += c;
					if (braceDepth) braceDepth--;

					break;
				}

				case "@": { expectAt = false; stack += c; break; }

				default: {
					if (expectAt) { braceDepth--; expectAt = false; }
					stack += c; break;
				}
			}
		}

		// Gather any leftovers
		if (!braceDepth) {
			if (!parenCount) out.push(stack);
			else outParens.push(stack);
		} else {
			out.push(stack);
		}

		return {plain: out.filter(Boolean), inParens: outParens.filter(Boolean)};
	}

	static _getFilterType (str) {
		switch (str.toLowerCase().trim()) {
			case "artisan's tools": return {equipmentType: "toolArtisan"};
			case "gaming set": return {equipmentType: "setGaming"};
			case "musical instrument": return {equipmentType: "instrumentMusical"};

			default: throw new Error(`Unhandled filter type "${str}"`);
		}
	}
}

export class BackgroundSkillTollLanguageEquipmentCoalesce {
	static tryRun (
		bg,
		{
			cbWarning = () => {},
		} = {},
	) {
		if (!bg.entries) return;

		const [entriesToCompact, entriesOther] = bg.entries.segregate(ent => this._isToCompact(ent));

		if (!entriesToCompact.length) return;

		const list = {
			"type": "list",
			"style": "list-hang-notitle",
		};
		list.items = entriesToCompact
			.map(ent => {
				return ent.entries.length === 1
					? {
						type: "item",
						name: ent.name,
						entry: ent.entries[0],
					}
					: {
						type: "item",
						name: ent.name,
						entries: ent.entries,
					};
			});

		bg.entries = [
			list,
			...entriesOther,
		];
	}

	static _RES_COMPACT = [
		BackgroundConverterConst.RE_NAME_SKILLS,
		BackgroundConverterConst.RE_NAME_TOOLS,
		BackgroundConverterConst.RE_NAME_LANGUAGES,
		/^Equipment:/,
	];

	static _isToCompact (ent) {
		return this._RES_COMPACT
			.some(re => re.test(ent.name));
	}
}

export class BackgroundSkillToolLanguageTag {
	static tryRun (
		bg,
		{
			cbWarning = () => {},
		} = {},
	) {
		const list = bg.entries.find(ent => ent.type === "list");

		this._doSkillTag({bg, list, cbWarning});
		this._doToolTag({bg, list, cbWarning});
		this._doLanguageTag({bg, list, cbWarning});
	}

	static _doSkillTag ({bg, list, cbWarning}) {
		const skillProf = list.items.find(ent => BackgroundConverterConst.RE_NAME_SKILLS.test(ent.name));
		if (!skillProf) return;

		const mOneStaticOneChoice = /^(?<predefined>.*)\band one choice from the following:(?<choices>.*)$/i.exec(skillProf.entry);
		if (mOneStaticOneChoice) {
			const predefined = {};
			mOneStaticOneChoice.groups.predefined
				.replace(/{@skill (?<skill>[^}]+)/g, (...m) => {
					predefined[m.last().skill.toLowerCase().trim()] = true;
					return "";
				});

			if (!Object.keys(predefined).length) return cbWarning(`(${bg.name}) Skills require manual tagging`);

			const choices = [];
			mOneStaticOneChoice.groups.choices
				.replace(/{@skill (?<skill>[^}]+)/g, (...m) => {
					choices.push(m.last().skill.toLowerCase().trim());
					return "";
				});

			bg.skillProficiencies = [
				{
					...predefined,
					choose: {
						from: choices,
					},
				},
			];

			return;
		}

		if (/^Two of the following:/.test(skillProf.entry)) {
			const choices = [];
			skillProf.entry
				.replace(/{@skill (?<skill>[^}]+)/g, (...m) => {
					choices.push(m.last().skill.toLowerCase().trim());
					return "";
				});

			bg.skillProficiencies = [
				{
					choose: {
						from: choices,
						count: 2,
					},
				},
			];

			return;
		}

		if (!/^({@skill [^}]+}(?:, )?)+$/.test(skillProf.entry)) return cbWarning(`(${bg.name}) Skills require manual tagging`);

		bg.skillProficiencies = [
			skillProf.entry
				.split(",")
				.map(ent => ent.trim())
				.mergeMap(str => {
					const reTag = /^{@skill (?<skill>[^}]+)}$/.exec(str);
					if (reTag) return {[reTag.groups.skill.toLowerCase().trim()]: true};
					throw new Error(`Couldn't find tag in ${str}`);
				}),
		];
	}

	static _doToolTag ({bg, list, cbWarning}) {
		const toolProf = list.items.find(ent => BackgroundConverterConst.RE_NAME_TOOLS.test(ent.name));
		if (!toolProf) return;

		const entry = Renderer.stripTags(toolProf.entry.toLowerCase())
			.replace(/one type of gaming set/g, "gaming set")
			.replace(/one type of artisan's tools/g, "artisan's tools")
			.replace(/one type of gaming set/g, "gaming set")
			.replace(/one type of musical instrument/g, "musical instrument")
			.replace(/one other set of artisan's tools/g, "artisan's tools")
			.replace(/s' supplies/g, "'s supplies")
		;

		const isChoice = /\bany |\bchoose |\bone type|\bchoice|\bor /g.exec(entry);
		const isSpecial = /\bspecial/.exec(entry);

		if (!isChoice && !isSpecial) {
			bg.toolProficiencies = [
				entry.toLowerCase()
					.split(/,\s?(?![^(]*\))| or | and /g)
					.filter(Boolean)
					.map(pt => pt.trim())
					.filter(pt => pt)
					.mergeMap(pt => ({[pt]: true})),
			];
			return;
		}

		if (isChoice) {
			const entryClean = entry
				.replace(/^either /gi, "");

			const out = {};
			switch (entryClean) {
				case "cartographer's tools or navigator's tools":
					out.choose = {from: ["navigator's tools", "cartographer's tools"]};
					break;
				case "disguise kit, and artisan's tools or gaming set":
					out["disguise kit"] = true;
					out.choose = {from: ["artisan's tools", "gaming set"]};
					break;
				case "any one musical instrument or gaming set of your choice, likely something native to your homeland":
					out.choose = {from: ["musical instrument", "gaming set"]};
					break;
				case "your choice of a gaming set or a musical instrument":
					out.choose = {from: ["musical instrument", "gaming set"]};
					break;
				case "musical instrument or artisan's tools":
					out.choose = {from: ["musical instrument", "artisan's tools"]};
					break;
				case "one type of artistic artisan's tools and one musical instrument":
					out["artisan's tools"] = true;
					out["musical instrument"] = true;
					break;
				case "choose two from among gaming set, one musical instrument, and thieves' tools":
					out.choose = {
						from: ["gaming set", "musical instrument", "thieves' tools"],
						count: 2,
					};
					break;
				case "artisan's tools, or navigator's tools, or an additional language":
					out.choose = {from: ["artisan's tools", "navigator's tools"]};
					break;
				case "gaming set or musical instrument":
					out.choose = {from: ["gaming set", "musical instrument"]};
					break;
				case "calligrapher's supplies or alchemist's supplies":
					out.choose = {from: ["calligrapher's supplies", "alchemist's supplies"]};
					break;
				default:
					cbWarning(`(${bg.name}) Tool proficiencies require manual tagging in "${entry}"`);
			}
			bg.toolProficiencies = [out];
			return;
		}

		if (isSpecial) {
			cbWarning(`(${bg.name}) Tool proficiencies require manual tagging in "${entry}"`);
		}
	}

	static _doLanguageTag ({bg, list, cbWarning}) {
		const langProf = list.items.find(ent => BackgroundConverterConst.RE_NAME_LANGUAGES.test(ent.name));
		if (!langProf) return;

		const languageProficiencies = this._getLanguageTags({langProf});
		if (!languageProficiencies) {
			cbWarning(`(${bg.name}) Language proficiencies require manual tagging in "${langProf.entry}"`);
			return;
		}
		bg.languageProficiencies = languageProficiencies;
	}

	static _getLanguageTags ({langProf}) {
		let str = (langProf.entry || langProf.entries[0])
			.replace(/\bElven\b/, "Elvish")
			.replace(/\([^)]+ recommended\)$/, "")
			.trim();

		const reStrLanguage = `(${Parser.LANGUAGES_ALL.map(it => it.escapeRegexp()).join("|")})`;

		const mSingle = new RegExp(`^${reStrLanguage}$`, "i").exec(str);
		if (mSingle) return [{[mSingle[1].toLowerCase()]: true}];

		const mDoubleAnd = new RegExp(`^${reStrLanguage} and ${reStrLanguage}$`, "i").exec(str);
		if (mDoubleAnd) return [{[mDoubleAnd[1].toLowerCase()]: true, [mDoubleAnd[2].toLowerCase()]: true}];

		const mDoubleAndChoose = new RegExp(`^${reStrLanguage} and one other language of your choice$`, "i").exec(str);
		if (mDoubleAndChoose) return [{[mDoubleAndChoose[1].toLowerCase()]: true, "anyStandard": true}];

		const mDoubleOr = new RegExp(`^${reStrLanguage} or ${reStrLanguage}$`, "i").exec(str);
		if (mDoubleOr) return [{[mDoubleOr[1].toLowerCase()]: true}, {[mDoubleOr[2].toLowerCase()]: true}];

		const mNumAny = /^(?:any )?((?<count>one|two) )?of your choice$/i.exec(str);
		if (mNumAny) return [{"anyStandard": Parser.textToNumber(mNumAny.groups?.count || "one")}];

		const mNumExotic = /^(?:(?:any|choose) )?((?<count>one|two) )?exotic language(?: \([^)]+\))?$/i.exec(str);
		if (mNumExotic) return [{"anyExotic": Parser.textToNumber(mNumExotic.groups?.count || "one")}];

		const mSingleOrAlternate = new RegExp(`^${reStrLanguage} or one of your choice if you already speak ${reStrLanguage}$`, "i").exec(str);
		if (mSingleOrAlternate) return [{[mSingle[1].toLowerCase()]: true}, {"anyStandard": 1}];

		return null;
	}
}
