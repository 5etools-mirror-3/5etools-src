export class List2SyntaxParser {
	static getParsedSyntaxInfo ({searchTerm, reCommand}) {
		const chars = searchTerm
			.trim()
			.split("");

		let stack = "";
		let command = null;
		let delim = null;
		let isEscaped = false;

		const syntaxMetasRaw = [];
		const searchTermParts = [];

		const doReset = () => {
			stack = "";
			command = null;
			delim = null;
			isEscaped = false;
		};

		const doPopStack = () => {
			stack = stack.trim();

			if (!stack) return doReset();

			if (command) {
				syntaxMetasRaw.push({
					command: command,
					term: stack,
					isDelimited: !!delim,
				});
				return doReset();
			}

			searchTermParts.push(stack);
			return doReset();
		};

		for (const c of chars) {
			switch (c) {
				case `\\`: {
					if (isEscaped) {
						stack += "\\";
						isEscaped = false;
					} else {
						isEscaped = true;
					}
					break;
				}

				case `"`:
				case `/`: {
					if (isEscaped) {
						stack += c;
						isEscaped = false;
						break;
					}

					if (delim === c) {
						stack += c;
						doPopStack();
					} else if (delim) {
						stack += c;
					} else {
						stack += c;
						delim = c;
					}
					break;
				}

				case ":": {
					const mCommand = reCommand.exec(stack);
					if (!mCommand) {
						stack += c;
						break;
					}

					command = mCommand.groups.command;
					stack = "";

					break;
				}

				case " ": {
					if (delim) {
						stack += c;
						break;
					}

					// Ignore e.g. leading whitespace after a command
					if (!stack) {
						break;
					}

					doPopStack();

					break;
				}

				default: {
					stack += c;
				}
			}
		}

		doPopStack();

		let searchTermOut = searchTermParts
			.join(" ")
			.trim()
			.replace(/\s+/g, " ");

		// Special case for retaining old functionality
		// `text:hello world` should be parsed as `text:"hello world"`
		if (searchTermParts.length && syntaxMetasRaw.length === 1 && !syntaxMetasRaw[0].isDelimited) {
			syntaxMetasRaw[0].term = `"${syntaxMetasRaw[0].term} ${searchTermOut}"`;
			syntaxMetasRaw[0].isDelimited = true;
			searchTermOut = "";
		}

		return {
			syntaxMetasRaw,
			searchTerm: searchTermOut,
		};
	}
}
