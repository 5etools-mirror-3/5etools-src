import fs from "fs";
import * as ut from "../util.js";
import "../../js/parser.js";
import "../../js/utils.js";
import {PropOrder} from "../../js/utils-proporder.js";

const FILE_BLOCKLIST = new Set([
	"loot.json",
	"msbcr.json",
	"monsterfeatures.json",
	"index.json",
	"life.json",
	"makecards.json",
	"renderdemo.json",
	"sources.json",
	"fluff-index.json",
	"changelog.json",

	"index-meta.json",
	"index-props.json",
	"index-sources.json",
	"index-timestamps.json",

	"package.json",
	"package-lock.json",
]);

const _logUnhandledProps = ({unhandledKeys}) => {
	if (!Object.keys(unhandledKeys).length) return;

	console.warn(`Unhandled keys:`);
	Object.keys(unhandledKeys)
		.forEach(prop => console.warn(`\t${prop}`));
};

export const getPrettified = (json, {isFoundryPrefixProps = false, unhandledKeys = {}, isNoSortRootArrays = false} = {}) => {
	if (!PropOrder.hasOrderRoot(json)) return {json, isModified: false};

	json = PropOrder.getOrderedRoot(
		json,
		{
			fnUnhandledKey: uk => unhandledKeys[uk] = true,
			isFoundryPrefixProps,
			isNoSortRootArrays,
		},
	);
	return {json, isModified: true};
};

export const prettifyFile = (file, {unhandledKeys = null, isNoSortRootArrays = false} = {}) => {
	const isLogUnhandledProps = unhandledKeys == null;
	unhandledKeys ||= {};

	console.log(`\tPrettifying ${file}...`);
	const json = ut.readJson(file);
	const {json: jsonPrettified, isModified} = getPrettified(
		json,
		{
			isFoundryPrefixProps: file.includes("foundry.json") || file.split("/").last().startsWith("foundry-"),
			unhandledKeys,
			isNoSortRootArrays,
		},
	);
	if (isModified) fs.writeFileSync(file, CleanUtil.getCleanJson(jsonPrettified), "utf-8");

	if (isLogUnhandledProps) _logUnhandledProps({unhandledKeys});
};

export const prettifyFolder = (folder, {isNoSortRootArrays = false} = {}) => {
	const unhandledKeys = {};
	console.log(`Prettifying directory ${folder}...`);
	const files = ut.listFiles({dir: folder});
	files
		.filter(file => file.endsWith(".json") && !FILE_BLOCKLIST.has(file.split("/").last()))
		.forEach(file => prettifyFile(file, {unhandledKeys, isNoSortRootArrays}));

	_logUnhandledProps({unhandledKeys});
};
