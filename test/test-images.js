import fs from "fs";
import path from "path";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import * as ut from "../node/util.js";
import {listFiles} from "../node/util.js";

/**
 * @abstract
 */
class _TestTokenImagesBase {
	_IS_CLEAN_EXTRAS = false;
	_IS_MOVE_EXTRAS = false;

	/* -------------------------------------------- */

	_PATH_BASE;
	_PROP;
	_NAME;

	_SOURCES_CLEAN_EXTRAS = [];

	/* -------------------------------------------- */

	_EXT = "webp";

	_IGNORED_PREFIXES = [
		".",
		"_",
	];

	_expected = new Set();
	_expectedDirs = {};
	_existing = new Set();
	_expectedFromHashToken = {};

	_existingSourceTokens = null;

	/* -------------------------------------------- */

	_isExistingSourceToken ({filename, src}) {
		(this._existingSourceTokens ||= {})[src] ||= fs.readdirSync(`${this._PATH_BASE}/${src}`).mergeMap(it => ({[it]: true}));
		return !!this._existingSourceTokens[src][filename.split("/").last()];
	}

	/**
	 * @abstract
	 */
	_getFileInfos () {
		throw new Error("Unimplemented!");
	}

	_processFileInfos ({fileInfos}) {
		const sourcesImplicit = new Set();

		fileInfos
			.forEach(json => {
				json[this._PROP]
					.forEach(ent => {
						ent.__prop = this._PROP;

						const implicitTokenPath = `${this._PATH_BASE}/${ent.source}/${Parser.nameToTokenName(ent.name)}.${this._EXT}`;

						if (ent.hasToken) this._expectedFromHashToken[implicitTokenPath] = true;

						if (ent.token) {
							const explicitTokenUrl = Renderer[this._PROP].getTokenUrl(ent);
							const explicitTokenPath = `${this._PATH_BASE}/${explicitTokenUrl.split("/").slice(3).join("/")}`;
							this._expected.add(explicitTokenPath);
						} else {
							this._expected.add(implicitTokenPath);
							sourcesImplicit.add(ent.source);
						}

						// add tokens specified as part of variants
						if (ent.variant) {
							ent.variant
								.filter(it => it.token)
								.forEach(entry => this._expected.add(`${this._PATH_BASE}/${entry.token.source}/${Parser.nameToTokenName(entry.token.name)}.${this._EXT}`));
						}

						// add tokens specified as part of versions
						const versions = DataUtil.proxy.getVersions(ent.__prop, ent, {isExternalApplicationIdentityOnly: true});
						versions
							.forEach(entVer => {
								if (!Renderer[this._PROP].hasToken(entVer)) return;
								this._expected.add(`${this._PATH_BASE}/${entVer.source}/${Parser.nameToTokenName(entVer.name)}.${this._EXT}`);
							});

						// add tokens specified as alt art
						if (ent.altArt) {
							ent.altArt
								.forEach(alt => this._expected.add(`${this._PATH_BASE}/${alt.source}/${Parser.nameToTokenName(alt.name)}.${this._EXT}`));
						}
					});
			});

		if (!sourcesImplicit.size) return;

		sourcesImplicit
			.forEach(src => {
				if (fs.existsSync(`${this._PATH_BASE}/${src}`)) return;

				this._expectedDirs[src] = true;
			});
	}

	_readImageDirs () {
		fs.readdirSync(this._PATH_BASE)
			.filter(file => !(this._IGNORED_PREFIXES.some(it => file.startsWith(it))))
			.forEach(dir => {
				fs.readdirSync(`${this._PATH_BASE}/${dir}`)
					.forEach(file => {
						this._existing.add(`${this._PATH_BASE}/${dir.replace("(", "").replace(")", "")}/${file}`);
					});
			});
	}

