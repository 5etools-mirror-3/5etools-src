export class CreatureSlot {
	constructor ({spendAmount, count}) {
		this.spendAmount = spendAmount;
		this.count = count;
	}

	getTotalSpend ({playerAdjustedSpendMult, countAdditional = 0}) { return this.spendAmount * (this.count + countAdditional) * playerAdjustedSpendMult; }
}

export class EncounterTemplateOptions {
	/**
	 * @param {Array<Array<CreatureSlot>>} templateOptions
	 * @param {?string} message
	 * @param {boolean} isUniqueKeys
	 */
	constructor (
		{
			templateOptions = undefined,
			message = undefined,
			isUniqueKeys = false,
		} = {},
	) {
		this.templateOptions = templateOptions;
		this.message = message;
		this.isUniqueKeys = isUniqueKeys;
	}
}
