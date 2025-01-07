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

	/* ----- */

	static tryRunProps (ent, props, ...rest) {
		props
			.filter(prop => ent[prop])
			.forEach(prop => ent[prop] = ent[prop].map(subEnt => this.tryRun(subEnt, ...rest)));
		return ent;
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

	/* ----- */

	static tryRunPropsStrictCapsWords (ent, props, ...rest) {
		props
			.filter(prop => ent[prop])
			.forEach(prop => ent[prop] = ent[prop].map(subEnt => this.tryRunStrictCapsWords(subEnt, ...rest)));
		return ent;
	}
}
