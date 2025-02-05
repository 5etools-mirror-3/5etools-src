export const CONFIG_IGNORES = {
	// Note: there should be no other properties in this object
	ignores: [
		// Other dirs
		"audio/*",
		"certs/*",
		"css/*",
		"data/*",
		"doc/*",
		"docker/*",
		"docker-build/*",
		"fonts/*",
		"homebrew/*",
		"icon/*",
		"img/*",
		"prerelease/*",
		"scss/*",
		"search/*",
		"spellcheck/*",

		// Generated
		"sw.js",
		"sw-injector.js",

		// Libraries
		"lib/*",
		"node_modules/*",

		// Scratches
		"scratch/*",
		"trash/*",
		"trash_in/*",
	],
};
