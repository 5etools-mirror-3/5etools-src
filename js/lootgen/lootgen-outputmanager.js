export class LootGenUiOutputManager {
	constructor () {
		this._wrpOutputRows = null;
		this._lootOutputs = [];
	}

	setWrpOutputRows (val) {
		return this._wrpOutputRows = val;
	}

	doAddOutput ({lootOutput}) {
		if (!this._wrpOutputRows) throw new Error("Not initialized!");

		this._lootOutputs.push(lootOutput);
		lootOutput.render(this._wrpOutputRows);
	}

	doClearOutput () {
		this._lootOutputs.forEach(it => it.doRemove());
		this._lootOutputs = [];
	}
}
