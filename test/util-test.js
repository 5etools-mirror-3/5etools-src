import "../js/parser.js";
import "../js/utils.js";

export const BLOCKLIST_SOURCES_PAGES = new Set([
	// region Sources which only exist in digital form
	Parser.SRC_DC,
	Parser.SRC_SLW,
	Parser.SRC_SDW,
	Parser.SRC_VD,
	Parser.SRC_HAT_TG,
	Parser.SRC_HAT_LMI,
	Parser.SRC_LK,
	Parser.SRC_AATM,
	Parser.SRC_HFStCM,
	Parser.SRC_SjA,
	Parser.SRC_GotSF,
	Parser.SRC_DitLCoT,
	Parser.SRC_VNotEE,
	Parser.SRC_UtHftLH,
	Parser.SRC_ScoEE,
	Parser.SRC_HFDoMM, // Deck of recipe cards

	// N.b.: other MCV source creatures mysteriously have page numbers on Beyond
	Parser.SRC_MCV4EC,
	// endregion

	// region Sources which are screens, and therefore "pageless"
	Parser.SRC_SCREEN,
	Parser.SRC_SCREEN_WILDERNESS_KIT,
	Parser.SRC_SCREEN_DUNGEON_KIT,
	Parser.SRC_SCREEN_SPELLJAMMER,
	Parser.SRC_XSCREEN,
	// endregion
]);
