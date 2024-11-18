import {ConverterUtils} from "./converterutils-utils.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";

export class EntryCoalesceEntryLists {
	static _WALKER = null;

	/**
	 * @param stats
	 * @param prop
	 * @param {"classic" | "one" | null} styleHint
	 */
	static mutCoalesce (stats, prop, {styleHint = null} = {}) {
		if (!stats[prop]) return;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		this._WALKER ||= MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

		this._mutCoalesce_listsBasic({stats, prop, styleHint});
		this._mutCoalesce_listsHanging({stats, prop, styleHint});
		this._mutCoalesce_listsHangingAttributes({stats, prop, styleHint});

		this._mutCoalesce_separateUsageNote({stats, prop, styleHint});
	}

	static _mutCoalesce_listsBasic ({stats, prop}) {
		stats[prop] = this._WALKER.walk(
			stats[prop],
			{
				array: (arr, objProp) => {
					if (objProp !== "entries") return arr;

					const getNewList = () => ({type: "list", items: []});
					const checkFinalizeList = () => {
						if (tmpList.items.length) {
							out.push(tmpList);
							tmpList = getNewList();
						}
					};

					const out = [];
					let tmpList = getNewList();

					for (let i = 0; i < arr.length; ++i) {
						const it = arr[i];

						if (typeof it !== "string") {
							checkFinalizeList();
							out.push(it);
							continue;
						}

						const mBullet = /^\s*[-•●]\s*(.*)$/.exec(it);
						if (!mBullet) {
							checkFinalizeList();
							out.push(it);
							continue;
						}

						tmpList.items.push(mBullet[1].trim());
					}

					checkFinalizeList();

					return out;
				},
			},
			"entries",
		);
	}

	static _mutCoalesce_listsHanging ({stats, prop, styleHint}) {
		if (styleHint === SITE_STYLE__CLASSIC) return;

		stats[prop] = this._WALKER.walk(
			stats[prop],
			{
				array: (arr, objProp) => {
					if (objProp !== "entries") return arr;

					const out = [];
					let tmpList = null;

					const getNewList = () => ({type: "list", style: "list-hang-notitle", items: []});
					const checkFinalizeList = () => {
						if (!tmpList?.items?.length) return;
						out.push(tmpList);
						tmpList = null;
					};

					for (let i = 0; i < arr.length; ++i) {
						const ent = arr[i];
						const entNxt = arr[i + 1];

						if (typeof ent === "string") {
							checkFinalizeList();
							out.push(ent);

							if (
								ent.trim().endsWith(":")
								&& /\b(choose|choice|one of the following|following benefits)\b/i.exec(ent)
								&& entNxt?.type === "entries"
							) {
								tmpList = getNewList();
							}

							continue;
						}

						if (!tmpList) {
							out.push(ent);
							continue;
						}

						tmpList.items.push(
							ConverterUtils.mutSetEntryTypePretty({obj: ent, type: "item"}),
						);
					}

					checkFinalizeList();

					return out;
				},
			},
			"entries",
		);
	}

	static _mutCoalesce_listsHangingAttributes ({stats, prop, styleHint}) {
		if (styleHint === SITE_STYLE__CLASSIC) return;

		let ixEnd = -1;

		for (let i = 0; i < stats[prop].length; ++i) {
			const ent = stats[prop][i];
			if (ent.type !== "entries" || ent.entries?.length !== 1 || !ent.name?.endsWith(":")) break;
			ixEnd = i;
		}

		if (ixEnd < 1) return;

		const lst = {
			type: "list",
			style: "list-hang-notitle",
			items: stats[prop].slice(0, ixEnd + 1)
				.map(it => ({type: "item", ...it})),
		};
		stats[prop].splice(0, ixEnd + 1, lst);
	}

	/** Attempt to pull out "usage" notes which have been mistakenly included in lists etc. */
	static _mutCoalesce_separateUsageNote ({stats, prop, styleHint}) {
		if (styleHint === SITE_STYLE__CLASSIC) return;

		stats[prop] = this._WALKER.walk(
			stats[prop],
			{
				array: (arr, objProp) => {
					if (objProp !== "entries") return arr;

					const entLast = arr.at(-1);
					if (entLast?.type !== "list" || entLast?.style !== "list-hang-notitle" || !entLast?.items?.length) return arr;

					const itmLast = entLast.items.at(-1);
					if (
						itmLast?.type !== "item"
						|| !itmLast?.entries?.length
						|| itmLast.entries.length < 2
						|| typeof itmLast.entries.at(-1) !== "string"
					) return arr;

					if (!/^(When|Once)/i.test(itmLast.entries.at(-1))) return arr;

					const txtLast = itmLast.entries.pop();
					arr.push(txtLast);

					return arr;
				},
			},
			"entries",
		);
	}
}

