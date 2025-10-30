export class StyleSwitcher {
	static _STORAGE_KEY_THEME = "StyleSwitcher_style";
	static _STORAGE_KEY_ROLLBOX = "StyleSwitcher_style-rollbox";
	static _STORAGE_KEY_WIDE = "StyleSwitcher_style-wide";

	static _STORAGE_KEYS = [
		this._STORAGE_KEY_THEME,
		this._STORAGE_KEY_ROLLBOX,
		this._STORAGE_KEY_WIDE,
	];

	static _STYLE_THEME_AUTOMATIC = "auto";
	static _STYLE_THEME_DAY = "day";
	static _STYLE_THEME_NIGHT = "night";
	static _STYLE_THEME_NIGHT_ALT = "nightAlt";
	static _STYLE_THEME_NIGHT_CLEAN = "nightClean";

	static _CLASS_THEME_NIGHT = "ve-night-mode";
	static _CLASS_THEME_NIGHT_STANDARD = "ve-night-mode--standard";
	static _CLASS_THEME_NIGHT_ALT = "ve-night-mode--classic";
	static _CLASS_THEME_NIGHT_CLEAN = "ve-night-mode--clean";

	static _STYLE_ROLLBOX_DEFAULT = "default";
	static _STYLE_ROLLBOX_RIGHT = "right";
	static _STYLE_ROLLBOX_LEFT = "left";

	static _CLASS_ROLLBOX_DEFAULT = "ve-rollbox-mode--default";
	static _CLASS_ROLLBOX_RIGHT = "ve-rollbox-mode--right";
	static _CLASS_ROLLBOX_LEFT = "ve-rollbox-mode--left";

	static _WIDE_ID = "style-switch__wide";

	static _STYLE_THEME_TO_DISPLAY_NAME = {
		[this._STYLE_THEME_AUTOMATIC]: "Browser Default",
		[this._STYLE_THEME_DAY]: "Day Mode",
		[this._STYLE_THEME_NIGHT]: "Night Mode",
		[this._STYLE_THEME_NIGHT_ALT]: "Night Mode (Classic)",
		[this._STYLE_THEME_NIGHT_CLEAN]: "Night Mode (Clean)",
	};

	static _STYLE_ROLLBOX_TO_DISPLAY_NAME = {
		[this._STYLE_ROLLBOX_DEFAULT]: "Default",
		[this._STYLE_ROLLBOX_RIGHT]: "Right",
		[this._STYLE_ROLLBOX_LEFT]: "Left",
	};

	static _CLASSES_THEME = [
		this._CLASS_THEME_NIGHT,
		this._CLASS_THEME_NIGHT_STANDARD,
		this._CLASS_THEME_NIGHT_ALT,
		this._CLASS_THEME_NIGHT_CLEAN,
	];

	static _CLASSES_ROLLBOX = [
		this._CLASS_ROLLBOX_DEFAULT,
		this._CLASS_ROLLBOX_RIGHT,
		this._CLASS_ROLLBOX_LEFT,
	];

	/* -------------------------------------------- */

	static getSelStyle () {
		const selStyle = e_({
			tag: "select",
			clazz: "form-control input-xs",
			children: Object.entries(this._STYLE_THEME_TO_DISPLAY_NAME)
				.map(([id, name]) => ee`<option value="${id}">${name}</option>`),
			change: () => {
				styleSwitcher._setActiveStyleTheme(selStyle.val());
			},
		})
			.val(styleSwitcher._styleTheme);

		return selStyle;
	}

	/* -------------------------------------------- */

	static getSelRollboxPosition () {
		const selStyle = e_({
			tag: "select",
			clazz: "form-control input-xs",
			children: Object.entries(this._STYLE_ROLLBOX_TO_DISPLAY_NAME)
				.map(([id, name]) => ee`<option value="${id}">${name}</option>`),
			change: () => {
				styleSwitcher._setActiveStyleRollbox(selStyle.val());
			},
		})
			.val(styleSwitcher._styleRollbox);

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

		if (StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_KEY_WIDE) === "true") cbWide.checked = true;

		return cbWide;
	}

	/* -------------------------------------------- */

	_styleTheme;
	_styleRollbox;

	constructor () {
		if (typeof window === "undefined") return;
		this._setActiveStyleTheme(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_KEY_THEME) || StyleSwitcher._STYLE_THEME_AUTOMATIC);
		this._setActiveStyleRollbox(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_KEY_ROLLBOX) || StyleSwitcher._STYLE_ROLLBOX_DEFAULT);
		this._setActiveWide(StyleSwitcher.storage.getItem(StyleSwitcher._STORAGE_KEY_WIDE) === "true");
	}

	getSummary () {
		return {isNight: this._getResolvedStyleTheme() !== StyleSwitcher._STYLE_THEME_DAY};
	}

	_fnsOnChangeTheme = [];
	addFnOnChangeTheme (fn) { this._fnsOnChangeTheme.push(fn); }

	// region Night Mode
	_getResolvedStyleTheme () {
		if (this._styleTheme === StyleSwitcher._STYLE_THEME_AUTOMATIC) return this.constructor._getDefaultStyleTheme();
		return this._styleTheme;
	}

	static _getDefaultStyleTheme () {
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) return StyleSwitcher._STYLE_THEME_NIGHT;
		return StyleSwitcher._STYLE_THEME_DAY;
	}

	_setActiveStyleTheme (style) {
		this._styleTheme = style;
		const styleResolved = this._getResolvedStyleTheme();

		this.constructor._CLASSES_THEME
			.forEach(clazzName => document.documentElement.classList.remove(clazzName));

		switch (styleResolved) {
			case StyleSwitcher._STYLE_THEME_DAY: {
				break;
			}
			case StyleSwitcher._STYLE_THEME_NIGHT: {
				document.documentElement.classList.add(StyleSwitcher._CLASS_THEME_NIGHT);
				document.documentElement.classList.add(StyleSwitcher._CLASS_THEME_NIGHT_STANDARD);
				break;
			}
			case StyleSwitcher._STYLE_THEME_NIGHT_ALT: {
				document.documentElement.classList.add(StyleSwitcher._CLASS_THEME_NIGHT);
				document.documentElement.classList.add(StyleSwitcher._CLASS_THEME_NIGHT_ALT);
				break;
			}
			case StyleSwitcher._STYLE_THEME_NIGHT_CLEAN: {
				document.documentElement.classList.add(StyleSwitcher._CLASS_THEME_NIGHT);
				document.documentElement.classList.add(StyleSwitcher._CLASS_THEME_NIGHT_CLEAN);
				break;
			}
		}

		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_KEY_THEME, this._styleTheme);

		this._fnsOnChangeTheme.forEach(fn => fn());
	}

	getClassNamesStyleTheme () {
		switch (this._getResolvedStyleTheme()) {
			case StyleSwitcher._STYLE_THEME_DAY: return "";
			case StyleSwitcher._STYLE_THEME_NIGHT: return [StyleSwitcher._CLASS_THEME_NIGHT, StyleSwitcher._CLASS_THEME_NIGHT_STANDARD].join(" ");
			case StyleSwitcher._STYLE_THEME_NIGHT_ALT: return [StyleSwitcher._CLASS_THEME_NIGHT, StyleSwitcher._CLASS_THEME_NIGHT_ALT].join(" ");
			case StyleSwitcher._STYLE_THEME_NIGHT_CLEAN: return [StyleSwitcher._CLASS_THEME_NIGHT, StyleSwitcher._CLASS_THEME_NIGHT_CLEAN].join(" ");
		}
	}
	// endregion

	// region Rollbox
	_setActiveStyleRollbox (style) {
		this._styleRollbox = style;

		this.constructor._CLASSES_ROLLBOX
			.forEach(clazzName => document.documentElement.classList.remove(clazzName));

		switch (this._styleRollbox) {
			case StyleSwitcher._STYLE_ROLLBOX_DEFAULT: {
				document.documentElement.classList.add(StyleSwitcher._CLASS_ROLLBOX_DEFAULT);
				break;
			}
			case StyleSwitcher._STYLE_ROLLBOX_RIGHT: {
				document.documentElement.classList.add(StyleSwitcher._CLASS_ROLLBOX_RIGHT);
				break;
			}
			case StyleSwitcher._STYLE_ROLLBOX_LEFT: {
				document.documentElement.classList.add(StyleSwitcher._CLASS_ROLLBOX_LEFT);
				break;
			}
		}

		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_KEY_ROLLBOX, this._styleRollbox);
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
		StyleSwitcher.storage.setItem(StyleSwitcher._STORAGE_KEY_WIDE, isActive);
	}
	// endregion

	/* -------------------------------------------- */

	static syncGetStorageDump () {
		return Object.fromEntries(
			this._STORAGE_KEYS
				.map(storageKey => [storageKey, this.storage.getItem(storageKey)]),
		);
	}

	static syncSetFromStorageDump (dump) {
		if (!dump) return;
		this._STORAGE_KEYS
			.filter(storageKey => storageKey in dump)
			.forEach(storageKey => this.storage.setItem(storageKey, dump[storageKey]));
	}
}

try {
	StyleSwitcher.storage = window.localStorage;
} catch (e) { // cookies are disabled
	StyleSwitcher.storage = {
		getItem (k) {
			switch (k) {
				case StyleSwitcher._STORAGE_KEY_THEME: return StyleSwitcher._STYLE_THEME_AUTOMATIC;
				case StyleSwitcher._STORAGE_KEY_ROLLBOX: return StyleSwitcher._STYLE_ROLLBOX_DEFAULT;
				case StyleSwitcher._STORAGE_KEY_WIDE: return false;
			}
			return null;
		},

		setItem (k, v) {},
	};
}

const styleSwitcher = new StyleSwitcher();
globalThis.styleSwitcher = styleSwitcher;
