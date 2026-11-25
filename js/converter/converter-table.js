import {ConverterBase} from "./converter-base.js";

export class ConverterTable extends ConverterBase {
	/**
	 * Parses tables from HTML.
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 * @param options.source Entity source.
	 * @param options.page Entity page.
	 * @param options.titleCaseFields Array of fields to be title-cased in this entity (if enabled).
	 * @param options.isTitleCase Whether title-case fields should be title-cased in this entity.
	 */
	static doParseHtml (inText, options) {
		options = this._getValidOptions(options);

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		inText = this._getCleanInput(inText, options);

		const wrpInput = veT`<div>${inText}</div>`;
		if (wrpInput.vee.first().vee.is("table")) {
			this._doParseHtml_doConvertEleTable(wrpInput.vee.first(), options);
		} else {
			// TODO pull out any preceding text to use as the caption; pass this in
			const caption = "";
			wrpInput
				.vee.findAll("table")
				.forEach((eleTable, i) => {
					this._doParseHtml_doConvertEleTable(eleTable, options, {caption, isForceAppend: !!i});
				});
		}
	}

	/**
	 * @param {HTMLElementExtended} eleTable
	 * @param options
	 * @param {?string} caption
	 * @param {?boolean} isForceAppend
	 */
	static _doParseHtml_doConvertEleTable (eleTable, options, {caption = null, isForceAppend = false} = {}) {
		const tbl = {
			type: "table",
			caption,
			colLabels: [],
			colStyles: [],
			rows: [],
		};

		const getCleanHeaderText = (ele) => {
			let txt = ele.vee.txt().trim();

			// if it's all-uppercase, title-case it
			if (txt.toUpperCase() === txt) txt = txt.toTitleCase();

			return txt;
		};

		// Caption
		const elesCaption = eleTable.vee.findAll(`caption`);
		if (elesCaption.length) {
			tbl.caption = elesCaption.map(ele => ele.vee.txt().trim()).join(" ");
		}

		// Columns
		const eleTableHead = eleTable.vee.find(`thead`);
		if (eleTableHead) {
			const elesHeaderRow = eleTableHead.vee.findAll(`tr`);
			if (elesHeaderRow.length !== 1) options.cbWarning(`Table header had ${elesHeaderRow.length} rows!`);
			elesHeaderRow.forEach((eleHeaderRow, i) => {
				// use first tr as column headers
				if (!i) {
					eleHeaderRow.vee.findAll(`th, td`).forEach(ele => tbl.colLabels.push(getCleanHeaderText(ele)));
					return;
				}

				// use others as rows
				const rowEntries = [];
				eleHeaderRow.vee.findAll(`th, td`).forEach(ele => rowEntries.push(getCleanHeaderText(ele)));
				if (rowEntries.length) tbl.rows.push(rowEntries);
			});
			eleTableHead.remove();
		} else {
			eleTable.vee.findAll("th")
				.forEach(ele => {
					tbl.colLabels.push(getCleanHeaderText(ele));
					ele.remove();
				});
		}

		// Rows
		const handleTableRow = (eleBodyRow, i) => {
			const rowEntries = [];
			eleBodyRow
				.vee.findAll(`td`)
				.forEach(eleCell => {
					rowEntries.push(eleCell.vee.txt().trim());
				});
			tbl.rows.push(rowEntries);
		};

		const eleTableBody = eleTable.vee.find(`tbody`);
		if (eleTableBody) {
			eleTableBody.vee.findAll(`tr`).forEach(handleTableRow);
		} else {
			eleTable.vee.find(`tr`).forEach(handleTableRow);
		}

		MarkdownConverter.postProcessTable(tbl);
		options.cbOutput(tbl, options.isAppend || isForceAppend);
		return tbl;
	}

	/**
	 * Parses tables from Markdown.
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 * @param options.source Entity source.
	 * @param options.page Entity page.
	 * @param options.titleCaseFields Array of fields to be title-cased in this entity (if enabled).
	 * @param options.isTitleCase Whether title-case fields should be title-cased in this entity.
	 */
	static doParseMarkdown (inText, options) {
		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		inText = this._getCleanInput(inText, options);

		const lines = inText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n/g);
		const stack = [];
		let cur = null;
		lines.forEach(l => {
			if (l.trim().startsWith("##### ")) {
				if (cur && cur.lines.length) stack.push(cur);
				cur = {caption: l.trim().replace(/^##### /, ""), lines: []};
			} else {
				cur = cur || {lines: []};
				cur.lines.push(l);
			}
		});
		if (cur && cur.lines.length) stack.push(cur);

		const toOutput = stack.map(tbl => MarkdownConverter.getConvertedTable(tbl.lines, tbl.caption)).reverse();
		toOutput.forEach((out, i) => {
			if (options.isAppend) options.cbOutput(out, true);
			else {
				if (i === 0) options.cbOutput(out, false);
				else options.cbOutput(out, true);
			}
		});
		return toOutput;
	}
}
