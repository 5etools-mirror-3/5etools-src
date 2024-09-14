import {SUB_HASH_PREFIX_LENGTH} from "./filter-constants.js";

export class FilterRegistry {
	static SUB_HASH_PREFIXES = new Set();

	static registerSubhashes (subhashes) {
		const subhashesInvalid = subhashes.filter(it => it.length !== SUB_HASH_PREFIX_LENGTH);

		if (subhashesInvalid.length) throw new Error(`Invalid prefix! ${subhashesInvalid.map(it => `"${it}"`).join(", ")} ${subhashesInvalid.length === 1 ? `is` : `was`} not of length ${SUB_HASH_PREFIX_LENGTH}`);

		subhashes.forEach(it => this.SUB_HASH_PREFIXES.add(it));
	}
}
