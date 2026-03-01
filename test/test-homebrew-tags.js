import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import {spawn} from "child_process";
import {Command} from "commander";
import {getCliJsonFiles, mutCommanderJsonFileOptions} from "../node/util-commander.js";

const _PATH_REPORT = "test/test-homebrew-tags.log";
const _PATH_DEFAULT_HOMEBREW_DIR = "../homebrew";

const program = mutCommanderJsonFileOptions({command: new Command()});
program.parse(process.argv);

const params = program.opts();

const getTargetFiles = () => {
	let jsonFiles = getCliJsonFiles(
		{
			dirs: params.dir,
			files: params.file,
			fnMutDefaultSelection: ({dirs}) => dirs.push(_PATH_DEFAULT_HOMEBREW_DIR),
			convertedBy: params.convertedBy,
			filter: params.filter,
		},
	);

	return jsonFiles.map(jsonFile => jsonFile.getFilePath());
};

const pRunFile = ({filePath}) => {
	return new Promise(resolve => {
		const args = [
			"test/test-tags.js",
			"--file-additional",
			filePath,
			"--skip-non-additional",
		];

		const proc = spawn(
			process.execPath,
			args,
			{
				env: process.env,
				stdio: ["ignore", "pipe", "pipe"],
			},
		);

		let output = "";
		proc.stdout.on("data", chunk => {
			const text = chunk.toString();
			output += text;
			process.stdout.write(text);
		});
		proc.stderr.on("data", chunk => {
			const text = chunk.toString();
			output += text;
			process.stderr.write(text);
		});
		proc.on("error", err => {
			const text = `${err?.stack || err}`;
			output += `${text}\n`;
			process.stderr.write(`${text}\n`);
		});

		proc.on("close", (code, signal) => {
			resolve({
				filePath,
				exitCode: code ?? (signal ? 1 : 0),
				output,
			});
		});
	});
};

const doWriteReport = ({runInfosFailed}) => {
	const out = runInfosFailed
		.map(runInfo => {
			return [
				"===== BEGIN RUN =====",
				`FILE: ${runInfo.filePath}`,
				"",
				runInfo.output.trimEnd(),
				"",
				"===== END RUN =====",
				"",
			]
				.join("\n");
		});

	fs.writeFileSync(_PATH_REPORT, out.join("\n"), "utf8");
};

const main = async () => {
	const files = getTargetFiles();

	if (!files.length) {
		if (params.filter || params.convertedBy) throw new Error(`Did not find any JSON files matching the provided filters!`);
		throw new Error(`Did not find any JSON files in target directories/files!`);
	}

	console.log(`Running test-tags on ${files.length} file${files.length === 1 ? "" : "s"}...`);

	const runInfosFailed = [];
	await files.pSerialAwaitMap(async filePath => {
		console.log(`\n=====\nTesting tags in file "${filePath}"...`);

		const runInfo = await pRunFile({filePath});
		if (runInfo.exitCode) runInfosFailed.push(runInfo);
	});

	doWriteReport({runInfosFailed});

	if (runInfosFailed.length) {
		console.log(`\n${runInfosFailed.length} tag test${runInfosFailed.length === 1 ? "" : "s"} failed! Output report to "${_PATH_REPORT}".`);
	} else {
		console.log(`\nAll tag tests passed!`);
	}

	return !runInfosFailed.length;
};

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
