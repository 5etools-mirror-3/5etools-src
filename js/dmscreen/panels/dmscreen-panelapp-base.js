/** @abstract */
export class DmScreenPanelAppBase {
	static getPanelApp ({board, savedState}) {
		return new this({board, savedState});
	}

	constructor ({board, savedState}) {
		this._board = board;
		this._savedState = savedState;
	}

	/**
	 * @abstract
	 * @return {Object}
	 */
	getState () { throw new Error("Unimplemented!"); }

	getPanelElement () {
		return this._getPanelElement(this._board, this._savedState);
	}

	/**
	 * @abstract
	 * @return {HTMLElementExtended}
	 */
	_getPanelElement (board, state) { throw new Error("Unimplemented!"); }

	getSaveSlotCacheableElementMeta () { return null; }
	doRestoreSaveSlotCacheableElementMeta (meta) {}

	getDetachableExileElements () { return []; }
}

/**
 * @abstract
 *
 * Notes:
 *
 *  - `moveBefore` avoids removing the element from the DOM, which preserves
 *    iframe state.
 *    This is therefore used when switching between save slots, to enable
 *    the "Preserve Embeds on Save Slot Change" option.
 *  - `replaceWith`/`detach`/etc. *does* remove the element from the DOM,
 *    destroying iframe state.
 *    This is beneficial when exiling a panel to the sidebar; i.e., we
 *    do not want YouTube videos to keep playing when a tab has been removed.
 *
 * We therefore have two similar, but subtly-different, methods for moving the
 *   iframe into/out of/around the DOM.
 */
export class DmScreenPanelAppIframeBase extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._eleIframe = [];
	}

	_registerIframe (eleIframe) {
		return this._eleIframe = eleIframe;
	}

	getSaveSlotCacheableElementMeta () {
		return {
			iframe: this._eleIframe,
		};
	}

	doRestoreSaveSlotCacheableElementMeta (meta) {
		this._eleIframe
			.vee.parent()
			.vee.appendsMove(meta.iframe);
		this._eleIframe.remove();
		this._eleIframe = meta.iframe;
	}

	getDetachableExileElements () {
		return [this._eleIframe];
	}

	getState () { return this._savedState; }
}