export class EntryCoalesceRawLines {
	static _StateCoalesce = class {
		constructor ({ptrI, toConvert}) {
			this.ptrI = ptrI;
			this.toConvert = toConvert;

			this.entries = [];
			this.stack = [this.entries];
			this.curLine = toConvert[ptrI._].trim();

			this.isPrevLineNameLine = false;
		}

		popList () { while (this.stack.last().type === "list") this.stack.pop(); }
		popNestedEntries () { while (this.stack.length > 1) this.stack.pop(); }

		getCurrentEntryArray () {
			if (this.stack.last().type === "list") return this.stack.last().items;
			if (this.stack.last().type === "entries") return this.stack.last().entries;
			if (this.stack.last() instanceof Array) return this.stack.last();
			return null;
		}

		addEntry ({entry, isAllowCombine = false}) {
			isAllowCombine = isAllowCombine && typeof entry === "string";

			const target = this.stack.last();
			if (target instanceof Array) {
				if (isAllowCombine && typeof target.last() === "string") {
					target.last(`${target.last().trimEnd()} ${entry.trimStart()}`);
				} else {
					target.push(entry);
				}
			} else if (target.type === "list") {
				if (isAllowCombine && typeof target.items.last() === "string") {
					target.items.last(`${target.items.last().trimEnd()} ${entry.trimStart()}`);
				} else {
					target.items.push(entry);
				}
			} else if (target.type === "entries") {
				if (isAllowCombine && typeof target.entries.last() === "string") {
					target.entries.last(`${target.entries.last().trimEnd()} ${entry.trimStart()}`);
				} else {
					target.entries.push(entry);
				}
			}

			if (typeof entry !== "string") this.stack.push(entry);
		}

		incrementLine ({offset = 1, isPrevLineNameLine = false} = {}) {
			this.ptrI._ += offset;
			this.curLine = this.toConvert[this.ptrI._];
			this.isPrevLineNameLine = isPrevLineNameLine;
		}

		getRemainingLines ({isFilterEmpty = false} = {}) {
			const slice = this.toConvert.slice(this.ptrI._);
			return !isFilterEmpty
				? slice
				: slice.filter(l => l.trim());
		}
	};

	/**
	 *
	 * @param ptrI
	 * @param toConvert
	 * @param [opts]
	 * @param [opts.fnStop] Function which should return true for the current line if it is to stop coalescing.
	 */
	static mutGetCoalesced (ptrI, toConvert, opts) {
		opts = opts || {};

		if (toConvert[ptrI._] == null) return [];

		const state = new this._StateCoalesce({ptrI, toConvert});

		while (ptrI._ < toConvert.length) {
			if (opts.fnStop && opts.fnStop(state.curLine)) break;

			if (ConverterUtils.isJsonLine(state.curLine)) {
				state.popNestedEntries(); // this implicitly pops nested lists
				state.addEntry({entry: ConverterUtils.getJsonFromLine(state.curLine), isSkipStack: true});
				state.popNestedEntries();
				state.incrementLine();
				continue;
			}

			if (ConverterUtils.isListItemLine(state.curLine)) {
				if (state.stack.last().type !== "list") {
					const list = {
						type: "list",
						items: [],
					};
					state.addEntry({entry: list});
				}

				state.curLine = state.curLine.replace(/^\s*[•●]\s*/, "");
				state.addEntry({entry: state.curLine.trim()});
				state.incrementLine();
				continue;
			}

			const tableMeta = this._coalesceLines_getTableMeta({state});
			if (tableMeta) {
				state.addEntry({entry: tableMeta.table});
				state.incrementLine({offset: tableMeta.offsetIx});
				continue;
			}

			if (ConverterUtils.isNameLine(state.curLine)) {
				state.popNestedEntries(); // this implicitly pops nested lists

				const {name, entry} = ConverterUtils.splitNameLine(state.curLine);

				const parentEntry = {
					type: "entries",
					name,
					entries: [entry],
				};

				state.addEntry({entry: parentEntry});
				state.incrementLine({isPrevLineNameLine: true});
				continue;
			}

			if (ConverterUtils.isTitleLine(state.curLine)) {
				state.popNestedEntries(); // this implicitly pops nested lists

				const entry = {
					type: "entries",
					name: state.curLine.trim(),
					entries: [],
				};

				state.addEntry({entry});
				state.incrementLine();
				continue;
			}

			const lineContinuationType = ConverterUtils.getContinuationLineType(state.getCurrentEntryArray(), state.curLine);
			if (lineContinuationType.isContinuation) {
				state.addEntry({entry: state.curLine.trim(), isAllowCombine: true});
				state.incrementLine();
				continue;
			}

			if (this._coalesceLines_isLikelyContinuationLineHeuristic({state, lineContinuationType})) {
				state.addEntry({entry: state.curLine.trim(), isAllowCombine: true});
				state.incrementLine();
				continue;
			}

			state.popList();
			state.addEntry({entry: state.curLine.trim()});
			state.incrementLine();
		}

		this._coalesceLines_postProcessLists({entries: state.entries});

		return state.entries;
	}

