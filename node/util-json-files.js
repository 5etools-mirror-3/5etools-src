import path from "path";
import * as ut from "./util.js";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";

export const getCleanPath = pth => path.posix.normalize(pth);

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
		return path.posix.basename(this._filePath).startsWith("Sample - ");
	}

	isPartnered () {
		return this.getSources()
			.some(source => source?.partnered);
	}

	_isAuthorConvertedBy ({name, prop}) {
		const nameSearch = `${name}`.toLowerCase().trim();
		return this.getSources()
			.some(source => source?.[prop]?.some(val => `${val}`.toLowerCase().trim() === nameSearch));
	}

	isConvertedBy ({name}) {
		return this._isAuthorConvertedBy({name, prop: "convertedBy"});
	}

	isAuthor ({name}) {
		return this._isAuthorConvertedBy({name, prop: "authors"});
	}
}

const _isFileBlocklisted = ({filePath, fnIsBlocklisted}) => {
	if (!fnIsBlocklisted) return false;
	return fnIsBlocklisted(getCleanPath(filePath));
};

const _getAllJson_addFile = (allFiles, filePath) => {
	allFiles.push(filePath);
};

const _getAllJson_addDir = (allFiles, dir, {fnIsBlocklisted = null} = {}) => {
	ut.listFiles({dir})
		.filter(file => file.toLowerCase().endsWith(".json"))
		.filter(file => !_isFileBlocklisted({filePath: file, fnIsBlocklisted}))
		.forEach(filePath => _getAllJson_addFile(allFiles, filePath));
};

export const getAllJsonFiles = ({files, dirs, fnIsBlocklisted = null}) => {
	return getAllJsonFilePaths({files, dirs, fnIsBlocklisted})
		.map(file => new JsonFile({filePath: file}));
};

export const getAllJsonFilePaths = ({files, dirs, fnIsBlocklisted = null}) => {
	const allFiles = [];
	dirs.forEach(dir => _getAllJson_addDir(allFiles, dir, {fnIsBlocklisted}));
	files
		.filter(file => !_isFileBlocklisted({filePath: file, fnIsBlocklisted}))
		.forEach(file => _getAllJson_addFile(allFiles, file));
	return allFiles;
};
