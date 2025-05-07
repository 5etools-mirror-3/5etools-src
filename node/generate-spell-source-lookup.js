// TODO this replaces `generate-subclass-lookup.js` in effect
// TODO make a system for generating the same data on homebrew docs

import fs from "fs";
import * as ut from "./util.js";
import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-ui.js";
import "../js/filter.js";
import "../js/filter-spells.js";
import "../js/utils-dataloader.js";
import "../js/utils-brew.js";
import "../js/render.js";
import "../js/hist.js";
import {SpellSourceLookupBuilder} from "../js/converter/converterutils-spell-sources.js";

async function pMain () {
	ut.patchLoadJson();

	const spellDatas = await DataLoader.pCacheAndGetAllSite(UrlUtil.PG_SPELLS);

	const lookup = await SpellSourceLookupBuilder.pGetLookup({spells: spellDatas});

	fs.writeFileSync(`./data/generated/gendata-spell-source-lookup.json`, CleanUtil.getCleanJson(lookup, {isMinify: true}));

	ut.unpatchLoadJson();

	console.log("Regenerated spell source lookup.");
}

export default pMain();
