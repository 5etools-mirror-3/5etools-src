/**
 * Rename bestiary fluff images to match the source they originate from.
 *
 * This script assumes the user has a symlink to the image repo as "img".
 */

import fs from "fs";

function cleanBestiaryFluffImages () {
	console.log(`##### Cleaning bestiary fluff images #####`);

	// read all the image dirs and track which images are actually in use
	const _ALL_IMAGE_PATHS = new Set();
	const PATH_BESTIARY_IMAGES = `./img/bestiary/`;
	fs.readdirSync(PATH_BESTIARY_IMAGES).forEach(f => {
		const path = `${PATH_BESTIARY_IMAGES}/${f}`;
		if (fs.lstatSync(path).isDirectory()) {
			fs.readdirSync(path).forEach(img => _ALL_IMAGE_PATHS.add(`bestiary/${f}/${img}`));
		}
	});

	function getCleanName (name) {
		return name
			.replace(/"/g, "")
			.replace(/\//g, " ");
	}

	const ixFluff = JSON.parse(fs.readFileSync(`./data/bestiary/fluff-index.json`, "utf-8"));
	const imageNameToCreatureName = {};
	Object.entries(ixFluff).forEach(([k, f]) => {
		const path = `./data/bestiary/${f}`;
		const fluff = JSON.parse(fs.readFileSync(path, "utf-8"));
		ixFluff[k] = {path, json: fluff}; // store the parsed data in the index object, for later writing
		fluff.monster.forEach(mon => {
			if (mon.images) {
				mon.images.forEach(img => {
					(imageNameToCreatureName[img.href.path] =
						imageNameToCreatureName[img.href.path] || []).push({name: mon.name, fluff: mon});
					_ALL_IMAGE_PATHS.delete(img.href.path);
				});
			}
		});
	});

	if (_ALL_IMAGE_PATHS.size) {
		console.error(`The following images were unused:`);
		_ALL_IMAGE_PATHS.forEach(it => console.error(it));
		throw new Error(`Could not clean bestiary fluff!`);
	}

	// a value of "true" in the mapping represents "map to the shortest available name in the array"
	const MAP_TO_SHORTEST = {
		"bestiary/GoS/Locathah.webp": true,
		"bestiary/MM/Gnoll.webp": true,
		"bestiary/MM/Orc.webp": true,
		"bestiary/MTF/Deathlock.webp": true,
		"bestiary/MTF/Tortle.webp": true,
		"bestiary/VGM/Darkling.webp": true,
		"bestiary/VGM/Grung.webp": true,
		"bestiary/VGM/Neogi.webp": true,
		"bestiary/VGM/Shadow-Mastiff.webp": true,
	};

	// a value of "true" in the mapping represents "map directly"
	const MAP_TO_VALUE = {
		"bestiary/GGR/Rakdos Performer.webp": true,
		"bestiary/GoS/Drowned-One.webp": true,
		"bestiary/MM/Dinosaurs.webp": true,
		"bestiary/MM/Giants.webp": true,
		"bestiary/MM/Fungi.webp": true,
		"bestiary/MM/Blights.webp": true,
		"bestiary/MM/Myconids.webp": true,
		"bestiary/MTF/Kruthik.webp": true,
		"bestiary/MTF/Oblex.webp": true,
		"bestiary/MTF/Steeder.webp": true,
		"bestiary/MTF/Gith.webp": true,
		"bestiary/MTF/Sword-Wraith.webp": true,
		"bestiary/VGM/Alhoon.webp": true,
		"bestiary/VGM/Firenewt.webp": true,
		"bestiary/VGM/Vegepygmy.webp": true,
		"bestiary/PotA/Crushing-Wave-Cultists.webp": true,
		"bestiary/ToA/Albino Dwarf.webp": true,
		"bestiary/WDH/The-Gralhunds.webp": true,
	};

	const multipleNames = Object.entries(imageNameToCreatureName)
		.filter(([img, metas]) => !MAP_TO_SHORTEST[img] && !MAP_TO_VALUE[img] && metas.length > 1);

	if (multipleNames.length) {
		console.error(`The following images could be mapped to multiple names:`);
		multipleNames.forEach(([img, metas]) => {
			console.error(`\t${`${img}\t`.padEnd(55, " ")} ${metas.map(m => m.name).join(", ")}`);
		});
		throw new Error(`Could not clean bestiary fluff!`);
	}

	// handle any special renames first
	Object.entries(imageNameToCreatureName).forEach(([img, metas]) => {
		if (MAP_TO_SHORTEST[img]) {
			const nameLen = Math.min(...metas.map(it => it.name.length));
			const cleanShortName = getCleanName(metas.find(it => it.name.length === nameLen).name);
			const pathParts = img.split("/");
			const namePart = pathParts.pop();
			const spl = namePart.split(".");
			if (spl.length > 2) throw new Error(`Could not extract extension from name "${namePart}"`);
			const nuPath = [...pathParts, `${cleanShortName}.${spl[1]}`].join("/");
			fs.renameSync(`./img/${img}`, `./img/${nuPath}`);

			metas.forEach(meta => {
				meta.fluff.images
					.filter(it => it.href.path === img && !it._IS_RENAMED)
					.forEach(it => {
						it.href.path = nuPath;
						it._IS_RENAMED = true;
					});
			});
		} else if (MAP_TO_VALUE[img]) {
			const nuPath = MAP_TO_VALUE[img] === true ? img.replace(/-/g, " ") : MAP_TO_VALUE[img];
			if (nuPath !== img) fs.renameSync(`./img/${img}`, `./img/${nuPath}`);
			metas.forEach(meta => {
				meta.fluff.images
					.filter(it => it.href.path === img && !it._IS_RENAMED)
					.forEach(it => {
						it.href.path = nuPath;
						it._IS_RENAMED = true;
					});
			});
		}
	});

	// handle straight renames
	Object.entries(imageNameToCreatureName)
		.filter(([img, metas]) => !MAP_TO_SHORTEST[img] && !MAP_TO_VALUE[img])
		.forEach(([img, metas]) => {
			const meta = metas[0];
			const cleanName = getCleanName(meta.name);
			meta.fluff.images
				.filter(it => !it._IS_RENAMED)
				.map((it, i) => {
					const pathParts = it.href.path.split("/");
					const namePart = pathParts.pop();
					const spl = namePart.split(".");
					if (spl.length > 2) throw new Error(`Could not extract extension from name "${namePart}"`);
					const nuPath = [...pathParts, `${cleanName}${i > 0 ? ` ${`${i}`.padStart(3, "0")}` : ""}.${spl[1]}`].join("/");
					fs.renameSync(`img/${it.href.path}`, `img/${nuPath}`);
					it.href.path = nuPath;
					it._IS_RENAMED = true;
				});
		});

	// cleanup
	Object.values(imageNameToCreatureName)
		.forEach(metas => metas.forEach(meta => meta.fluff.images.forEach(it => delete it._IS_RENAMED)));

	// write JSON files
	Object.values(ixFluff).forEach(meta => fs.writeFileSync(meta.path, CleanUtil.getCleanJson(meta.json), "utf-8"));

	console.log(`Done!`);
}

cleanBestiaryFluffImages();
