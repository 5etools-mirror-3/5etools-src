import fs from "fs";
import https from "https";

function readJson (path) {
	try {
		const data = fs.readFileSync(path, "utf8")
			.replace(/^\uFEFF/, ""); // strip BOM
		return JSON.parse(data);
	} catch (e) {
		e.message += ` (Path: ${path})`;
		throw e;
	}
}

function isDirectory (path) {
	return fs.lstatSync(path).isDirectory();
}

const FILE_EXTENSION_ALLOWLIST = [
	".json",
];

const FILE_PREFIX_BLOCKLIST = [
	"bookref-",
	"gendata-",
];

const DIR_PREFIX_BLOCKLIST = [
	"_",
];

const DIR_BLOCKLIST = [
	".git",
	".idea",
	"node_modules",
];

/**
 * Recursively list all files in a directory.
 *
 * @param [opts] Options object.
 * @param [opts.blocklistFilePrefixes] Blocklisted filename prefixes (case sensitive).
 * @param [opts.blocklistDirPrefixes] Blocklisted directory prefixes (case sensitive).
 * @param [opts.allowlistFileExts] Allowlisted filename extensions (case sensitive).
 * @param [opts.dir] Directory to list.
 * @param [opts.allowlistDirs] Directory allowlist.
 * @param [opts.blocklistDirs] Directory blocklist.
 */
function listFiles (opts) {
	opts = opts || {};
	opts.dir = opts.dir ?? "./data";
	opts.blocklistFilePrefixes = opts.blocklistFilePrefixes === undefined ? FILE_PREFIX_BLOCKLIST : opts.blocklistFilePrefixes;
	opts.blocklistDirPrefixes = opts.blocklistDirPrefixes === undefined ? DIR_PREFIX_BLOCKLIST : opts.blocklistDirPrefixes;
	opts.allowlistFileExts = opts.allowlistFileExts === undefined ? FILE_EXTENSION_ALLOWLIST : opts.allowlistFileExts;
	opts.allowlistDirs = opts.allowlistDirs || null;
	opts.blocklistDirs = opts.blocklistDirs === undefined ? DIR_BLOCKLIST : opts.blocklistDirs;

	const dirContent = fs.readdirSync(opts.dir, "utf8")
		.filter(file => {
			const path = `${opts.dir}/${file}`;

			if (isDirectory(path)) {
				if (opts.blocklistDirPrefixes != null && opts.blocklistDirPrefixes.some(it => file.startsWith(it))) return false;
				if (opts.blocklistDirs != null && opts.blocklistDirs.some(it => it === file)) return false;
				return opts.allowlistDirs ? opts.allowlistDirs.includes(path) : true;
			}

			return (opts.blocklistFilePrefixes == null || !opts.blocklistFilePrefixes.some(it => file.startsWith(it)))
				&& (opts.allowlistFileExts == null || opts.allowlistFileExts.some(it => file.endsWith(it)));
		})
		.map(file => `${opts.dir}/${file}`);

	return dirContent.reduce((acc, file) => {
		if (isDirectory(file)) acc.push(...listFiles({...opts, dir: file}));
		else acc.push(file);
		return acc;
	}, []);
}

function rmDirRecursiveSync (dir) {
	if (fs.existsSync(dir)) {
		fs.readdirSync(dir).forEach(file => {
			const curPath = `${dir}/${file}`;
			if (fs.lstatSync(curPath).isDirectory()) rmDirRecursiveSync(curPath);
			else fs.unlinkSync(curPath);
		});
		fs.rmdirSync(dir);
	}
}

class PatchLoadJson {
	static _CACHED = null;
	static _CACHED_RAW = null;

	static _PATCH_STACK = 0;

	static _CACHE_HTTP_REQUEST = {};

	static async _pLoadUrl (url) {
		if (!url.startsWith("http")) return this._CACHE_HTTP_REQUEST[url] = readJson(url);

		if (process.env.HOMEBREW_REPO_DIR && DataUtil.brew.isUrlUnderDefaultRoot(url)) {
			const urlLocal = [
				process.env.HOMEBREW_REPO_DIR.trim(),
				DataUtil.brew.getUrlRelativeToDefaultRoot(url),
			]
				.join("/")
				.replace(/\/+/g, "/");
			return this._CACHE_HTTP_REQUEST[url] = readJson(urlLocal);
		}

		return this._CACHE_HTTP_REQUEST[url] ||= new Promise((resolve, reject) => {
			https
				.get(
					url,
					resp => {
						let stack = "";
						resp.on("data", chunk => stack += chunk);
						resp.on("end", () => resolve(JSON.parse(stack)));
					},
				)
				.on("error", err => reject(err));
		});
	}

	static patchLoadJson () {
		if (this._PATCH_STACK++) return;

		PatchLoadJson._CACHED = PatchLoadJson._CACHED || DataUtil.loadJSON.bind(DataUtil);

		const loadJsonCache = {};
		DataUtil.loadJSON = (url) => {
			if (!loadJsonCache[url]) {
				loadJsonCache[url] = (async () => {
					const data = await this._pLoadUrl(url);
					await DataUtil.pDoMetaMerge(url, data, {isSkipMetaMergeCache: true});
					return data;
				})();
			}
			return loadJsonCache[url];
		};

		PatchLoadJson._CACHED_RAW = PatchLoadJson._CACHED_RAW || DataUtil.loadRawJSON.bind(DataUtil);
		DataUtil.loadRawJSON = async (url) => this._pLoadUrl(url);
	}

	static unpatchLoadJson () {
		if (--this._PATCH_STACK) return;

		if (PatchLoadJson._CACHED) DataUtil.loadJSON = PatchLoadJson._CACHED;
		if (PatchLoadJson._CACHED_RAW) DataUtil.loadRawJSON = PatchLoadJson._CACHED_RAW;
	}
}
class Timer {
	static _ID = 0;
	static _RUNNING = {};

	static start () {
		const id = this._ID++;
		this._RUNNING[id] = this._getSecs();
		return id;
	}

	static stop (id, {isFormat = true} = {}) {
		const out = this._getSecs() - this._RUNNING[id];
		delete this._RUNNING[id];
		return isFormat ? `${out.toFixed(3)}s` : out;
	}

	static _getSecs () {
		const [s, ns] = process.hrtime();
		return s + (ns / 1000000000);
	}
}

export const patchLoadJson = PatchLoadJson.patchLoadJson.bind(PatchLoadJson);
export const unpatchLoadJson = PatchLoadJson.unpatchLoadJson.bind(PatchLoadJson);

export {
	readJson,
	listFiles,
	FILE_PREFIX_BLOCKLIST,
	rmDirRecursiveSync,
	Timer,
};
