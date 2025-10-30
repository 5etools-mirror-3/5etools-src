import {getAllJson} from "./util-json-files.js";

export const getCliFiles = ({dirs, files, fnMutDefaultSelection = null}) => {
	dirs = [...(dirs || [])];
	files = [...(files || [])];

	// If no options specified, use default selection
	if (!dirs.length && !files.length) {
		if (fnMutDefaultSelection) fnMutDefaultSelection({files, dirs});
	}

	return getAllJson({dirs, files});
};

let _isInitConsoleOut = false;
export const pInitConsoleOut = async () => {
	if (_isInitConsoleOut) return;
	_isInitConsoleOut = true;

	// Arbitrary initial delay to allow IntelliJ console to properly init(?!)
	await MiscUtil.pDelay(500);
};
