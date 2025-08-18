import fs from "fs";
import * as ut from "./util.js"; // Assuming `listFiles` and `readJson` exist in util.js

// Function to find all valid 'data' nodes (from adventureData or top-level)
const findDataNodes = (json) => {
	const isValidData = (arr) => arr.some(item => item.type === "section" || item.type === "entries");

	const adventureDataNodes = (json.adventureData || [])
		.filter(adventure => Array.isArray(adventure.data) && isValidData(adventure.data))
		.map(adventure => adventure.data);

	const topLevelDataNode = Array.isArray(json.data) && isValidData(json.data) ? [json.data] : [];

	return [...adventureDataNodes, ...topLevelDataNode].length ? [...adventureDataNodes, ...topLevelDataNode] : null;
};

// Function to find @item and @creature tags
const findTags = (json) => {
	let items = new Set();
	let creatures = new Set();

	// Recursive function to search through the entire JSON object
	const searchEntries = (obj) => {
		if (typeof obj === "string") {
			// Regex to find @item or @creature tags
			const tagMatch = obj.match(/\{@(item|creature) ([^}]+)\}/g);
			if (tagMatch) {
				tagMatch.forEach(tag => {
					const [_, type, name] = tag.match(/\{@(item|creature) ([^}]+)\}/);
					if (type === "item") items.add(name);
					if (type === "creature") creatures.add(name);
				});
			}
		} else if (Array.isArray(obj)) {
			obj.forEach(entry => searchEntries(entry));
		} else if (typeof obj === "object" && obj !== null) {
			Object.values(obj).forEach(value => searchEntries(value));
		}
	};

	searchEntries(json);

	return {
		items: [...items],
		creatures: [...creatures],
	};
};

// Function to determine the next appendix name prefix
const getNextAppendixName = (sections) => {
	const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
	let maxAlpha = "";
	let maxRoman = 0;
	let maxNumeric = 0;
	let noNumberAppendix = false;

	sections.forEach(section => {
		const match = section.name?.match(/^Appendix\s*(\w*):/);
		if (match) {
			const appendixType = match[1];
			if (!appendixType) {
				noNumberAppendix = true; // "Appendix: " case
			} else if (/^[A-HJ-Z]$/.test(appendixType)) {
				// Alphabet case: ignoring "I" to avoid conflict with Roman numerals
				maxAlpha = appendixType > maxAlpha ? appendixType : maxAlpha;
			} else if (/^\d+$/.test(appendixType)) {
				maxNumeric = Math.max(maxNumeric, parseInt(appendixType)); // Numeric case
			} else if (romanNumerals.includes(appendixType)) {
				maxRoman = Math.max(maxRoman, romanNumerals.indexOf(appendixType) + 1); // Roman numeral case
			}
		}
	});

	// Prioritize the appendix numbering scheme found
	if (noNumberAppendix) return "Appendix: "; // For unnumbered appendices
	if (maxAlpha) return `Appendix ${String.fromCharCode(maxAlpha.charCodeAt(0) + 1)}: `;
	if (maxNumeric) return `Appendix ${maxNumeric + 1}: `;
	if (maxRoman) return `Appendix ${romanNumerals[maxRoman]}: `;

	return "Appendix A: "; // Default case if nothing is found
};

// Function to generate appendices for items and creatures
const generateAppendices = ({ items, creatures, sections }) => {
	const newAppendices = [];
	let nextAppendixName = getNextAppendixName(sections);

	// Generate Magic Items Appendix
	if (items.length) {
		newAppendices.push({
			type: "section",
			name: `${nextAppendixName}Magic Items`,
			page: 52,
			id: "199",
			entries: [
				"A magic item is a wondrous treasure that adventurers find in a monster's hoard, in a trap-riddled dungeon, or in the possession of a slain foe. Every adventure holds the promise—but not a guarantee—of finding one or more magic items.",
				{
					type: "section",
					name: "Item Descriptions",
					page: 52,
					entries: [
						{
							type: "list",
							columns: 3,
							items: items.map(item => `{@item ${item}}`),
						},
					],
				},
			],
		});
		nextAppendixName = getNextAppendixName([...sections, ...newAppendices]);
	}

	// Generate Monsters Appendix
	if (creatures.length) {
		newAppendices.push({
			type: "section",
			name: `${nextAppendixName}Monsters and NPCs`,
			page: 54,
			entries: [
				"The monsters and NPCs appearing in the adventure are presented in this section in alphabetical order.",
				{
					type: "list",
					columns: 3,
					items: creatures.map(creature => `{@creature ${creature}}`),
				},
			],
		});
	}

	return newAppendices;
};

