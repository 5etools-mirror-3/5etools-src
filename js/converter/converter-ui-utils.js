export class ConverterUiUtil {
	static getAceMode (inputMode) {
		return {
			"md": "ace/mode/markdown",
			"html": "ace/mode/html",
		}[inputMode] || "ace/mode/text";
	}
}
