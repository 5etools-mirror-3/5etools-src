import "../../lib/ace-linters/service-manager.js";
import "../../lib/ace-linters/json-service.js";

// See: https://github.com/mkslanc/ace-linters/wiki/Configuring-Ace-linters-with-JSON-language-service
new globalThis.ServiceManager(globalThis)
	.registerService("json", {
		module: async () => ({JsonService: globalThis.JsonService}),
		className: "JsonService",
		modes: "json",
	});
