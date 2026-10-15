import {ArrayKey, IgnoredKey, ObjectKey, ObjectOrArrayKey} from "./utils-proporder/utils-proporder-models.js";
import {PROPORDER_PROP_TO_LIST, PROPORDER_ROOT} from "./utils-proporder/utils-proporder-config.js";

export class PropOrder {
	static _getKeyProp (keyInfo) {
		return typeof keyInfo === "string" ? keyInfo : keyInfo.key;
	}

	/* -------------------------------------------- */

	/**
	 * @param obj
	 * @param [opts] Options object.
	 * @param [opts.fnUnhandledKey] Function to call on each unhandled key.
	 * @param [opts.isFoundryPrefixProps] If root keys should be treated as having a "foundry" prefix.
	 * @param [opts.isNoSortRootArrays] If root arrays should not be sorted.
	 */
	static getOrderedRoot (obj, opts) {
		opts ||= {};

		return this._getOrdered({
			obj,
			order: PROPORDER_ROOT,
			opts,
			logPath: "root",
		});
	}

	static hasOrderRoot (obj) {
		return PROPORDER_ROOT
			.filter(keyInfo => !(keyInfo instanceof IgnoredKey))
			.some(keyInfo => obj[this._getKeyProp(keyInfo)] != null);
	}

	/* -------------------------------------------- */

	/**
	 * @param obj
	 * @param dataProp
	 * @param [opts] Options object.
	 * @param [opts.fnUnhandledKey] Function to call on each unhandled key.
	 */
	static getOrdered (obj, dataProp, opts) {
		opts ||= {};

		const order = PROPORDER_PROP_TO_LIST[dataProp];
		if (!order) throw new Error(`Unhandled prop "${dataProp}"`);

		return this._getOrdered({
			obj,
			order,
			opts,
			logPath: dataProp,
		});
	}

	static _getModifiedProp ({keyInfo, isFoundryPrefixProps}) {
		const prop = this._getKeyProp(keyInfo);

		if (!isFoundryPrefixProps || prop.startsWith("_")) return prop;

		return prop.replace(/^foundry/, "").lowercaseFirst();
	}

	static _getLogPathNext (
		{
			opts,
			logPath,
			prop,
			propMod = null,
			isRecursive = false,
			isArray = false,
		},
	) {
		propMod ??= prop;

		if (isRecursive) {
			if (opts.isLoggingCollapsed) return logPath;

			opts.isLoggingCollapsed = true;
			return `${logPath} \u2026`;
		}

		const joiner = opts.isLoggingCollapsed ? " " : "";
		opts.isLoggingCollapsed = false;

		return [
			logPath,
			`${isArray ? "[n]" : ""}.${prop}${propMod !== prop ? ` (${propMod})` : ""}`,
		]
			.join(joiner);
	}

