export class DataLoaderInternalUtil {
	static getCleanPageSourceHash ({page, source, hash}) {
		return {
			page: this.getCleanPage({page}),
			source: this.getCleanSource({source}),
			hash: this.getCleanHash({hash}),
		};
	}

	static getCleanPage ({page}) { return page.toLowerCase(); }
	static getCleanSource ({source}) { return source.toLowerCase(); }
	static getCleanHash ({hash}) { return hash.toLowerCase(); }

	/* -------------------------------------------- */

	static getCleanPageFluff ({page}) { return `${this.getCleanPage({page})}fluff`; }

	/* -------------------------------------------- */

	static _NOTIFIED_FAILED_DEREFERENCES = new Set();

	static doNotifyFailedDereferences ({missingRefSets, diagnostics}) {
		// region Avoid repeatedly throwing errors for the same missing references
		const missingRefSetsUnseen = Object.entries(missingRefSets)
			.mergeMap(([prop, set]) => ({
				[prop]: new Set(
					[...set]
						.filter(ref => {
							const refLower = ref.toLowerCase();
							const out = !this._NOTIFIED_FAILED_DEREFERENCES.has(refLower);
							this._NOTIFIED_FAILED_DEREFERENCES.add(refLower);
							return out;
						}),
				),
			}));
		// endregion

		const cntMissingRefs = Object.values(missingRefSetsUnseen).map(({size}) => size).sum();
		if (!cntMissingRefs) return;

		const notificationRefs = Object.entries(missingRefSetsUnseen)
			.map(([k, v]) => `${k}: ${[...v].sort(SortUtil.ascSortLower).join(", ")}`)
			.join("; ");

		const ptDiagnostics = globalThis.DataLoader.getDiagnosticsSummary(diagnostics);
		const msgStart = `Failed to load references for ${cntMissingRefs} entr${cntMissingRefs === 1 ? "y" : "ies"}!`;

		JqueryUtil.doToast({
			type: "danger",
			content: `${msgStart} Reference types and values were: ${[notificationRefs, ptDiagnostics].join(" ")}`,
			isAutoHide: false,
		});

		const cnslRefs = [
			...Object.entries(missingRefSetsUnseen)
				.map(([k, v]) => `${k}:\n\t${[...v].sort(SortUtil.ascSortLower).join("\n\t")}`),
			ptDiagnostics,
		]
			.filter(Boolean)
			.join("\n");

		setTimeout(() => { throw new Error(`${msgStart}\nReference types and values were:\n${cnslRefs}`); });
	}
}
