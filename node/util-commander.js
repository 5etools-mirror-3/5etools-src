import {Option} from "commander";
import {getAllJsonFiles} from "./util-json-files.js";

const _FILE_FILTER_CHOICES = ["partnered", "sample"];

const _getCliFiles_getFilteredByFilter = ({jsonFiles, filter = null}) => {
	if (!filter) return jsonFiles;

	switch (filter) {
		case "partnered": return jsonFiles.filter(jsonFile => jsonFile.isPartnered());
		case "sample": return jsonFiles.filter(jsonFile => jsonFile.isSampleFile());
		default: throw new Error(`Unhandled filter "${filter}"`);
	}
};

const _getCliFiles_getFilteredByConvertedBy = ({jsonFiles, convertedBy = null}) => {
	if (!convertedBy) return jsonFiles;
	return jsonFiles.filter(jsonFile => jsonFile.isConvertedBy({name: convertedBy}));
};

export const getCliJsonFiles = ({dirs, files, fnMutDefaultSelection = null, convertedBy = null, filter = null}) => {
	dirs = [...(dirs || [])];
	files = [...(files || [])];

	// If no options specified, use default selection
	if (!dirs.length && !files.length) {
		if (fnMutDefaultSelection) fnMutDefaultSelection({files, dirs});
	}

	return _getCliFiles_getFilteredByConvertedBy({
		jsonFiles: _getCliFiles_getFilteredByFilter({
			jsonFiles: getAllJsonFiles({dirs, files}),
			filter,
		}),
		convertedBy,
	});
};

export const mutCommanderJsonFileOptions = ({command}) => {
	return command
		.option("--file <file...>", "Input files")
		.option("--dir <dir...>", "Input directories")

		.addOption(
			new Option("--filter <filter>", "Filter to files matching the provided filter mode")
				.choices(_FILE_FILTER_CHOICES),
		)
		.option("--converted-by <name>", "Filter to files converted by the provided name")
	;
};

let _isInitConsoleOut = false;
export const pInitConsoleOut = async () => {
	if (_isInitConsoleOut) return;
	_isInitConsoleOut = true;

	// Arbitrary initial delay to allow IntelliJ console to properly init(?!)
	await MiscUtil.pDelay(500);
};