	_getIsError () {
		let isError = false;
		const results = [];
		this._expected.forEach((img) => {
			if (!this._existing.has(img)) results.push(`[ MISSING] ${img}`);
		});
		this._existing.forEach((img) => {
			delete this._expectedFromHashToken[img];

			if (!this._expected.has(img)) {
				if (this._IS_CLEAN_EXTRAS) {
					const srcExisting = this._SOURCES_CLEAN_EXTRAS
						.find(src => this._isExistingSourceToken({filename: img, src}));
					if (srcExisting) {
						fs.unlinkSync(img);
						results.push(`[ !DELETE] ${img} (found in "${srcExisting}")`);
						return;
					}
				}

				if (this._IS_MOVE_EXTRAS) {
					const dir = path.join(path.dirname(img), "extras");
					fs.mkdirSync(dir, {recursive: true});
					fs.copyFileSync(img, path.join(dir, path.basename(img)));
					fs.unlinkSync(img);
				}

				results.push(`[   EXTRA] ${img}`);
				isError = true;
			}
		});

		Object.keys(this._expectedDirs).forEach(k => results.push(`Directory ${this._PATH_BASE}/${k} doesn't exist!`));
		results
			.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
			.forEach((img) => console.warn(img));

		if (Object.keys(this._expectedFromHashToken).length) console.warn(`Declared in ${this._NAME} data but not found:`);
		Object.keys(this._expectedFromHashToken).forEach(img => console.warn(`[MISMATCH] ${img}`));

		if (!this._expected.size && !Object.keys(this._expectedFromHashToken).length) console.log("Tokens are as expected.");

		return isError;
	}

	run () {
		console.log(`##### Reconciling tokens against ${this._NAME} data #####`);

		const fileInfos = this._getFileInfos();
		this._processFileInfos({fileInfos});
		this._readImageDirs();

		return this._getIsError();
	}
}

class _TestTokenImagesBestiary extends _TestTokenImagesBase {
	_PATH_BASE = `./img/bestiary/tokens`;
	_PROP = "monster";
	_NAME = "bestiary";

	_SOURCES_CLEAN_EXTRAS = [
		Parser.SRC_MM,
		Parser.SRC_MPMM,
		Parser.SRC_BAM,
		Parser.SRC_VRGR,
	];

	_getFileInfos () {
		const jsonIndex = ut.readJson(`./data/bestiary/index.json`);

		return Object.entries(jsonIndex)
			.map(([, file]) => {
				return ut.readJson(`./data/bestiary/${file}`);
			});
	}
}

class _TestTokenImagesObjects extends _TestTokenImagesBase {
	_PATH_BASE = `./img/objects/tokens`;
	_PROP = "object";
	_NAME = "objects";

	_getFileInfos () {
		return [ut.readJson(`./data/objects.json`)];
	}
}

class _TestTokenImagesVehicles extends _TestTokenImagesBase {
	_PATH_BASE = `./img/vehicles/tokens`;
	_PROP = "vehicle";
	_NAME = "vehicles";

	_getFileInfos () {
		return [ut.readJson(`./data/vehicles.json`)];
	}
}

class _TestAdventureBookImages {
	static run () {
		const pathsMissing = [];

		const walker = MiscUtil.getWalker({isNoModification: true});

		const getHandler = (filename, out) => {
			const checkHref = (href) => {
				if (href?.type !== "internal") return;
				if (fs.existsSync(`./img/${href.path}`)) return;
				out.push(`${filename} :: ${href.path}`);
			};

			return (obj) => {
				if (obj.type !== "image") return;
				checkHref(obj.href);
				checkHref(obj.hrefThumbnail);
			};
		};

		listFiles()
			.forEach(filepath => {
				const json = ut.readJson(filepath);
				walker.walk(
					json,
					{
						object: getHandler(filepath, pathsMissing),
					},
				);
			});

		if (pathsMissing.length) {
			console.log(`Missing Images:\n${pathsMissing.map(it => `\t${it}`).join("\n")}`);
			return true;
		}

		console.log(`##### Missing Image Test Passed #####`);
		return false;
	}
}

function main () {
	if (!fs.existsSync("./img")) return true;

	if (new _TestTokenImagesBestiary().run()) return false;
	if (new _TestTokenImagesObjects().run()) return false;
	if (new _TestTokenImagesVehicles().run()) return false;
	if (_TestAdventureBookImages.run()) return false;

	return true;
}

export default main();
