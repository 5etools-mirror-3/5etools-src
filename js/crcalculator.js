const MONSTER_STATS_BY_CR_JSON_URL = "data/msbcr.json";
const MONSTER_FEATURES_JSON_URL = "data/monsterfeatures.json";
let msbcr;
let monsterFeatures;

window.addEventListener("load", async () => {
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
	msbcr = await DataUtil.loadJSON(MONSTER_STATS_BY_CR_JSON_URL);
	const mfData = await DataUtil.loadJSON(MONSTER_FEATURES_JSON_URL);
	addMonsterFeatures(mfData);

	window.dispatchEvent(new Event("toolsLoaded"));
});

function addMonsterFeatures (mfData) {
	monsterFeatures = mfData.monsterfeatures;
	for (let i = 0; i < msbcr.cr.length; i++) {
		const curCr = msbcr.cr[i];
		veEs("#msbcr").vee.appends(`<tr><td>${curCr._cr}</td><td>${Parser.crToXp(curCr._cr)}</td><td>${curCr.pb}</td><td>${curCr.ac}</td><td>${curCr.hpMin}-${curCr.hpMax}</td><td>${curCr.attackBonus}</td><td>${curCr.dprMin}-${curCr.dprMax}</td><td>${curCr.saveDc}</td></tr>`);
	}

	veEm("#crcalc input").map(ele => ele.vee.onn("change", calculateCr));
	veEm("#saveprofs, #resistances").map(ele => ele.vee.onn("change", calculateCr));

	veEs("#saveinstead").vee.onChange((evt) => {
		const curVal = parseInt(veEs("#attackbonus").vee.val());
		if (!veE({ele: evt.target}).vee.prop(":checked")) veEs("#attackbonus").vee.val(curVal - 10);
		if (veE({ele: evt.target}).vee.prop(":checked")) veEs("#attackbonus").vee.val(curVal + 10);
		calculateCr();
	});

	function changeSize (selSize) {
		const newSize = selSize.vee.val();
		if (newSize === "Tiny") veEs("#hdval").vee.txt("d4");
		if (newSize === "Small") veEs("#hdval").vee.txt("d6");
		if (newSize === "Medium") veEs("#hdval").vee.txt("d8");
		if (newSize === "Large") veEs("#hdval").vee.txt("d10");
		if (newSize === "Huge") veEs("#hdval").vee.txt("d12");
		if (newSize === "Gargantuan") veEs("#hdval").vee.txt("d20");
		veEs("#hp").vee.val(calculateHp());
	}

	veEs("select#size").vee.onChange((evt) => {
		changeSize(veE({ele: evt.target}));
		calculateCr();
	});

	veEm("#hd, #con").map(ele => {
		ele.vee.onChange(function () {
			veEs("#hp").vee.val(calculateHp());
			calculateCr();
		});
	});

	// when clicking a row in the "Monster Statistics by Challenge Rating" table
	veEm("#msbcr tr:not(:has(th))").map(ele =>
		ele.vee.onn("click", async function () {
			if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "This will reset the calculator. Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			const [tdCr, , , tdAc, tdHp, tdAtk, tdDpr, tdSave] = this.children;

			veEs("#expectedcr").vee.val(tdCr.innerHTML.trim());
			const [minHp, maxHp] = tdHp.innerHTML.trim().split("-").map(it => parseInt(it));
			veEs("#hp").vee.val(minHp + (maxHp - minHp) / 2);
			veEs("#hd").vee.val(calculateHd());
			veEs("#ac").vee.val(tdAc.innerHTML);
			veEs("#dpr").vee.val(tdDpr.innerHTML.split("-")[0]);
			veEs("#attackbonus").vee.val(tdAtk.innerHTML);
			if (veEs("#saveinstead:checked")) veEs("#attackbonus").vee.val(tdSave.innerHTML);
			calculateCr();
		}));

	veEs("#hp").vee.onChange(function () {
		veEs("#hd").vee.val(calculateHd());
		calculateCr();
	});

	// parse monsterfeatures
	const wrpMonFeatures = veEs(`#monsterfeatures .crc__wrp_mon_features`);
	monsterFeatures.forEach(f => {
		const effectOnCr = [];
		if (f.hp) effectOnCr.push(`HP: ${f.hp}`);
		if (f.ac) effectOnCr.push(`AC: ${f.ac}`);
		if (f.dpr) effectOnCr.push(`DPR: ${f.dpr}`);
		if (f.attackBonus) effectOnCr.push(`AB: ${f.attackBonus}`);

		const numBox = f.hasNumberParam ? `<input type="number" value="0" min="0" class="ve-form-control form-control--minimal crc__mon_feature_num ve-input-xs ve-ml-2">` : "";

		wrpMonFeatures.vee.appends(`
			<label class="row crc__mon_feature ve-ui-tip__parent">
				<div class="ve-col-1 crc__mon_feature_wrp_cb">
					<input type="checkbox" id="mf-${Parser.stringToSlug(f.name)}" title="${f.name}" data-hp="${f.hp || ""}" data-ac="${f.ac || ""}" data-dpr="${f.dpr || ""}" data-attackbonus="${f.attackBonus || ""}" class="crc__mon_feature_cb">${numBox}
				</div>
				<div class="ve-col-2">${f.name}</div>
				<div class="ve-col-2">${Renderer.get().render(`{@creature ${f.example}}`)}</div>
				<div class="ve-col-7"><span title="${effectOnCr.join(", ")}">${Renderer.get().render(f.effect)}</span></div>
			</label>
		`);
	});

	function parseUrl () {
		if (window.location.hash) {
			const [expectedCr, ac, dpr, attackBonus, isSaveInsteadRaw, size, hitDice, conScore, isVulnerabilitiesRaw, resImmune, isFlyingRaw, cntSaveProfs] = window.location.hash.split("#")[1].split(",");
			veEs("#expectedcr").vee.val(expectedCr);
			veEs("#ac").vee.val(ac);
			veEs("#dpr").vee.val(dpr);
			veEs("#attackbonus").vee.val(attackBonus);
			if (isSaveInsteadRaw === "true") veEs("#saveinstead").vee.prop("checked", true);
			changeSize(veEs("#size").vee.val(size));
			veEs("#hd").vee.val(hitDice);
			veEs("#con").vee.val(conScore);
			veEs("#hp").vee.val(calculateHp());
			if (isVulnerabilitiesRaw === "true") veEs("#vulnerabilities").vee.prop("checked", true);
			veEs("#resistances").vee.val(resImmune);
			if (isFlyingRaw === "true") veEs("#flying").vee.prop("checked", true);
			veEs("#saveprofs").vee.val(cntSaveProfs);

			veEm(`.crc__mon_feature_cb`).map(ele => {
				const cb = veE({ele});
				const idCb = cb.vee.attr("id");
				const val = Hist.getSubHash(idCb);
				if (val) {
					cb.vee.prop("checked", true);
					if (val !== "true") {
						cb.vee.siblings("input[type=number]").vee.val(val);
					}
				}
			});
		}

		calculateCr();
	}

	function handleMonsterFeaturesChange (cbFeature, iptNum) {
		const curFeature = cbFeature.vee.attr("id");

		if (cbFeature.vee.prop("checked")) {
			Hist.setSubhash(curFeature, iptNum ? iptNum.vee.val() : true);
		} else {
			Hist.setSubhash(curFeature, null);
		}
	}

	// Monster Features table
	veEs(".crc__mon_feature_cb").vee.onChange((evt) => {
		const cbFeature = veE({ele: evt.target});
		const iptNum = veE({ele: evt.target}).vee.siblings("input[type=number]")[0];
		handleMonsterFeaturesChange(cbFeature, iptNum);
	});

	veEs(`.crc__mon_feature_num`).vee.onChange((evt) => {
		const iptNum = veE({ele: evt.target});
		const cbFeature = veE({ele: evt.target}).vee.siblings("input[type=checkbox]")[0];
		handleMonsterFeaturesChange(cbFeature, iptNum);
	});

	veEm("#monsterfeatures .crc__wrp_mon_features input").map(ele => ele.vee.onn("change", calculateCr));

	veEs("#crcalc_reset").vee.onClick(async () => {
		if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
		window.location = "";
		parseUrl();
	});

	parseUrl();
}

