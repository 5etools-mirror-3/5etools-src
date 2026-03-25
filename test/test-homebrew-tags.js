import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import {Worker} from "node:worker_threads";
import {Command} from "commander";
import {Deferred, WorkerList, getCntWorkers} from "5etools-utils/lib/WorkerList.js";
import {getCliJsonFiles, mutCommanderJsonFileOptions} from "../node/util-commander.js";
import {PATH_DEFAULT_HOMEBREW_DIR, PATH_DEFAULT_PRERELEASE_DIR} from "./util-test.js";

const _PATH_REPORT = "test/temp/test-homebrew-tags.log";

const program = mutCommanderJsonFileOptions({command: new Command()})
	.option("--prerelease-root <filepath>", `When loading additional files, nested prerelease dependencies will be loaded against this root`, PATH_DEFAULT_PRERELEASE_DIR)
	.option("--homebrew-root <filepath>", `When loading additional files, nested homebrew dependencies will be loaded against this root`, PATH_DEFAULT_HOMEBREW_DIR);
program.parse(process.argv);

const params = program.opts();

const getTargetFiles = () => {
	let jsonFiles = getCliJsonFiles(
		{
			dirs: params.dir,
			files: params.file,
			fnMutDefaultSelection: ({dirs}) => dirs.push(PATH_DEFAULT_HOMEBREW_DIR),
			convertedBy: params.convertedBy,
			filter: params.filter,
		},
	);

	return jsonFiles.map(jsonFile => jsonFile.getFilePath());
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

const pDoProcessFiles = async ({files}) => {
	const cntWorkers = Math.min(files.length, getCntWorkers());
	const workerList = new WorkerList();

	const runInfos = [];
	let cntUnknownFailures = 0;

	const workers = [...new Array(cntWorkers)]
		.map(() => {
			const worker = new Worker(new URL("./test-homebrew-tags-worker.js", import.meta.url));

			worker.on("message", msg => {
				switch (msg.type) {
					case "ready": {
						workerList.add(worker);
						break;
					}

					case "done": {
						if (msg.payload?.runInfo) {
							runInfos.push(msg.payload.runInfo);

							const {filePath, output = ""} = msg.payload.runInfo;
							process.stdout.write(`\n=====\nTesting tags in file "${filePath}"...\n`);
							process.stdout.write(output);
							if (!output.endsWith("\n")) process.stdout.write("\n");
						}
						if (worker.dIsActive) worker.dIsActive.resolve();
						workerList.add(worker);
						break;
					}
				}
			});

			worker.on("error", err => {
				cntUnknownFailures++;
				process.stderr.write(`${err?.stack || err}\n`);
				if (worker.dIsActive) worker.dIsActive.resolve();
			});

			worker.postMessage({type: "init"});
			return worker;
		});

	for (let i = 0; i < files.length; ++i) {
		const worker = await workerList.get();
		const filePath = files[i];

		worker.dIsActive = new Deferred();
		worker.postMessage({
			type: "work",
			payload: {
				filePath,
				fileNumber: i + 1,
				prereleaseRoot: params.prereleaseRoot,
				homebrewRoot: params.homebrewRoot,
			},
		});
	}

	await Promise.all(workers.map(worker => worker.dIsActive?.promise));
	await Promise.all(workers.map(worker => worker.terminate()));

	return {
		runInfos,
		cntUnknownFailures,
	};
};

const main = async () => {
	const files = getTargetFiles();

	if (!files.length) {
		if (params.filter || params.convertedBy) throw new Error(`Did not find any JSON files matching the provided filters!`);
		throw new Error(`Did not find any JSON files in target directories/files!`);
	}

	console.log(`Running test-tags on ${files.length} file${files.length === 1 ? "" : "s"}...`);
	const tStart = Date.now();

	const {runInfos, cntUnknownFailures} = await pDoProcessFiles({files});
	const runInfosFailed = runInfos
		.filter(runInfo => runInfo.exitCode)
		.sort((a, b) => SortUtil.ascSort(a.fileNumber, b.fileNumber));

	doWriteReport({runInfosFailed});

	console.log(`\nCompleted in ${((Date.now() - tStart) / 1000).toFixed(2)}s.`);
	if (runInfosFailed.length || cntUnknownFailures) {
		console.log(`${runInfosFailed.length} tag test${runInfosFailed.length === 1 ? "" : "s"} failed! Output report to "${_PATH_REPORT}".`);
		if (cntUnknownFailures) console.log(`${cntUnknownFailures} worker failure${cntUnknownFailures === 1 ? "" : "s"} occurred.`);
	} else {
		console.log(`All tag tests passed!`);
	}

	return !(runInfosFailed.length || cntUnknownFailures);
};

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
