export class UtilsOmnisearch {
	static getUnpackedSearchResult (r) {
		const {
			s: source,
			sA: sourceAbvRaw,
			sF: sourceFullRaw,
			sC: sourceColor,
			p: page,
			r: isSrd,
			dP: isPartnered,
			h: isHoverable,
			c: category,
			u: hash,
		} = r;

		const ptStyle = sourceColor
			? `style="${MiscUtil.getColorStylePart(sourceColor)}"`
			: source
				? Parser.sourceJsonToStyle(source)
				: "";

		const sourceAbv = sourceAbvRaw || (source ? Parser.sourceJsonToAbv(source) : null);
		const sourceFull = sourceFullRaw || (source ? Parser.sourceJsonToFull(source) : null);

		return {
			source,
			sourceColor,
			page,
			isSrd,
			isPartnered,
			isHoverable,
			category,
			hash,

			// Derived
			ptStyle,
			sourceAbv,
			sourceFull,
		};
	}
}
