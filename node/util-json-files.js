import * as ut from "./util.js";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";

const _getAllJson_addFile = (allFiles, path) => {
	allFiles.push(path);
};

const _getAllJson_addDir = (allFiles, dir) => {
	ut.listFiles({dir})
		.filter(file => file.toLowerCase().endsWith(".json"))
		.forEach(filePath => _getAllJson_addFile(allFiles, filePath));
};

export const getAllJson = ({files, dirs}) => {
	return getAllJsonFiles({files, dirs})
		.map(file => ({json: readJsonSync(file), path: file}));
};

export const getAllJsonFiles = ({files, dirs}) => {
	const allFiles = [];
	dirs.forEach(dir => _getAllJson_addDir(allFiles, dir));
	files.forEach(file => _getAllJson_addFile(allFiles, file));
	return allFiles;
};
