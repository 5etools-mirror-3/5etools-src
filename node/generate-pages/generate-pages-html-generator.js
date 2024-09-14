class _HtmlGenerator {
	static _getAttrClass (str, {classListAdditional = null} = {}) {
		const pts = [
			str,
			classListAdditional?.length ? classListAdditional.join(" ") : "",
		]
			.filter(Boolean)
			.join(" ");
		if (!pts) return null;
		return `class="${pts}"`;
	}
}

export class HtmlGeneratorListButtons extends _HtmlGenerator {
	static getBtnPreviewToggle () {
		return `<button type="button" class="ve-col-0-3 ve-btn ve-btn-default ve-btn-xs p-0 lst__btn-collapse-all-previews no-select" name="list-toggle-all-previews">[+]</button>`;
	}

	static getBtnSource () {
		return `<button type="button" class="sort ve-btn ve-btn-default ve-btn-xs ve-grow" data-sort="source">Source</button>`;
	}

	/**
	 * @param {?string} width
	 * @param {?string} sortIdent
	 * @param {string} text
	 * @param {?string} title
	 * @param {?boolean} isDisabled
	 * @param {?Array<string>} classListAdditional
	 * @return {string}
	 */
	static getBtn (
		{
			width = null,
			sortIdent = null,
			text,
			title = null,
			isDisabled = false,
			classListAdditional = null,
		},
	) {
		const attrs = [
			this._getAttrClass(`${width ? `ve-col-${width}` : `ve-grow`} sort ve-btn ve-btn-default ve-btn-xs`, {classListAdditional}),
			sortIdent ? `data-sort="${sortIdent}"` : null,
			title ? `title="${title}"` : null,
			isDisabled ? `disabled` : null,
		]
			.filter(Boolean)
			.join(" ");

		return `<button type="button" ${attrs}>${text}</button>`;
	}
}
