/**
 * @abstract
 */
export class CrScalerBase {
	constructor (
		{
			mon,
			crInNumber,
			crOutNumber,
			pbIn,
			pbOut,
			state,
		},
	) {
		this._mon = mon;
		this._crInNumber = crInNumber;
		this._crOutNumber = crOutNumber;
		this._pbIn = pbIn;
		this._pbOut = pbOut;
		this._state = state;
	}

	/**
	 * @abstract
	 * @return {void}
	 */
	doAdjust () { throw new Error("Unimplemented!"); }
}
