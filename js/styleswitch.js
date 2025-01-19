"use strict";

class StyleSwitcher {
	static _STORAGE_DAY_NIGHT = "StyleSwitcher_style";
	static _STORAGE_IS_MANUAL_MODE = "StyleSwitcher_style-is-manual-mode";
	static _STORAGE_WIDE = "StyleSwitcher_style-wide";

	static _STYLE_DAY = "day";
	static _STYLE_NIGHT = "night";
	static _STYLE_NIGHT_ALT = "nightAlt";
	static _STYLE_NIGHT_CLEAN = "nightClean";

	static _NIGHT_CLASS = "ve-night-mode";
	static _NIGHT_CLASS_STANDARD = "ve-night-mode--standard";
	static _NIGHT_CLASS_ALT = "ve-night-mode--classic";
	static _NIGHT_CLASS_CLEAN = "ve-night-mode--clean";

	static _WIDE_ID = "style-switch__wide";

	static _STYLES = [
		this._STYLE_DAY,
		this._STYLE_NIGHT,
		this._STYLE_NIGHT_ALT,
		this._STYLE_NIGHT_CLEAN,
	];

	static _STYLE_TO_DISPLAY_NAME = {
		[this._STYLE_DAY]: "Day Mode",
		[this._STYLE_NIGHT]: "Night Mode",
		[this._STYLE_NIGHT_ALT]: "Night Mode (Classic)",
		[this._STYLE_NIGHT_CLEAN]: "Night Mode (Clean)",
	};

	static _STYLE_CLASSES = [
		this._NIGHT_CLASS,
		this._NIGHT_CLASS_STANDARD,
		this._NIGHT_CLASS_ALT,
		this._NIGHT_CLASS_CLEAN,
	];

	/* -------------------------------------------- */

	static getSelStyle () {
		const selStyle = e_({
			tag: "select",
			clazz: "form-control input-xs",
			children: Object.entries(this._STYLE_TO_DISPLAY_NAME)
				.map(([id, name]) => ee`<option value="${id}">${name}</option>`),
			change: () => {
				styleSwitcher._setActiveDayNight(selStyle.val());
				StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_IS_MANUAL_MODE, true);
			},
		})
			.val(styleSwitcher.currentStylesheet);

