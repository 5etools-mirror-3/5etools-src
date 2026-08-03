import fs from "fs";
import path from "path";
import * as ut from "../util.js";
import "../../js/parser.js";
import "../../js/utils.js";
import {PropOrder} from "../../js/utils-proporder.js";

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
	const filename = path.posix.basename(file);
	const {json: jsonPrettified, isModified} = getPrettified(
		json,
		{
			isFoundryPrefixProps: filename === "foundry.json" || filename.startsWith("foundry-"),
			unhandledKeys,
			isNoSortRootArrays,
		},
	);
	if (isModified) fs.writeFileSync(file, CleanUtil.getCleanJson(jsonPrettified), "utf-8");

	if (isLogUnhandledProps) _logUnhandledProps({unhandledKeys});
};
