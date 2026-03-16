export const SUB_HASH_PREFIX_LENGTH = 4;

export const EVNT_VALCHANGE = "valchange";
export const SOURCE_HEADER = "Source";
export const TITLE_BTN_RESET = "Reset filters. SHIFT to reset everything.";

export const PILL_STATE__IGNORE = 0;
export const PILL_STATE__YES = 1;
export const PILL_STATE__NO = 2;
export const PILL_STATES = ["ignore", "yes", "no"];
export const PILL_STATE_TO_DISPLAY_CLASS = {
	[PILL_STATE__IGNORE]: "ve-fltr__disp-state--ignore",
	[PILL_STATE__YES]: "ve-fltr__disp-state--yes",
	[PILL_STATE__NO]: "ve-fltr__disp-state--no",
};

export const getPillStateDisplayClass = pillState => PILL_STATE_TO_DISPLAY_CLASS[pillState] ?? PILL_STATE_TO_DISPLAY_CLASS[PILL_STATE__IGNORE];

export const MISC_FILTER_VALUE__BASIC_RULES_2014 = "Basic Rules (5e/2014)";
export const MISC_FILTER_VALUE__BASIC_RULES_2024 = "Basic Rules (5.5e/2024)";
export const MISC_FILTER_VALUE__SRD_5_1 = "SRD 5.1";
export const MISC_FILTER_VALUE__SRD_5_2 = "SRD 5.2";
