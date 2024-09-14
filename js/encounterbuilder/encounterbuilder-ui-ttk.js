export class EncounterBuilderUiTtk {
	static getApproxTurnsToKill ({partyMeta, creatureMetas}) {
		const playerMetas = partyMeta.levelMetas;
		if (!playerMetas.length) return 0;

		const totalDpt = playerMetas
			.map(playerMeta => this._getApproxDpt(playerMeta.level) * playerMeta.count)
			.sum();

		const totalHp = creatureMetas
			.map(creatureMeta => {
				const approxHp = creatureMeta.getApproxHp();
				const approxAc = creatureMeta.getApproxAc();

				if (approxHp == null || approxAc == null) return 0;

				return (approxHp * (approxAc / 10)) * creatureMeta.count;
			})
			.sum();

		return totalHp / totalDpt;
	}

	static _APPROX_OUTPUT_FIGHTER_CHAMPION = [
		{hit: 0, dmg: 17.38}, {hit: 0, dmg: 17.38}, {hit: 0, dmg: 17.59}, {hit: 0, dmg: 33.34}, {hit: 1, dmg: 50.92}, {hit: 2, dmg: 53.92}, {hit: 2, dmg: 53.92}, {hit: 3, dmg: 56.92}, {hit: 4, dmg: 56.92}, {hit: 4, dmg: 56.92}, {hit: 4, dmg: 76.51}, {hit: 4, dmg: 76.51}, {hit: 5, dmg: 76.51}, {hit: 5, dmg: 76.51}, {hit: 5, dmg: 77.26}, {hit: 5, dmg: 77.26}, {hit: 6, dmg: 77.26}, {hit: 6, dmg: 77.26}, {hit: 6, dmg: 77.26}, {hit: 6, dmg: 97.06},
	];
	static _APPROX_OUTPUT_ROGUE_TRICKSTER = [
		{hit: 5, dmg: 11.4}, {hit: 5, dmg: 11.4}, {hit: 10, dmg: 15.07}, {hit: 11, dmg: 16.07}, {hit: 12, dmg: 24.02}, {hit: 12, dmg: 24.02}, {hit: 12, dmg: 27.7}, {hit: 13, dmg: 28.7}, {hit: 14, dmg: 32.38}, {hit: 14, dmg: 32.38}, {hit: 14, dmg: 40.33}, {hit: 14, dmg: 40.33}, {hit: 15, dmg: 44}, {hit: 15, dmg: 44}, {hit: 15, dmg: 47.67}, {hit: 15, dmg: 47.67}, {hit: 16, dmg: 55.63}, {hit: 16, dmg: 55.63}, {hit: 16, dmg: 59.3}, {hit: 16, dmg: 59.3},
	];
	static _APPROX_OUTPUT_WIZARD = [
		{hit: 5, dmg: 14.18}, {hit: 5, dmg: 14.18}, {hit: 5, dmg: 22.05}, {hit: 6, dmg: 22.05}, {hit: 2, dmg: 28}, {hit: 2, dmg: 28}, {hit: 2, dmg: 36}, {hit: 3, dmg: 36}, {hit: 6, dmg: 67.25}, {hit: 6, dmg: 67.25}, {hit: 4, dmg: 75}, {hit: 4, dmg: 75}, {hit: 5, dmg: 85.5}, {hit: 5, dmg: 85.5}, {hit: 5, dmg: 96}, {hit: 5, dmg: 96}, {hit: 6, dmg: 140}, {hit: 6, dmg: 140}, {hit: 6, dmg: 140}, {hit: 6, dmg: 140},
	];
	static _APPROX_OUTPUT_CLERIC = [
		{hit: 5, dmg: 17.32}, {hit: 5, dmg: 17.32}, {hit: 5, dmg: 23.1}, {hit: 6, dmg: 23.1}, {hit: 7, dmg: 28.88}, {hit: 7, dmg: 28.88}, {hit: 7, dmg: 34.65}, {hit: 8, dmg: 34.65}, {hit: 9, dmg: 40.42}, {hit: 9, dmg: 40.42}, {hit: 9, dmg: 46.2}, {hit: 9, dmg: 46.2}, {hit: 10, dmg: 51.98}, {hit: 10, dmg: 51.98}, {hit: 11, dmg: 57.75}, {hit: 11, dmg: 57.75}, {hit: 11, dmg: 63.52}, {hit: 11, dmg: 63.52}, {hit: 11, dmg: 63.52}, {hit: 11, dmg: 63.52},
	];

	static _APPROX_OUTPUTS = [this._APPROX_OUTPUT_FIGHTER_CHAMPION, this._APPROX_OUTPUT_ROGUE_TRICKSTER, this._APPROX_OUTPUT_WIZARD, this._APPROX_OUTPUT_CLERIC];

	static _getApproxDpt (pcLevel) {
		const approxOutput = this._APPROX_OUTPUTS.map(it => it[pcLevel - 1]);
		return approxOutput.map(it => it.dmg * ((it.hit + 10.5) / 20)).mean(); // 10.5 = average d20
	}
}
