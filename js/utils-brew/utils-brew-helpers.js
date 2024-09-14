export class BrewUtilShared {
	/** Prevent any injection shenanigans */
	static getValidColor (color, {isExtended = false} = {}) {
		if (isExtended) return color.replace(/[^-a-zA-Z\d]/g, "");
		return color.replace(/[^a-fA-F\d]/g, "").slice(0, 8);
	}
}
