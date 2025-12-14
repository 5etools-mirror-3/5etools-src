export class UtilsOmnisearch {
	static getUnpackedSearchResult (r) {
		const {
			s: source,
			sA: sourceAbvRaw,
			sF: sourceFullRaw,
			p: page,
			r: isSrd,
			r2: isSrd52,
			dP: isPartnered,
			dR: isReprinted,
			h: isHoverable,
			c: category,
			u: hash,
		} = r;

		const sourceAbv = sourceAbvRaw || (source ? Parser.sourceJsonToAbv(source) : null);
		const sourceFull = sourceFullRaw || (source ? Parser.sourceJsonToFull(source) : null);

		return {
			source,
			page,
			isSrd,
			isSrd52,
			isPartnered,
			isReprinted,
			isHoverable,
			category,
			hash,

			// Derived
			sourceAbv,
			sourceFull,
		};
	}
}