	static _getOrdered (
		{
			obj,
			order,
			opts,
			logPath,
		},
	) {
		const out = {};

		const [keysComposite, keysStandard] = Object.keys(obj)
			.segregate(k => k.includes("."));
		const keySetStandard = new Set(keysStandard);
		// Simplified sorting for composite keys, as composition breakpoints are unknown
		// TODO(Future) consider recursive order?
		//   - move composite keys to temp object; `expand` temp object; order temp object; ?reconstruct original keys?
		const keyLookupComposite = keysComposite.sort(SortUtil.ascSortLower);
		const seenKeys = new Set();

		const handleCompositeKeys = () => {
			keyLookupComposite
				.forEach(keyComposite => {
					out[keyComposite] = obj[keyComposite];
					seenKeys.add(keyComposite);
				});
		};

		order
			.forEach(keyInfo => {
				const prop = this._getKeyProp(keyInfo);
				const propMod = this._getModifiedProp({keyInfo, isFoundryPrefixProps: opts.isFoundryPrefixProps});

				if (opts.isFoundryPrefixProps && !prop.startsWith("_") && !prop.startsWith("foundry")) return;

				if (!keySetStandard.has(propMod)) {
					return handleCompositeKeys();
				}
				seenKeys.add(propMod);

				if (typeof keyInfo === "string") {
					out[propMod] = obj[propMod];
					return handleCompositeKeys();
				}

				if (!obj[propMod]) { // Handle nulls
					out[propMod] = obj[propMod];
					return handleCompositeKeys();
				}

				const optsNxt = {
					...opts,
					// Only used at the root
					isFoundryPrefixProps: false,
					isNoSortRootArrays: false,
				};

				const keyInfoObj = keyInfo instanceof ObjectKey
					? keyInfo
					: keyInfo instanceof ObjectOrArrayKey && obj[propMod]?.constructor === Object ? keyInfo.objectKey : null;

				if (keyInfoObj) {
					const logPathNxt = this._getLogPathNext({opts: optsNxt, logPath, prop, propMod, isRecursive: keyInfoObj.isRecursive});

					// Handle case where e.g. `entry` is a primitive, rather than an entry object
					if (typeof obj[propMod] !== "object") {
						out[propMod] = obj[propMod];
						return handleCompositeKeys();
					}

					if (obj[propMod] instanceof Array) {
						throw new Error(`Array ${JSON.stringify(obj[propMod])} found where an object was expected! This should never occur!`);
					}

					if (keyInfoObj.fnGetOrder) {
						out[propMod] = this._getOrdered({
							obj: obj[propMod],
							order: keyInfoObj.fnGetOrder(obj[propMod]),
							opts: optsNxt,
							logPath: logPathNxt,
						});
						return handleCompositeKeys();
					}

					if (keyInfoObj.fnGetObjectOrderProp) {
						const orderNxt = PROPORDER_PROP_TO_LIST[keyInfoObj.fnGetObjectOrderProp(obj)];
						out[propMod] = orderNxt
							? this._getOrdered({
								obj: obj[propMod],
								order: orderNxt,
								opts: optsNxt,
								logPath: logPathNxt,
							})
							: obj[propMod];
						return handleCompositeKeys();
					}

					if (keyInfoObj.order) {
						out[propMod] = this._getOrdered({
							obj: obj[propMod],
							order: keyInfoObj.order,
							opts: optsNxt,
							logPath: logPathNxt,
						});
						return handleCompositeKeys();
					}

					out[propMod] = obj[propMod];

					return handleCompositeKeys();
				}

				const keyInfoArray = keyInfo instanceof ArrayKey
					? keyInfo
					: (keyInfo instanceof ObjectOrArrayKey && obj[propMod] instanceof Array) ? keyInfo.arrayKey : null;

				if (keyInfoArray) {
					const logPathNxt = this._getLogPathNext({
						opts: optsNxt,
						logPath,
						prop,
						propMod,
						isArray: true,
						isRecursive: keyInfoArray.isRecursive,
					});

					if (!(obj[propMod] instanceof Array)) {
						throw new Error(`Object ${JSON.stringify(obj[propMod])} found where an array was expected! This should never occur!`);
					}

					// Handle mixed arrays of e.g. strings + objects
					const fnGetOrdered = (arrOrPrimitive, fnGetOrder) => {
						if (arrOrPrimitive == null) return arrOrPrimitive;
						if (typeof arrOrPrimitive !== "object") return arrOrPrimitive;

						if (arrOrPrimitive instanceof Array) {
							if (keyInfoArray.isRecursive) return arrOrPrimitive.map(nxt => fnGetOrdered(nxt, fnGetOrder));
							return arrOrPrimitive;
						}

						return this._getOrdered({
							obj: arrOrPrimitive,
							order: fnGetOrder(arrOrPrimitive),
							opts: optsNxt,
							logPath: logPathNxt,
						});
					};

					if (keyInfoArray.fnGetOrder) out[propMod] = obj[propMod].map(it => fnGetOrdered(it, keyInfoArray.fnGetOrder));
					else if (keyInfoArray.order) out[propMod] = obj[propMod].map(it => fnGetOrdered(it, () => keyInfoArray.order));
					else out[propMod] = obj[propMod];

					if (!opts.isNoSortRootArrays && keyInfoArray.fnSort && out[propMod] instanceof Array) out[propMod].sort(keyInfoArray.fnSort);

					return handleCompositeKeys();
				}

				if (keyInfo instanceof IgnoredKey) {
					out[propMod] = obj[propMod];
					return handleCompositeKeys();
				}

				throw new Error(`Unimplemented!`);
			});

		// ensure any non-orderable keys are maintained
		const otherKeys = new Set([...keySetStandard, ...keyLookupComposite]).difference(seenKeys);
		[...otherKeys].forEach(prop => {
			out[prop] = obj[prop];
			if (!opts.fnUnhandledKey) return;

			const propMod = opts.isFoundryPrefixProps ? `foundry${prop.uppercaseFirst()}` : prop;
			const logPathNxt = this._getLogPathNext({opts: {...opts}, logPath, prop, propMod});
			opts.fnUnhandledKey(logPathNxt);
		});

		return out;
	}

	static hasOrder (dataProp) { return !!PROPORDER_PROP_TO_LIST[dataProp]; }
}
