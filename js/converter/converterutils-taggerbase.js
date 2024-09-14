/** @abstract */
export class ConverterTaggerBase {
	/** @abstract */
	static tryRun (...args) {
		throw new Error("Unimplemented!");
	}
}

/** @abstract */
export class ConverterTaggerInitializable extends ConverterTaggerBase {
	static _IS_INIT = false;

	static async pInit (...args) {
		await this._pInit(...args);
		this._IS_INIT = true;
	}

	/** @abstract */
	static async _pInit (...args) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	static tryRun (...args) {
		if (!this._IS_INIT) throw new Error("Not initialized!");
		return this._tryRun(...args);
	}

	/** @abstract */
	static _tryRun (...args) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	static tryRunStrictCapsWords (...args) {
		if (!this._IS_INIT) throw new Error("Not initialized!");
		return this._tryRunStrictCapsWords(...args);
	}

	/** @abstract */
	static _tryRunStrictCapsWords (...args) {
		throw new Error("Unimplemented!");
	}
}
