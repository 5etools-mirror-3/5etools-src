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

		return this._getOrdered(obj, PROPORDER_ROOT, opts, "root");
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

		return this._getOrdered(obj, order, opts, dataProp);
	}

	static _getModifiedProp ({keyInfo, isFoundryPrefixProps}) {
		const prop = this._getKeyProp(keyInfo);

		if (!isFoundryPrefixProps || prop.startsWith("_")) return prop;

		return prop.replace(/^foundry/, "").lowercaseFirst();
	}

	static _getOrdered (obj, order, opts, logPath) {
		const out = {};
		const keySet = new Set(Object.keys(obj));
		const seenKeys = new Set();

		order
			.forEach(keyInfo => {
				const prop = this._getKeyProp(keyInfo);
				const propMod = this._getModifiedProp({keyInfo, isFoundryPrefixProps: opts.isFoundryPrefixProps});

				if (opts.isFoundryPrefixProps && !prop.startsWith("_") && !prop.startsWith("foundry")) return;

				if (!keySet.has(propMod)) return;
				seenKeys.add(propMod);

				if (typeof keyInfo === "string") {
					out[propMod] = obj[propMod];
					return;
				}

				if (!obj[propMod]) return out[propMod] = obj[propMod]; // Handle nulls

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
					const logPathNxt = `${logPath}.${prop}${propMod !== prop ? ` (${propMod})` : ""}`;
					if (keyInfoObj.fnGetOrder) out[propMod] = this._getOrdered(obj[propMod], keyInfoObj.fnGetOrder(obj[propMod]), optsNxt, logPathNxt);
					else if (keyInfoObj.order) out[propMod] = this._getOrdered(obj[propMod], keyInfoObj.order, optsNxt, logPathNxt);
					else out[propMod] = obj[propMod];
					return;
				}

				const keyInfoArray = keyInfo instanceof ArrayKey
					? keyInfo
					: (keyInfo instanceof ObjectOrArrayKey && obj[propMod] instanceof Array) ? keyInfo.arrayKey : null;

				if (keyInfoArray) {
					const logPathNxt = `${logPath}[n].${prop}${propMod !== prop ? ` (${propMod})` : ""}`;
					if (keyInfoArray.fnGetOrder) out[propMod] = obj[propMod].map(it => this._getOrdered(it, keyInfoArray.fnGetOrder(obj[propMod]), optsNxt, logPathNxt));
					else if (keyInfoArray.order) out[propMod] = obj[propMod].map(it => this._getOrdered(it, keyInfoArray.order, optsNxt, logPathNxt));
					else out[propMod] = obj[propMod];

					if (!opts.isNoSortRootArrays && keyInfoArray.fnSort && out[propMod] instanceof Array) out[propMod].sort(keyInfoArray.fnSort);

					return;
				}

				if (keyInfo instanceof IgnoredKey) {
					out[propMod] = obj[propMod];

					return;
				}

				throw new Error(`Unimplemented!`);
			});

		// ensure any non-orderable keys are maintained
		const otherKeys = keySet.difference(seenKeys);
		[...otherKeys].forEach(prop => {
			out[prop] = obj[prop];
			if (!opts.fnUnhandledKey) return;

			const propMod = opts.isFoundryPrefixProps ? `foundry${prop.uppercaseFirst()}` : prop;
			const logPathNxt = `${logPath}.${prop}${propMod !== prop ? ` (${propMod})` : ""}`;
			opts.fnUnhandledKey(logPathNxt);
		});

		return out;
	}

	static hasOrder (dataProp) { return !!PROPORDER_PROP_TO_LIST[dataProp]; }
}
