export default {
	meta: {
		name: "vet-jquery",
		version: "0.1.0",
	},

	rules: {
		"jquery": {
			meta: {
				type: "problem",
				docs: {
					description: "likely jQuery usage",
				},
				schema: [], // no options
			},
			create (context) {
				let isAnyFound = false;
				return {
					"Identifier": node => {
						if (!process.env["VET_LINT_JQUERY"]) return;

						if (
							node.name === "jQuery"
							|| node.name.includes("$")
						) {
							// E.g.:
							// `Set-Item -Path env:VET_LINT_JQUERY__FLAG_ONLY -Value "1"`
							if (isAnyFound && process.env["VET_LINT_JQUERY__FLAG_ONLY"]) return;
							isAnyFound = true;

							context.report({
								node: node,
								message: `likely jQuery usage (${node.name})`,
							});
						}
					},
				};
			},
		},
	},
};
