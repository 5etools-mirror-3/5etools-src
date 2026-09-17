import * as ut from "../node/util.js";

const _TESTS = [
	{file: "./data/actions.json", prop: "action", name: "Influence", source: "XPHB", isSrd52: true},
	{file: "./data/actions.json", prop: "action", name: "Study", source: "XPHB", isSrd52: true},
	{file: "./data/items-base.json", prop: "baseitem", name: "Firearm Bullet", source: "XPHB", isSrd52: true},
	{file: "./data/items-base.json", prop: "baseitem", name: "Firearm Bullets (10)", source: "XPHB", isSrd52: true},
	{file: "./data/bestiary/bestiary-xdmg.json", prop: "monster", name: "Avatar of Death", source: "XDMG", isSrd52: true},
	{file: "./data/bestiary/bestiary-xdmg.json", prop: "monster", name: "Giant Fly", source: "XDMG", isSrd52: true},
	{file: "./data/bestiary/bestiary-xmm.json", prop: "monster", name: "Psychic Gray Ooze", source: "XMM", isSrd52: false},
];

function main () {
	console.log(`##### Testing SRD 5.2.1 membership... #####`);

	const errors = [];
	const cache = new Map();

	_TESTS.forEach(({file, prop, name, source, isSrd52}) => {
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const data = cache.get(file);
		const matches = (data[prop] || []).filter(ent => ent.name === name && ent.source === source);

		if (matches.length !== 1) {
			errors.push(`${file} :: ${prop} :: ${name}|${source} :: expected exactly one entity, found ${matches.length}`);
			return;
		}

		const isSrd52Actual = !!matches[0].srd52;
		if (isSrd52Actual === isSrd52) return;

		errors.push(`${file} :: ${prop} :: ${name}|${source} :: expected srd52=${isSrd52}, found ${isSrd52Actual}`);
	});

	if (!errors.length) {
		console.log(`##### SRD 5.2.1 membership test passed! #####`);
		return true;
	}

	console.error(`##### SRD 5.2.1 membership test failed! #####\n${errors.map(it => `\t${it}`).join("\n")}`);
	return false;
}

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