	// region Table conversion
	// Parses a (very) limited set of inputs: two-column rollable tables with well-formatted rows
	static _RE_TABLE_COLUMNS = null;

	static _coalesceLines_getTableMeta ({state}) {
		const linesRemaining = state.getRemainingLines({isFilterEmpty: true});
		let offsetIx = 0;

		let caption = null;
		if (ConverterUtils.isTitleLine(linesRemaining[0])) {
			caption = linesRemaining[0].trim();
			linesRemaining.shift();
			offsetIx++;
		}

		const lineHeaders = linesRemaining.shift();
		offsetIx++;

		this._RE_TABLE_COLUMNS ||= new RegExp(`^\\s*(?<dice>${RollerUtil.DICE_REGEX.source}) +(?<header>.*)$`);
		const mHeaders = this._RE_TABLE_COLUMNS.exec(lineHeaders);
		if (!mHeaders) return null;

		const rows = [];
		for (const l of linesRemaining) {
			const [cell0, ...rest] = l.trim()
				.split(/\s+/)
				.map(it => it.trim())
				.filter(Boolean);
			if (!Renderer.table.isRollableCell(cell0)) break;
			rows.push([
				cell0,
				rest.join(" "),
			]);
			offsetIx++;
		}
		if (!rows.length) return null;

		const table = {type: "table"};
		if (caption) table.caption = caption;
		Object.assign(
			table,
			{
				colLabels: [
					mHeaders.groups.dice.trim(),
					mHeaders.groups.header.trim(),
				],
				colStyles: [
					"col-2 text-center",
					"col-10",
				],
				rows,
			},
		);

		return {table, offsetIx};
	}
	// endregion

	static _AMBIGUOUS_CONTINUATION_LINE_CHAR_LIMIT = 35;

	/**
	 * Assume short lines can be inlined, e.g.:
	 *
	 * ```
	 * Change Appearance. You alter your appearance.
	 * You decide what you look like, including your
	 * ...
	 * ```
	 *
	 * Assumes double-column text of ~55 character width,
	 *   with ~1/3rd of an inline-header line being the
	 *   inline header.
	 */
	static _coalesceLines_isLikelyContinuationLineHeuristic (
		{
			state,
			lineContinuationType,
		},
	) {
		if (
			!lineContinuationType.isPossible
			|| !state.isPrevLineNameLine
		) return false;

		const entryPrev = state.getCurrentEntryArray().at(-1); // implicitly a string as `isPossible` continuation
		if (typeof entryPrev !== "string") throw new Error(`Unexpected non-string entry!`);

		if (entryPrev.length > this._AMBIGUOUS_CONTINUATION_LINE_CHAR_LIMIT) return false;
		return true;
	}

	static _coalesceLines_postProcessLists ({entries}) {
		const walker = MiscUtil.getWalker({isNoModification: true});

		walker.walk(
			entries,
			{
				object: obj => {
					if (obj.type !== "list") return;
					if (obj.style) return;
					if (!obj.items.length) return;

					if (!obj.items.every(li => {
						if (typeof li !== "string") return false;

						return ConverterUtils.isNameLine(li);
					})) return;

					obj.style = "list-hang-notitle";
					obj.items = obj.items
						.map(li => {
							const {name, entry} = ConverterUtils.splitNameLine(li);

							return {
								type: "item",
								name,
								entry,
							};
						});
				},
			},
		);
	}
}
