import fs from "fs";
import * as ut from "./util.js"; // Assuming `listFiles` and `readJson` exist in util.js

// Function to parse headers from a node
const parseHeaders = (node, maxDepth) => {
	const headers = [];

	const traverse = (obj, currentDepth) => {
		if (currentDepth > maxDepth) return;

		if (Array.isArray(obj)) {
			obj.forEach(item => traverse(item, currentDepth));
		} else if (typeof obj === "object" && obj !== null) {
			// Handle both section and entries types that have names
			// Skip if it's the top-level node (currentDepth === 1 && obj === node)
			if ((obj.type === "section" || obj.type === "entries") && obj.name && !(currentDepth === 1 && obj === node)) {
				headers.push({
					depth: currentDepth,
					header: obj.name,
					index: headers.filter(h => h.header === obj.name).length,
				});
			}

			// Handle entries
			if (Array.isArray(obj.entries)) {
				obj.entries.forEach(entry => traverse(entry, currentDepth + 1));
			}
		}
	};

	traverse(node, 1);
	return headers;
};

// Function to generate Table of Contents
const generateTableOfContents = (dataNodes, maxDepth, ordinalType) => {
	const contents = [];

	dataNodes.forEach((node) => {
		const chapter = {
			name: node.name || "Untitled",
		};

		// Only add ordinal if specified
		if (ordinalType) {
			chapter.ordinal = {
				type: ordinalType,
				identifier: contents.length + 1,
			};
		}

		// Parse headers from the node
		const headers = parseHeaders(node, maxDepth);

		// Only add headers array if there are headers
		if (headers.length > 0) {
			// Map headers, handling depth 2 as strings and depth 3+ as objects
			chapter.headers = headers.map(header => {
				// For depth 2, just return the header text
				if (header.depth === 2) {
					return header.header;
				}

				// For depth 3+, return object with 'header' property instead of 'text'
				const headerObj = {
					header: header.header,
					depth: header.depth,
				};

				// Only add index if this header appears multiple times
				if (headers.filter(h => h.header === header.header).length > 1) {
					headerObj.index = header.index;
				}

				return headerObj;
			});
		}

		contents.push(chapter);
	});

	return contents;
};

// Main function to run the process
async function processAdventure (filePath, maxDepth, ordinalType) {
	const json = ut.readJson(filePath);

	// Find all valid 'data' nodes
	const allDataNodes = findDataNodes(json);
	if (!allDataNodes) {
		console.log("No valid data nodes found.");
		process.exit(1);
	}

	let allSections = [];

	// Loop through all found data nodes and scan each entry's data
	allDataNodes.forEach(dataNode => {
		allSections = [...allSections, ...dataNode];
	});

	// Generate Table of Contents
	const tableOfContents = generateTableOfContents(allSections, maxDepth, ordinalType);
	
	// Display generated ToC first
	console.log("\nGenerated Table of Contents:");
	console.log(JSON.stringify(tableOfContents, null, 3));

	// Ask the user if they want to apply the changes
	const applyChanges = await promptUser("\nWould you like to apply these changes to the JSON file? (y/n): ");
	if (applyChanges) {
		if (!json.adventure?.[0]?.contents) {
			console.log("No contents array found in adventure.");
			process.exit(1);
		}

		// Update the contents array in the JSON
		json.adventure[0].contents = tableOfContents;

		// Write the updated JSON back to the file
		fs.writeFileSync(filePath, JSON.stringify(json, null, 3), "utf-8");
		console.log(`Table of Contents applied to ${filePath}`);
	} else {
		console.log("No changes applied.");
	}

	process.exit(0);
}

// Function to prompt user for input
const promptUser = (message) => {
	return new Promise((resolve) => {
		process.stdout.write(message);
		process.stdin.once("data", (data) => {
			resolve(data.toString().trim().toLowerCase() === "y");
		});
	});
};

// Function to find all valid 'data' nodes (from adventureData or top-level)
const findDataNodes = (json) => {
	const isValidData = (arr) => arr.some(item => item.type === "section" || item.type === "entries");

	const adventureDataNodes = (json.adventureData || [])
		.filter(adventure => Array.isArray(adventure.data) && isValidData(adventure.data))
		.map(adventure => adventure.data);

	const topLevelDataNode = Array.isArray(json.data) && isValidData(json.data) ? [json.data] : [];

	return [...adventureDataNodes, ...topLevelDataNode].length ? [...adventureDataNodes, ...topLevelDataNode] : null;
};

// Execute the process
const filePath = process.argv[2];
const maxDepth = parseInt(process.argv[3], 10) || 2; // Default to 2
const ordinalType = process.argv[4] || ""; // Default to empty string (no ordinal)

if (filePath) {
	processAdventure(filePath, maxDepth, ordinalType);
} else {
	console.log("Usage: node generate-table-of-contents-data.js <path_to_adventure_json> [maxDepth] [ordinalType]");
	process.exit(1);
}