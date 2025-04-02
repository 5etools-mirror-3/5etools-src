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
		es("#msbcr").appends(`<tr><td>${curCr._cr}</td><td>${Parser.crToXp(curCr._cr)}</td><td>${curCr.pb}</td><td>${curCr.ac}</td><td>${curCr.hpMin}-${curCr.hpMax}</td><td>${curCr.attackBonus}</td><td>${curCr.dprMin}-${curCr.dprMax}</td><td>${curCr.saveDc}</td></tr>`);
	}

	em("#crcalc input").map(ele => ele.onn("change", calculateCr));
	em("#saveprofs, #resistances").map(ele => ele.onn("change", calculateCr));

	es("#saveinstead").onChange((evt) => {
		const curVal = parseInt(es("#attackbonus").val());
		if (!e_({ele: evt.target}).prop(":checked")) es("#attackbonus").val(curVal - 10);
		if (e_({ele: evt.target}).prop(":checked")) es("#attackbonus").val(curVal + 10);
		calculateCr();
	});

	function changeSize (selSize) {
		const newSize = selSize.val();
		if (newSize === "Tiny") es("#hdval").txt("d4");
		if (newSize === "Small") es("#hdval").txt("d6");
		if (newSize === "Medium") es("#hdval").txt("d8");
		if (newSize === "Large") es("#hdval").txt("d10");
		if (newSize === "Huge") es("#hdval").txt("d12");
		if (newSize === "Gargantuan") es("#hdval").txt("d20");
		es("#hp").val(calculateHp());
	}

	es("select#size").onChange((evt) => {
		changeSize(e_({ele: evt.target}));
		calculateCr();
	});

	em("#hd, #con").map(ele => {
		ele.onChange(function () {
			es("#hp").val(calculateHp());
			calculateCr();
		});
	});

	// when clicking a row in the "Monster Statistics by Challenge Rating" table
	em("#msbcr tr:not(:has(th))").map(ele =>
		ele.onn("click", async function () {
			if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "This will reset the calculator. Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
			const [tdCr, , , tdAc, tdHp, tdAtk, tdDpr, tdSave] = this.children;

			es("#expectedcr").val(tdCr.innerHTML.trim());
			const [minHp, maxHp] = tdHp.innerHTML.trim().split("-").map(it => parseInt(it));
			es("#hp").val(minHp + (maxHp - minHp) / 2);
			es("#hd").val(calculateHd());
			es("#ac").val(tdAc.innerHTML);
			es("#dpr").val(tdDpr.innerHTML.split("-")[0]);
			es("#attackbonus").val(tdAtk.innerHTML);
			if (es("#saveinstead:checked")) es("#attackbonus").val(tdSave.innerHTML);
			calculateCr();
		}));

	es("#hp").onChange(function () {
		es("#hd").val(calculateHd());
		calculateCr();
	});

	// parse monsterfeatures
	const wrpMonFeatures = es(`#monsterfeatures .crc__wrp_mon_features`);
	monsterFeatures.forEach(f => {
		const effectOnCr = [];
		if (f.hp) effectOnCr.push(`HP: ${f.hp}`);
		if (f.ac) effectOnCr.push(`AC: ${f.ac}`);
		if (f.dpr) effectOnCr.push(`DPR: ${f.dpr}`);
		if (f.attackBonus) effectOnCr.push(`AB: ${f.attackBonus}`);

		const numBox = f.hasNumberParam ? `<input type="number" value="0" min="0" class="form-control form-control--minimal crc__mon_feature_num input-xs ml-2">` : "";

		wrpMonFeatures.appends(`
			<label class="row crc__mon_feature ui-tip__parent">
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
			es("#expectedcr").val(expectedCr);
			es("#ac").val(ac);
			es("#dpr").val(dpr);
			es("#attackbonus").val(attackBonus);
			if (isSaveInsteadRaw === "true") es("#saveinstead").prop("checked", true);
			changeSize(es("#size").val(size));
			es("#hd").val(hitDice);
			es("#con").val(conScore);
			es("#hp").val(calculateHp());
			if (isVulnerabilitiesRaw === "true") es("#vulnerabilities").prop("checked", true);
			es("#resistances").val(resImmune);
			if (isFlyingRaw === "true") es("#flying").prop("checked", true);
			es("#saveprofs").val(cntSaveProfs);

			em(`.crc__mon_feature_cb`).map(ele => {
				const cb = e_({ele});
				const idCb = cb.attr("id");
				const val = Hist.getSubHash(idCb);
				if (val) {
					cb.prop("checked", true);
					if (val !== "true") {
						cb.siblings("input[type=number]").val(val);
					}
				}
			});
		}

		calculateCr();
	}

	function handleMonsterFeaturesChange (cbFeature, iptNum) {
		const curFeature = cbFeature.attr("id");

		if (cbFeature.prop("checked")) {
			Hist.setSubhash(curFeature, iptNum ? iptNum.val() : true);
		} else {
			Hist.setSubhash(curFeature, null);
		}
	}

	// Monster Features table
	es(".crc__mon_feature_cb").onChange((evt) => {
		const cbFeature = e_({ele: evt.target});
		const iptNum = e_({ele: evt.target}).siblings("input[type=number]")[0];
		handleMonsterFeaturesChange(cbFeature, iptNum);
	});

	es(`.crc__mon_feature_num`).onChange((evt) => {
		const iptNum = e_({ele: evt.target});
		const cbFeature = e_({ele: evt.target}).siblings("input[type=checkbox]")[0];
		handleMonsterFeaturesChange(cbFeature, iptNum);
	});

	em("#monsterfeatures .crc__wrp_mon_features input").map(ele => ele.onn("change", calculateCr));

	es("#crcalc_reset").onClick(async () => {
		if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
		window.location = "";
		parseUrl();
	});

	parseUrl();
}

function calculateCr () {
	const expectedCr = parseInt(es("#expectedcr").val());

	// Effective HP
	let hp = parseInt(es("#crcalc #hp").val());

	// Used in e.g. "Damage Transfer"
	const hpActual = hp;

	if (es("#vulnerabilities").prop("checked")) hp *= 0.5;
	if (es("#resistances").val() === "res") {
		if (expectedCr >= 0 && expectedCr <= 4) hp *= 2;
		if (expectedCr >= 5 && expectedCr <= 10) hp *= 1.5;
		if (expectedCr >= 11 && expectedCr <= 16) hp *= 1.25;
	}
	if (es("#resistances").val() === "imm") {
		if (expectedCr >= 0 && expectedCr <= 4) hp *= 2;
		if (expectedCr >= 5 && expectedCr <= 10) hp *= 2;
		if (expectedCr >= 11 && expectedCr <= 16) hp *= 1.5;
		if (expectedCr >= 17) hp *= 1.25;
	}

	let ac = parseInt(es("#crcalc #ac").val()) + parseInt(es("#saveprofs").val()) + (Number(es("#flying").prop("checked"))) * 2;
	let dpr = parseInt(es("#crcalc #dpr").val());

	let attackBonus = parseInt(es("#crcalc #attackbonus").val());
	const useSaveDc = es("#saveinstead").prop("checked");

	let offensiveCR = -1;
	let defensiveCR = -1;

	// go through monster features
	em("#monsterfeatures input:checked").map(ele => {
		// `trait` is used within the "eval"s below
		let trait = 0;
		if (e_({ele}).siblings("input[type=number]").length) trait = e_({ele}).siblings("input[type=number]")[0].val();

		/* eslint-disable no-eval */
		if (e_({ele}).attr("data-hp") !== "") hp += Number(eval(e_({ele}).attr("data-hp")));
		if (e_({ele}).attr("data-ac") !== "") ac += Number(eval(e_({ele}).attr("data-ac")));
		if (e_({ele}).attr("data-dpr") !== "") dpr += Number(eval(e_({ele}).attr("data-dpr")));
		/* eslint-enable no-eval */
		if (!useSaveDc && e_({ele}).attr("data-attackbonus") !== "") attackBonus += Number(e_({ele}).attr("data-attackbonus"));
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
	const hitDiceSize = es("#hdval").txt();
	const conMod = Parser.getAbilityModNumber(es("#con").val());
	const hashParts = [
		es("#expectedcr").val(), // 0
		es("#ac").val(), // 1
		es("#dpr").val(), // 2
		es("#attackbonus").val(), // 3
		useSaveDc, // 4
		es("#size").val(), // 5
		es("#hd").val(), // 6
		es("#con").val(), // 7
		es("#vulnerabilities").prop("checked"), // 8
		es("#resistances").val(), // 9
		es("#flying").prop("checked"), // 10
		es("#saveprofs").val(), // 11
		em(`.crc__mon_feature_cb`)
			.map(ele => {
				const cb = e_({ele});
				if (!cb.prop("checked")) return false;

				const iptNum = cb.siblings("input[type=number]")[0];
				return `${cb.attr("id")}:${iptNum ? iptNum.val() : true}`;
			})
			.filter(Boolean)
			.join(","),
	];
	window.location = `#${hashParts.join(",")}`;

	es("#croutput").html(`
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
	const avgHp = es("#hdval").txt().split("d")[1] / 2 + 0.5;
	const conMod = Parser.getAbilityModNumber(es("#con").val());
	let curHd = Math.round(parseInt(es("#hp").val()) / (avgHp + conMod));
	if (!curHd) curHd = 1;
	return curHd;
}

function calculateHp () {
	const avgHp = es("#hdval").txt().split("d")[1] / 2 + 0.5;
	const conMod = Parser.getAbilityModNumber(es("#con").val());
	return Math.floor((avgHp + conMod) * es("#hd").val());
}

function fractionStrToDecimal (str) {
	return str === "0" ? 0 : parseFloat(str.split("/").reduce((numerator, denominator) => numerator / denominator));
}
