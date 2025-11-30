export class FilterUtils {
	static getEscapedPipes (str) {
		return str.replace(/\|/g, "\\|");
	}

	static getUnescapedPipes (str) {
		return str.replace(/\\\|/g, "|");
	}
}
