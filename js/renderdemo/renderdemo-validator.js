export class RenderDemoValidator {
	static SCHEMA_URI = "https://raw.githack.com/TheGiddyLimit/5etools-utils/master/schema/site/entry.json";

	static async pInit ({editor}) {
		await Promise.all([
			new Promise(resolve => ace.config.loadModule("ace/ext/language_tools", resolve)),
			import("../../lib/ace-linters/ace-linters.js"),
		]);

		// See: https://github.com/mkslanc/ace-linters/wiki/Configuring-Ace-linters-with-JSON-language-service
		const worker = new Worker(new URL("./renderdemo-worker.js", import.meta.url), {type: "module"});
		const provider = globalThis.LanguageProvider.create(
			worker,
			{
				functionality: {
					// Prefer existing `CleanUtil`
					format: false,

					// Functionally-useless for our JSON
					showUnusedDeclarations: false,

					// region Unsupported/disable to avoid loading additional modules
					documentHighlights: false,
					signatureHelp: false,
					codeActions: false,
					// endregion
				},
			},
		);
		provider.setGlobalOptions(
			"json",
			{
				schemas: [{uri: this.SCHEMA_URI}],
				allowComments: false,
			},
		);
		provider.registerEditor(editor);
		provider.setDocumentOptions(
			editor.session,
			{schemaUri: this.SCHEMA_URI},
		);

		editor.setOptions({
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true,
		});
	}
}
