import {spawn} from "node:child_process";
import {isMainThread, parentPort} from "node:worker_threads";

if (isMainThread) throw new Error(`Worker must not be started in main thread!`);

let isCancelled = false;

const pRunFile = ({filePath, fileNumber}) => {
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
		});

		proc.stderr.on("data", chunk => {
			const text = chunk.toString();
			output += text;
		});

		proc.on("error", err => {
			const text = `${err?.stack || err}\n`;
			output += text;
		});

		proc.on("close", (code, signal) => {
			resolve({
				filePath,
				fileNumber,
				exitCode: code ?? (signal ? 1 : 0),
				output,
			});
		});
	});
};

parentPort.on("message", async msg => {
	switch (msg.type) {
		case "init": {
			parentPort.postMessage({
				type: "ready",
				payload: {},
			});
			break;
		}

		case "cancel": {
			isCancelled = true;
			break;
		}

		case "work": {
			if (isCancelled) {
				parentPort.postMessage({
					type: "done",
					payload: {},
				});
				return;
			}

			const runInfo = await pRunFile(msg.payload);
			parentPort.postMessage({
				type: "done",
				payload: {
					runInfo,
				},
			});
			break;
		}
	}
});
