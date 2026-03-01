import path from "path";
import * as ut from "./util.js";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";

export const getCleanPath = pth => path.normalize(pth).toString().replace(/\\/g, "/");

export class JsonFile {
	constructor ({filePath}) {
		this._filePath = getCleanPath(filePath);
	}

	getFilePath () { return this._filePath; }

	getContents () {
		return (this._contents ??= readJsonSync(this._filePath));
	}

	getSources () {
		const sources = this.getContents()?._meta?.sources;
		if (!(sources instanceof Array)) return [];
		return sources;
	}

	isSampleFile () {
		return path.basename(this._filePath).startsWith("Sample - ");
	}

	isPartnered () {
		return this.getSources()
			.some(source => source?.partnered);
	}

	isConvertedBy ({name}) {
		const nameSearch = `${name}`.toLowerCase().trim();
		return this.getSources()
			.some(source => source?.convertedBy?.some(val => `${val}`.toLowerCase().trim() === nameSearch));
	}
}

const _getAllJson_addFile = (allFiles, path) => {
	allFiles.push(path);
};

const _getAllJson_addDir = (allFiles, dir) => {
	ut.listFiles({dir})
		.filter(file => file.toLowerCase().endsWith(".json"))
		.forEach(filePath => _getAllJson_addFile(allFiles, filePath));
};

export const getAllJsonFiles = ({files, dirs}) => {
	return getAllJsonFilePaths({files, dirs})
		.map(file => new JsonFile({filePath: file}));
};

export const getAllJsonFilePaths = ({files, dirs}) => {
	const allFiles = [];
	dirs.forEach(dir => _getAllJson_addDir(allFiles, dir));
	files.forEach(file => _getAllJson_addFile(allFiles, file));
	return allFiles;
};
