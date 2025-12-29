/**
 * @abstract
 *
 * - Point buy
 * - hit values from save-or-damage calculated as `saveDc - 8 - 4`,
 *     which gives an equivalent chance of a hit vs AC 10/+0 save
 */
export class EncounterBuilderTtkBase {
	_approxOutputs;

	constructor ({partyMeta, creatureMetas}) {
		this._partyMeta = partyMeta;
		this._creatureMetas = creatureMetas;
	}

	_getApproxDpt (pcLevel) {
		const approxOutput = this._approxOutputs.map(it => it[pcLevel - 1]);
		return approxOutput.map(it => it.dmg * ((it.hit + 10.5) / 20)).mean(); // 10.5 = average d20
	}

	getApproxTurnsToKill () {
		const playerMetas = this._partyMeta?.levelMetas;
		if (!playerMetas?.length) return 0;

		const totalDpt = playerMetas
			.map(playerMeta => this._getApproxDpt(playerMeta.level) * playerMeta.count)
			.sum();

		const totalHp = this._creatureMetas
			.map(creatureMeta => {
				const approxHp = creatureMeta.getApproxHp();
				const approxAc = creatureMeta.getApproxAc();

				if (approxHp == null || approxAc == null) return 0;

				return (approxHp * (approxAc / 10)) * creatureMeta.getCount();
			})
			.sum();

		return totalHp / totalDpt;
	}
}