function calculateCr () {
	const expectedCr = parseInt(veEs("#expectedcr").vee.val());

	// Effective HP
	let hp = parseInt(veEs("#crcalc #hp").vee.val());

	// Used in e.g. "Damage Transfer"
	const hpActual = hp;

	if (veEs("#vulnerabilities").vee.prop("checked")) hp *= 0.5;
	if (veEs("#resistances").vee.val() === "res") {
		if (expectedCr >= 0 && expectedCr <= 4) hp *= 2;
		if (expectedCr >= 5 && expectedCr <= 10) hp *= 1.5;
		if (expectedCr >= 11 && expectedCr <= 16) hp *= 1.25;
	}
	if (veEs("#resistances").vee.val() === "imm") {
		if (expectedCr >= 0 && expectedCr <= 4) hp *= 2;
		if (expectedCr >= 5 && expectedCr <= 10) hp *= 2;
		if (expectedCr >= 11 && expectedCr <= 16) hp *= 1.5;
		if (expectedCr >= 17) hp *= 1.25;
	}

	let ac = parseInt(veEs("#crcalc #ac").vee.val()) + parseInt(veEs("#saveprofs").vee.val()) + (Number(veEs("#flying").vee.prop("checked"))) * 2;
	let dpr = parseInt(veEs("#crcalc #dpr").vee.val());

	let attackBonus = parseInt(veEs("#crcalc #attackbonus").vee.val());
	const useSaveDc = veEs("#saveinstead").vee.prop("checked");

	let offensiveCR = -1;
	let defensiveCR = -1;

	// go through monster features
	veEm("#monsterfeatures input:checked").map(ele => {
		// `trait` is used within the "eval"s below
		let trait = 0;
		if (veE({ele}).vee.siblings("input[type=number]").length) trait = veE({ele}).vee.siblings("input[type=number]")[0].vee.val();

		/* eslint-disable no-eval */
		if (veE({ele}).vee.attr("data-hp") !== "") hp += Number(eval(veE({ele}).vee.attr("data-hp")));
		if (veE({ele}).vee.attr("data-ac") !== "") ac += Number(eval(veE({ele}).vee.attr("data-ac")));
		if (veE({ele}).vee.attr("data-dpr") !== "") dpr += Number(eval(veE({ele}).vee.attr("data-dpr")));
		/* eslint-enable no-eval */
		if (!useSaveDc && veE({ele}).vee.attr("data-attackbonus") !== "") attackBonus += Number(veE({ele}).vee.attr("data-attackbonus"));
	});

	hp = Math.floor(hp);
	dpr = Math.floor(dpr);

	const effectiveHp = hp;
	const effectiveDpr = dpr;

	// make sure we don't break the CR
	if (hp > 850) hp = 850;
	if (dpr > 320) dpr = 320;

	for (let i = 0; i < msbcr.cr.length; i++) {
		const curCr = msbcr.cr[i];
		if (hp >= parseInt(curCr.hpMin) && hp <= parseInt(curCr.hpMax)) {
			let defenseDifference = parseInt(curCr.ac) - ac;
			if (defenseDifference > 0) defenseDifference = Math.floor(defenseDifference / 2);
			if (defenseDifference < 0) defenseDifference = Math.ceil(defenseDifference / 2);
			defenseDifference = i - defenseDifference;
			if (defenseDifference < 0) defenseDifference = 0;
			if (defenseDifference >= msbcr.cr.length) defenseDifference = msbcr.cr.length - 1;
			defensiveCR = msbcr.cr[defenseDifference]._cr;
		}
		if (dpr >= curCr.dprMin && dpr <= curCr.dprMax) {
			let adjuster = parseInt(curCr.attackBonus);
			if (useSaveDc) adjuster = parseInt(curCr.saveDc);
			let attackDifference = adjuster - attackBonus;
			if (attackDifference > 0) attackDifference = Math.floor(attackDifference / 2);
			if (attackDifference < 0) attackDifference = Math.ceil(attackDifference / 2);
			attackDifference = i - attackDifference;
			if (attackDifference < 0) attackDifference = 0;
			if (attackDifference >= msbcr.cr.length) attackDifference = msbcr.cr.length - 1;
			offensiveCR = msbcr.cr[attackDifference]._cr;
		}
	}

	if (offensiveCR === -1) offensiveCR = "0";
	if (defensiveCR === -1) defensiveCR = "0";
	let cr = ((fractionStrToDecimal(offensiveCR) + fractionStrToDecimal(defensiveCR)) / 2).toString();

	if (cr === "0.5625") cr = "1/2";
	if (cr === "0.5") cr = "1/2";
	if (cr === "0.375") cr = "1/4";
	if (cr === "0.3125") cr = "1/4";
	if (cr === "0.25") cr = "1/4";
	if (cr === "0.1875") cr = "1/8";
	if (cr === "0.125") cr = "1/8";
	if (cr === "0.0625") cr = "1/8";
	if (cr.indexOf(".") !== -1) cr = Math.round(cr).toString();

	let finalCr = 0;
	for (let i = 0; i < msbcr.cr.length; i++) {
		if (msbcr.cr[i]._cr === cr) {
			finalCr = i;
			break;
		}
	}

	const hitDice = calculateHd();
	const hitDiceSize = veEs("#hdval").vee.txt();
	const conMod = Parser.getAbilityModNumber(veEs("#con").vee.val());
	const hashParts = [
		veEs("#expectedcr").vee.val(), // 0
		veEs("#ac").vee.val(), // 1
		veEs("#dpr").vee.val(), // 2
		veEs("#attackbonus").vee.val(), // 3
		useSaveDc, // 4
		veEs("#size").vee.val(), // 5
		veEs("#hd").vee.val(), // 6
		veEs("#con").vee.val(), // 7
		veEs("#vulnerabilities").vee.prop("checked"), // 8
		veEs("#resistances").vee.val(), // 9
		veEs("#flying").vee.prop("checked"), // 10
		veEs("#saveprofs").vee.val(), // 11
		veEm(`.crc__mon_feature_cb`)
			.map(ele => {
				const cb = veE({ele});
				if (!cb.vee.prop("checked")) return false;

				const iptNum = cb.vee.siblings("input[type=number]")[0];
				return `${cb.vee.attr("id")}:${iptNum ? iptNum.vee.val() : true}`;
			})
			.filter(Boolean)
			.join(","),
	];
	window.location = `#${hashParts.join(",")}`;

	veEs("#croutput").vee.html(`
		<h4>Challenge Rating: ${cr}</h4>
		<p>Offensive CR: ${offensiveCR}</p>
		<p>Defensive CR: ${defensiveCR}</p>
		<p>Proficiency Bonus: +${msbcr.cr[finalCr].pb}</p>
		<p>Effective HP: ${effectiveHp} (${hitDice}${hitDiceSize}${conMod < 0 ? "" : "+"}${conMod * hitDice})</p>
		<p>Effective AC: ${ac}</p>
		<p>Average Damage Per Round: ${effectiveDpr}</p>
		<p>${useSaveDc ? "Save DC: " : "Effective Attack Bonus: +"}${attackBonus}</p>
		<p>Experience Points: ${Parser.crToXp(msbcr.cr[finalCr]._cr)}</p>
	`);
}

function calculateHd () {
	const avgHp = veEs("#hdval").vee.txt().split("d")[1] / 2 + 0.5;
	const conMod = Parser.getAbilityModNumber(veEs("#con").vee.val());
	let curHd = Math.round(parseInt(veEs("#hp").vee.val()) / (avgHp + conMod));
	if (!curHd) curHd = 1;
	return curHd;
}

function calculateHp () {
	const avgHp = veEs("#hdval").vee.txt().split("d")[1] / 2 + 0.5;
	const conMod = Parser.getAbilityModNumber(veEs("#con").vee.val());
	return Math.floor((avgHp + conMod) * veEs("#hd").vee.val());
}

function fractionStrToDecimal (str) {
	return str === "0" ? 0 : parseFloat(str.split("/").reduce((numerator, denominator) => numerator / denominator));
}
