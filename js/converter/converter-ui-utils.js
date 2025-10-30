export class ConverterUiUtil {
	static renderSideMenuDivider (menu, isHeavy) { menu.appends(`<hr class="sidemenu__row__divider ${isHeavy ? "sidemenu__row__divider--heavy" : ""} w-100 hr-2">`); }

	static getAceMode (inputMode) {
		return {
			"md": "ace/mode/markdown",
			"html": "ace/mode/html",
		}[inputMode] || "ace/mode/text";
	}
}
