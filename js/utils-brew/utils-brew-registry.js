export class BrewUtilRegistry {
	static _REGISTERED = {};

	static doRegister (brewUtil) { this._REGISTERED[brewUtil.ID] = brewUtil; }

	static getBrewUtil (id) { return this._REGISTERED[id]; }
}
