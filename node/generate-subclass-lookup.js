import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import "../js/hist.js";
import * as ut from "./util.js";

const out = {};
ut.patchLoadJson();
const data = await DataUtil.class.loadRawJSON();
(data.subclass || []).forEach(sc => {
	MiscUtil.set(out, sc.classSource, sc.className, sc.source, sc.shortName, {name: sc.name, isReprinted: sc.isReprinted});
});
ut.unpatchLoadJson();
fs.writeFileSync(`./data/generated/gendata-subclass-lookup.json`, CleanUtil.getCleanJson(out, {isMinify: true}));
console.log("Regenerated subclass lookup.");