// Function to add appendices to adventure.contents array if it exists
const updateAdventureContents = (json, appendices) => {
	if (!json.adventure || !Array.isArray(json.adventure)) return;

	const adventure = json.adventure[0]; // Assuming top-level adventure object
	if (!adventure.contents || !Array.isArray(adventure.contents)) return;

	// Loop through appendices and insert them into contents
	appendices.forEach((appendix, index) => {
		const identifier = appendix.name.match(/^Appendix (\w):/)[1]; // Extracting A, B, etc.
		adventure.contents.push({
			name: appendix.name.replace(/^Appendix \w: /, ""), // Strip out the "Appendix X: " part
			ordinal: {
				type: "appendix",
				identifier: identifier,
			},
		});
	});
};

// Main function to run the process
async function processAdventure (filePath) {
	const json = ut.readJson(filePath); // Read the JSON file using a utility function

	// Find all valid 'data' nodes
	const allDataNodes = findDataNodes(json);
	if (!allDataNodes) {
		console.log("No valid data nodes found.");
		process.exit(1);
	}

	let allItems = new Set();
	let allCreatures = new Set();
	let allSections = [];

	// Loop through all found data nodes and scan each entry's data
	allDataNodes.forEach(dataNode => {
		const { items, creatures } = findTags(dataNode);
		allSections = [...allSections, ...dataNode];

		// Add found items and creatures to the overall set
		items.forEach(item => allItems.add(item));
		creatures.forEach(creature => allCreatures.add(creature));
	});

	// Convert the sets to arrays
	const finalItems = [...allItems];
	const finalCreatures = [...allCreatures];

	// Generate appendices for items and creatures
	const newAppendices = generateAppendices({ items: finalItems, creatures: finalCreatures, sections: allSections });

	if (!newAppendices.length) {
		console.log("No magic items or creatures found in the adventure.");
		process.exit(0);
	}

	// Check for "Credits" section and determine insert position
	for (const dataNode of allDataNodes) {
		const creditsIndex = dataNode.findIndex(section => section.name === "Credits");

		// Display in console first
		console.log("\nGenerated Appendices:");
		console.log(JSON.stringify(newAppendices, null, 2));

		// Ask the user if they want to apply the changes
		const applyChanges = await promptUser("\nWould you like to apply these changes to the JSON file? (y/n): ");
		if (applyChanges) {
			if (creditsIndex !== -1) {
				// Insert appendices before the "Credits" section
				dataNode.splice(creditsIndex, 0, ...newAppendices);
			} else {
				// Insert appendices at the end if no "Credits" section exists
				dataNode.push(...newAppendices);
			}

			// Update adventure.contents if applicable
			updateAdventureContents(json, newAppendices);

			// Write the updated JSON back to the file
			fs.writeFileSync(filePath, JSON.stringify(json, null, "\t"), "utf-8"); // Save with tabbed indentation
			console.log(`Appendices applied to ${filePath}`);
			process.exit(0);
		} else {
			console.log("No changes applied.");
			process.exit(0);
		}
	}
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

// Execute the process
const filePath = process.argv[2];
if (filePath) {
	processAdventure(filePath);
} else {
	console.log("Usage: node generateAppendices.js <path_to_adventure_json>");
	process.exit(1);
}