		return selStyle;
	}

	/* -------------------------------------------- */

	static getCbWide () {
		const cbWide = e_({
			tag: "input",
			type: "checkbox",
			change: () => {
				styleSwitcher._setActiveWide(cbWide.checked);
			},
		});

		if (StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_WIDE) === "true") cbWide.checked = true;

		return cbWide;
	}

	/* -------------------------------------------- */

	constructor () {
		this.currentStylesheet = StyleSwitcher._STYLE_DAY;

		// If the user has never manually specified a style, always load the default from their OS
		const isManualMode = StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_IS_MANUAL_MODE);
		if (isManualMode) {
			this._setActiveDayNight(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_DAY_NIGHT) || StyleSwitcher._getDefaultStyleDayNight());
		} else {
			this._setActiveDayNight(StyleSwitcher._getDefaultStyleDayNight());
		}

		this._setActiveWide(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_WIDE) === "true");
	}

	static _setButtonText (btnClassName, text) {
		[...document.getElementsByClassName(btnClassName)].forEach(ele => ele.innerHTML = text);
	}

	getSummary () {
		return {isNight: this.currentStylesheet !== StyleSwitcher._STYLE_DAY};
	}

	_fnsOnChange = [];
	addFnOnChange (fn) { this._fnsOnChange.push(fn); }

	// region Night Mode
	_setActiveDayNight (style) {
		this.currentStylesheet = style;

		this.constructor._STYLE_CLASSES
			.forEach(clazzName => document.documentElement.classList.remove(clazzName));

		switch (style) {
			case StyleSwitcher._STYLE_DAY: {
				break;
			}
			case StyleSwitcher._STYLE_NIGHT: {
				document.documentElement.classList.add(StyleSwitcher._NIGHT_CLASS);
				document.documentElement.classList.add(StyleSwitcher._NIGHT_CLASS_STANDARD);
				break;
			}
			case StyleSwitcher._STYLE_NIGHT_ALT: {
				document.documentElement.classList.add(StyleSwitcher._NIGHT_CLASS);
				document.documentElement.classList.add(StyleSwitcher._NIGHT_CLASS_ALT);
				break;
			}
			case StyleSwitcher._STYLE_NIGHT_CLEAN: {
				document.documentElement.classList.add(StyleSwitcher._NIGHT_CLASS);
				document.documentElement.classList.add(StyleSwitcher._NIGHT_CLASS_CLEAN);
				break;
			}
		}

		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_DAY_NIGHT, this.currentStylesheet);

		this._fnsOnChange.forEach(fn => fn());
	}

	getDayNightClassNames () {
		switch (this.currentStylesheet) {
			case StyleSwitcher._STYLE_DAY: return "";
			case StyleSwitcher._STYLE_NIGHT: return [StyleSwitcher._NIGHT_CLASS, StyleSwitcher._NIGHT_CLASS_STANDARD].join(" ");
			case StyleSwitcher._STYLE_NIGHT_ALT: return [StyleSwitcher._NIGHT_CLASS, StyleSwitcher._NIGHT_CLASS_ALT].join(" ");
			case StyleSwitcher._STYLE_NIGHT_CLEAN: return [StyleSwitcher._NIGHT_CLASS, StyleSwitcher._NIGHT_CLASS_CLEAN].join(" ");
		}
	}

	static _getDefaultStyleDayNight () {
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) return StyleSwitcher._STYLE_NIGHT;
		return StyleSwitcher._STYLE_DAY;
	}

	cycleDayNightMode (direction) {
		const ixCur = this.constructor._STYLES.indexOf(this.currentStylesheet);
		const ixNxt = ixCur === 0
			? this.constructor._STYLES.length - 1
			: ixCur === this.constructor._STYLES.length - 1
				? 0
				: ixCur + direction;
		const newStyle = this.constructor._STYLES[ixNxt];

		this._setActiveDayNight(newStyle);
		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_IS_MANUAL_MODE, true);
	}
	// endregion

	// region Wide Mode
	_setActiveWide (isActive) {
		const existing = document.getElementById(StyleSwitcher._WIDE_ID);
		if (!isActive) {
			document.documentElement.classList.remove(StyleSwitcher._WIDE_ID);
			if (existing) existing.parentNode.removeChild(existing);
		} else {
			document.documentElement.classList.add(StyleSwitcher._WIDE_ID);
			if (!existing) {
				const eleScript = document.createElement(`style`);
				eleScript.id = StyleSwitcher._WIDE_ID;
				eleScript.innerHTML = `
				/* region Book/Adventure pages */
				@media only screen and (min-width: 1600px) {
					#listcontainer.book-contents {
						position: relative;
					}

					.book-contents .contents {
						position: sticky;
					}
				}
				/* endregion */

				/* region Overwrite Bootstrap containers */
				@media (min-width: 768px) {
					.container {
						width: 100%;
					}
				}

				@media (min-width: 992px) {
					.container {
						width: 100%;
					}
				}

				@media (min-width: 1200px) {
					.container {
						width: 100%;
					}
				}
				/* endregion */`;
				document.documentElement.appendChild(eleScript);
			}
		}
		StyleSwitcher._setButtonText("wideModeToggle", isActive ? "Disable Wide Mode" : "Enable Wide Mode (Experimental)");
		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_WIDE, isActive);
	}

	toggleWide () {
		if (this.getActiveWide()) this._setActiveWide(false);
		else this._setActiveWide(true);
	}

	getActiveWide () { return document.getElementById(StyleSwitcher._WIDE_ID) != null; }
	// endregion
}

try {
	StyleSwitcher.storage = window.localStorage;
} catch (e) { // cookies are disabled
	StyleSwitcher.storage = {
		getItem (k) {
			switch (k) {
				case StyleSwitcher._STORAGE_DAY_NIGHT: return StyleSwitcher._getDefaultStyleDayNight();
				case StyleSwitcher._STORAGE_WIDE: return false;
			}
			return null;
		},

		setItem (k, v) {},
	};
}

const styleSwitcher = new StyleSwitcher();
