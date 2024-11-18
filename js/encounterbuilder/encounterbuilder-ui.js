import {EncounterBuilderRandomizer} from "./encounterbuilder-randomizer.js";
import {EncounterBuilderCreatureMeta, EncounterBuilderXpInfo, EncounterPartyMeta, EncounterPartyPlayerMeta} from "./encounterbuilder-models.js";
import {EncounterBuilderUiTtk} from "./encounterbuilder-ui-ttk.js";
import {EncounterBuilderUiHelp} from "./encounterbuilder-ui-help.js";
import {EncounterBuilderRenderableCollectionPlayersSimple} from "./encounterbuilder-playerssimple.js";
import {EncounterBuilderRenderableCollectionColsExtraAdvanced} from "./encounterbuilder-colsextraadvanced.js";
import {EncounterBuilderRenderableCollectionPlayersAdvanced} from "./encounterbuilder-playersadvanced.js";
import {EncounterBuilderAdjuster} from "./encounterbuilder-adjuster.js";

/**
 * TODO rework this to use doubled multipliers for XP, so we avoid the 0.5x issue for 6+ party sizes. Then scale
 *   everything back down at the end.
 */
export class EncounterBuilderUi extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.$wrpRowsSimple = null;
			this.$wrpRowsAdvanced = null;
			this.$wrpHeadersAdvanced = null;
			this.$wrpFootersAdvanced = null;

			this.infoHoverId = null;

			this._collectionPlayersSimple = null;
			this._collectionColsExtraAdvanced = null;
			this._collectionPlayersAdvanced = null;
		}
	};

	/* -------------------------------------------- */

	_cache = null;
	_comp = null;

	constructor ({cache, comp}) {
		super();

		this._cache = cache;
		this._comp = comp;
	}

	/**
	 * @param {?jQuery} $parentRandomAndAdjust
	 * @param {?jQuery} $parentViewer
	 * @param {?jQuery} $parentGroupAndDifficulty
	 */
	render (
		{
			$parentRandomAndAdjust = null,
			$parentViewer = null,
			$parentGroupAndDifficulty = null,
		},
	) {
		const rdState = new this.constructor._RenderState();

		this._render_randomAndAdjust({rdState, $parentRandomAndAdjust});
		this._render_viewer({rdState, $parentViewer});
		this._render_groupAndDifficulty({rdState, $parentGroupAndDifficulty});
		this._render_addHooks({rdState});
	}

	/* -------------------------------------------- */

	_render_randomAndAdjust ({$parentRandomAndAdjust}) {
		const {
			$btnRandom,
			$btnRandomMode,
			$liRandomEasy,
			$liRandomMedium,
			$liRandomHard,
			$liRandomDeadly,
		} = this._render_randomAndAdjust_getRandomMeta();

		const {
			$btnAdjust,
			$btnAdjustMode,
			$liAdjustEasy,
			$liAdjustMedium,
			$liAdjustHard,
			$liAdjustDeadly,
		} = this._render_randomAndAdjust_getAdjustMeta();

		$$($parentRandomAndAdjust)`<div class="ve-flex-col">
			<div class="ve-flex-h-right mb-3">${Renderer.get().render(`{@note Based on the encounter building rules in the {@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}|DMG|3|Creating a Combat Encounter}}`)}</div>

			<div class="ve-flex-h-right">
				<div class="ve-btn-group mr-3">
					${$btnRandom}
					${$btnRandomMode}
					<ul class="ve-dropdown-menu">
						${$liRandomEasy}
						${$liRandomMedium}
						${$liRandomHard}
						${$liRandomDeadly}
					</ul>
				</div>

				<div class="ve-btn-group">
					${$btnAdjust}
					${$btnAdjustMode}
					<ul class="ve-dropdown-menu">
						${$liAdjustEasy}
						${$liAdjustMedium}
						${$liAdjustHard}
						${$liAdjustDeadly}
					</ul>
				</div>
			</div>
		</div>`;
	}

	_render_randomAndAdjust_getRandomMeta () {
		let modeRandom = "medium";

		const pSetRandomMode = async (mode) => {
			const randomizer = new EncounterBuilderRandomizer({
				partyMeta: this._getPartyMeta(),
				cache: this._cache,
			});
			const randomCreatureMetas = await randomizer.pGetRandomEncounter({
				difficulty: mode,
				lockedEncounterCreatures: this._comp.creatureMetas.filter(creatureMeta => creatureMeta.isLocked),
			});

			if (randomCreatureMetas != null) this._comp.creatureMetas = randomCreatureMetas;

			modeRandom = mode;
			$btnRandom
				.text(`Random ${mode.toTitleCase()}`)
				.title(`Randomly generate ${Parser.getArticle(mode)} ${mode.toTitleCase()} encounter`);
		};

		const $getLiRandom = (mode) => {
			return $(`<li title="Randomly generate ${Parser.getArticle(mode)} ${mode.toTitleCase()} encounter"><a href="#">Random ${mode.toTitleCase()}</a></li>`)
				.click(async (evt) => {
					evt.preventDefault();
					await pSetRandomMode(mode);
				});
		};

		const $btnRandom = $(`<button class="ve-btn ve-btn-primary ecgen__btn-random-adjust" title="Randomly generate a Medium encounter">Random Medium</button>`)
			.click(async evt => {
				evt.preventDefault();
				await pSetRandomMode(modeRandom);
			});

		const $btnRandomMode = $(`<button class="ve-btn ve-btn-primary ve-dropdown-toggle"><span class="caret"></span></button>`);
		JqueryUtil.bindDropdownButton($btnRandomMode);

		return {
			$btnRandom,
			$btnRandomMode,
			$liRandomEasy: $getLiRandom("easy"),
			$liRandomMedium: $getLiRandom("medium"),
			$liRandomHard: $getLiRandom("hard"),
			$liRandomDeadly: $getLiRandom("deadly"),
		};
	}

	_render_randomAndAdjust_getAdjustMeta () {
		let modeAdjust = "medium";

		const pSetAdjustMode = async (mode) => {
			const adjuster = new EncounterBuilderAdjuster({
				partyMeta: this._getPartyMeta(),
			});
			const adjustedCreatureMetas = await adjuster.pGetAdjustedEncounter({
				difficulty: mode,
				creatureMetas: this._comp.creatureMetas,
			});

			if (adjustedCreatureMetas != null) this._comp.creatureMetas = adjustedCreatureMetas;

			modeAdjust = mode;
			$btnAdjust
				.text(`Adjust to ${mode.toTitleCase()}`)
				.title(`Adjust the current encounter difficulty to ${mode.toTitleCase()}`);
		};

		const $getLiAdjust = (mode) => {
			return $(`<li title="Adjust the current encounter difficulty to ${mode.toTitleCase()}"><a href="#">Adjust to ${mode.toTitleCase()}</a></li>`)
				.click(async (evt) => {
					evt.preventDefault();
					await pSetAdjustMode(mode);
				});
		};

		const $btnAdjust = $(`<button class="ve-btn ve-btn-primary ecgen__btn-random-adjust" title="Adjust the current encounter difficulty to Medium">Adjust to Medium</button>`)
			.click(async evt => {
				evt.preventDefault();
				await pSetAdjustMode(modeAdjust);
			});

		const $btnAdjustMode = $(`<button class="ve-btn ve-btn-primary ve-dropdown-toggle"><span class="caret"></span></button>`);
		JqueryUtil.bindDropdownButton($btnAdjustMode);

		return {
			$btnAdjust,
			$btnAdjustMode,
			$liAdjustEasy: $getLiAdjust("easy"),
			$liAdjustMedium: $getLiAdjust("medium"),
			$liAdjustHard: $getLiAdjust("hard"),
			$liAdjustDeadly: $getLiAdjust("deadly"),
		};
	}

	/* -------------------------------------------- */

	_render_viewer ({$parentViewer}) {
		if (!$parentViewer) return;

		const $wrpOutput = $(`<div class="py-2 mt-5" style="background: #333"></div>`);

		$$($parentViewer)`${$wrpOutput}`;

		this._comp.addHookCreatureMetas(() => {
			const $lis = this._comp.creatureMetas
				.map(creatureMeta => {
					const $btnShuffle = $(`<button class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-random"></span></button>`)
						.click(() => {
							this._doShuffle({creatureMeta});
						});

					return $$`<li>${$btnShuffle} <span>${Renderer.get().render(`${creatureMeta.count}× {@creature ${creatureMeta.creature.name}|${creatureMeta.creature.source}}`)}</span></li>`;
				});

			$$($wrpOutput.empty())`<ul>
				${$lis}
			</ul>`;
		})();
	}

	/* -------------------------------------------- */

	_render_groupAndDifficulty ({rdState, $parentGroupAndDifficulty}) {
		const {
			$stg: $stgSimple,
			$wrpRows: $wrpRowsSimple,
		} = this._renderGroupAndDifficulty_getGroupEles_simple();
		rdState.$wrpRowsSimple = $wrpRowsSimple;

		const {
			$stg: $stgAdvanced,
			$wrpRows: $wrpRowsAdvanced,
			$wrpHeaders: $wrpHeadersAdvanced,
			$wrpFooters: $wrpFootersAdvanced,
		} = this._renderGroupAndDifficulty_getGroupEles_advanced();
		rdState.$wrpRowsAdvanced = $wrpRowsAdvanced;
		rdState.$wrpHeadersAdvanced = $wrpHeadersAdvanced;
		rdState.$wrpFootersAdvanced = $wrpFootersAdvanced;

		const $hrHasCreatures = $(`<hr class="hr-1">`);
		const $wrpDifficulty = $$`<div class="ve-flex">
			${this._renderGroupAndDifficulty_$getDifficultyLhs()}
			${this._renderGroupAndDifficulty_$getDifficultyRhs({rdState})}
		</div>`;

		this._addHookBase("derivedGroupAndDifficulty", () => {
			const {
				encounterXpInfo = EncounterBuilderXpInfo.getDefault(),
			} = this._state.derivedGroupAndDifficulty;
			$hrHasCreatures.toggleVe(encounterXpInfo.relevantCount);
			$wrpDifficulty.toggleVe(encounterXpInfo.relevantCount);
		})();

		$$($parentGroupAndDifficulty)`
		<h3 class="mt-1 m-2">Group Info</h3>
		<div class="ve-flex">
			${$stgSimple}
			${$stgAdvanced}
			${this._renderGroupAndDifficulty_$getGroupInfoRhs()}
		</div>

		${$hrHasCreatures}
		${$wrpDifficulty}`;

		rdState.collectionPlayersSimple = new EncounterBuilderRenderableCollectionPlayersSimple({
			comp: this._comp,
			rdState,
		});

		rdState.collectionColsExtraAdvanced = new EncounterBuilderRenderableCollectionColsExtraAdvanced({
			comp: this._comp,
			rdState,
		});

		rdState.collectionPlayersAdvanced = new EncounterBuilderRenderableCollectionPlayersAdvanced({
			comp: this._comp,
			rdState,
		});
	}

	_renderGroupAndDifficulty_getGroupEles_simple () {
		const $btnAddPlayers = $(`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Another Level</button>`)
			.click(() => this._comp.doAddPlayer());

		const $wrpRows = $(`<div class="ve-flex-col w-100"></div>`);

		const $stg = $$`<div class="w-70 ve-flex-col">
			<div class="ve-flex">
				<div class="w-20">Players:</div>
				<div class="w-20">Level:</div>
			</div>

			${$wrpRows}

			<div class="mb-1 ve-flex">
				<div class="ecgen__wrp_add_players_btn_wrp">
					${$btnAddPlayers}
				</div>
			</div>

			${this._renderGroupAndDifficulty_$getPtAdvancedMode()}

		</div>`;

		this._comp.addHookIsAdvanced(() => {
			$stg.toggleVe(!this._comp.isAdvanced);
		})();

		return {
			$wrpRows,
			$stg,
		};
	}

	_renderGroupAndDifficulty_getGroupEles_advanced () {
		const $btnAddPlayers = $(`<button class="ve-btn ve-btn-primary ve-btn-xs"><span class="glyphicon glyphicon-plus"></span> Add Another Player</button>`)
			.click(() => this._comp.doAddPlayer());

		const $btnAddAdvancedCol = $(`<button class="ve-btn ve-btn-primary ve-btn-xxs ecgen-player__btn-inline h-ipt-xs bl-0 bb-0 bbl-0 bbr-0 btl-0 ml-n1" title="Add Column" tabindex="-1"><span class="glyphicon glyphicon-list-alt"></span></button>`)
			.click(() => this._comp.doAddColExtraAdvanced());

		const $wrpHeaders = $(`<div class="ve-flex"></div>`);
		const $wrpFooters = $(`<div class="ve-flex"></div>`);

		const $wrpRows = $(`<div class="ve-flex-col"></div>`);

		const $stg = $$`<div class="w-70 ve-overflow-x-auto ve-flex-col">
			<div class="ve-flex-h-center mb-2 bb-1p small-caps ve-self-flex-start">
				<div class="w-100p mr-1 h-ipt-xs no-shrink">Name</div>
				<div class="w-40p ve-text-center mr-1 h-ipt-xs no-shrink">Level</div>
				${$wrpHeaders}
				${$btnAddAdvancedCol}
			</div>

			${$wrpRows}

			<div class="mb-1 ve-flex">
				<div class="ecgen__wrp_add_players_btn_wrp no-shrink no-grow">
					${$btnAddPlayers}
				</div>
				${$wrpFooters}
			</div>

			${this._renderGroupAndDifficulty_$getPtAdvancedMode()}

			<div class="row">
				<div class="w-100">
					${Renderer.get().render(`{@note Additional columns will be imported into the DM Screen.}`)}
				</div>
			</div>
		</div>`;

		this._comp.addHookIsAdvanced(() => {
			$stg.toggleVe(this._comp.isAdvanced);
		})();

		return {
			$stg,
			$wrpRows,
			$wrpHeaders,
			$wrpFooters,
		};
	}

	_renderGroupAndDifficulty_$getPtAdvancedMode () {
		const $cbAdvanced = ComponentUiUtil.$getCbBool(this._comp, "isAdvanced");

		return $$`<div class="ve-flex-v-center">
			<label class="ve-flex-v-center">
				<div class="mr-2">Advanced Mode</div>
				${$cbAdvanced}
			</label>
		</div>`;
	}

	static _TITLE_DIFFICULTIES = {
		easy: "An easy encounter doesn't tax the characters' resources or put them in serious peril. They might lose a few hit points, but victory is pretty much guaranteed.",
		medium: "A medium encounter usually has one or two scary moments for the players, but the characters should emerge victorious with no casualties. One or more of them might need to use healing resources.",
		hard: "A hard encounter could go badly for the adventurers. Weaker characters might get taken out of the fight, and there's a slim chance that one or more characters might die.",
		deadly: "A deadly encounter could be lethal for one or more player characters. Survival often requires good tactics and quick thinking, and the party risks defeat",
		absurd: "An &quot;absurd&quot; encounter is a deadly encounter as per the rules, but is differentiated here to provide an additional tool for judging just how deadly a &quot;deadly&quot; encounter will be. It is calculated as: &quot;deadly + (deadly - hard)&quot;.",
	};
	static _TITLE_BUDGET_DAILY = "This provides a rough estimate of the adjusted XP value for encounters the party can handle before the characters will need to take a long rest.";
	static _TITLE_XP_TO_NEXT_LEVEL = "The total XP required to allow each member of the party to level up to their next level.";
	static _TITLE_TTK = "Time to Kill: The estimated number of turns the party will require to defeat the encounter. This assumes single-target damage only.";

	static _getDifficultyKey ({partyMeta, encounterXpInfo}) {
		if (encounterXpInfo.adjustedXp >= partyMeta.easy && encounterXpInfo.adjustedXp < partyMeta.medium) return "easy";
		if (encounterXpInfo.adjustedXp >= partyMeta.medium && encounterXpInfo.adjustedXp < partyMeta.hard) return "medium";
		if (encounterXpInfo.adjustedXp >= partyMeta.hard && encounterXpInfo.adjustedXp < partyMeta.deadly) return "hard";
		if (encounterXpInfo.adjustedXp >= partyMeta.deadly && encounterXpInfo.adjustedXp < partyMeta.absurd) return "deadly";
		if (encounterXpInfo.adjustedXp >= partyMeta.absurd) return "absurd";
		return "trivial";
	}

	static _getDifficultyHtml ({partyMeta, difficulty}) {
		return `<span class="help-subtle" title="${this._TITLE_DIFFICULTIES[difficulty]}">${difficulty.toTitleCase()}:</span> ${partyMeta[difficulty].toLocaleString()} XP`;
	}

	_renderGroupAndDifficulty_$getGroupInfoRhs () {
		const $dispXpEasy = $(`<div></div>`);
		const $dispXpMedium = $(`<div></div>`);
		const $dispXpHard = $(`<div></div>`);
		const $dispXpDeadly = $(`<div></div>`);
		const $dispXpAbsurd = $(`<div></div>`);

		const $dispsXpDifficulty = {
			"easy": $dispXpEasy,
			"medium": $dispXpMedium,
			"hard": $dispXpHard,
			"deadly": $dispXpDeadly,
			"absurd": $dispXpAbsurd,
		};

		const $dispTtk = $(`<div></div>`);

		const $dispBudgetDaily = $(`<div></div>`);
		const $dispExpToLevel = $(`<div class="ve-muted"></div>`);

		this._addHookBase("derivedGroupAndDifficulty", () => {
			const {
				partyMeta = EncounterPartyMeta.getDefault(),
				encounterXpInfo = EncounterBuilderXpInfo.getDefault(),
			} = this._state.derivedGroupAndDifficulty;

			const difficulty = this.constructor._getDifficultyKey({partyMeta, encounterXpInfo});

			Object.entries($dispsXpDifficulty)
				.forEach(([difficulty_, $disp]) => {
					$disp
						.toggleClass("bold", difficulty === difficulty_)
						.html(this.constructor._getDifficultyHtml({partyMeta, difficulty: difficulty_}));
				});

			$dispTtk
				.html(`<span class="help" title="${this.constructor._TITLE_TTK}">TTK:</span> ${EncounterBuilderUiTtk.getApproxTurnsToKill({partyMeta, creatureMetas: this._comp.creatureMetas}).toFixed(2)}`);

			$dispBudgetDaily
				.html(`<span class="help-subtle" title="${this.constructor._TITLE_BUDGET_DAILY}">Daily Budget:</span> ${partyMeta.dailyBudget.toLocaleString()} XP`);

			$dispExpToLevel
				.html(`<span class="help-subtle" title="${this.constructor._TITLE_XP_TO_NEXT_LEVEL}">XP to Next Level:</span> ${partyMeta.xpToNextLevel.toLocaleString()} XP`);
		})();

		return $$`<div class="w-30 ve-text-right">
			${$dispXpEasy}
			${$dispXpMedium}
			${$dispXpHard}
			${$dispXpDeadly}
			${$dispXpAbsurd}
			<br>
			${$dispTtk}
			<br>
			${$dispBudgetDaily}
			${$dispExpToLevel}
		</div>`;
	}

	_renderGroupAndDifficulty_$getDifficultyLhs () {
		const $dispDifficulty = $(`<h3 class="mt-2"></h3>`);

		this._addHookBase("derivedGroupAndDifficulty", () => {
			const {
				partyMeta = EncounterPartyMeta.getDefault(),
				encounterXpInfo = EncounterBuilderXpInfo.getDefault(),
			} = this._state.derivedGroupAndDifficulty;

			const difficulty = this.constructor._getDifficultyKey({partyMeta, encounterXpInfo});

			$dispDifficulty.text(`Difficulty: ${difficulty.toTitleCase()}`);
		})();

		return $$`<div class="w-50">
			${$dispDifficulty}
		</div>`;
	}

	_renderGroupAndDifficulty_$getDifficultyRhs ({rdState}) {
		const $dispXpRawTotal = $(`<h4></h4>`);
		const $dispXpRawPerPlayer = $(`<i></i>`);

		const $hovXpAdjustedInfo = $(`<span class="glyphicon glyphicon-info-sign mr-2"></span>`);

		const $dispXpAdjustedTotal = $(`<h4 class="ve-flex-v-center"></h4>`);
		const $dispXpAdjustedPerPlayer = $(`<i></i>`);

		this._addHookBase("derivedGroupAndDifficulty", () => {
			const {
				partyMeta = EncounterPartyMeta.getDefault(),
				encounterXpInfo = EncounterBuilderXpInfo.getDefault(),
			} = this._state.derivedGroupAndDifficulty;

			$dispXpRawTotal.text(`Total XP: ${encounterXpInfo.baseXp.toLocaleString()}`);
			$dispXpRawPerPlayer.text(`(${Math.floor(encounterXpInfo.baseXp / partyMeta.cntPlayers).toLocaleString()} per player)`);

			const infoEntry = EncounterBuilderUiHelp.getHelpEntry({partyMeta, encounterXpInfo});

			if (rdState.infoHoverId == null) {
				const hoverMeta = Renderer.hover.getMakePredefinedHover(infoEntry, {isBookContent: true});
				rdState.infoHoverId = hoverMeta.id;

				$hovXpAdjustedInfo
					.off("mouseover")
					.off("mousemove")
					.off("mouseleave")
					.on("mouseover", function (event) { hoverMeta.mouseOver(event, this); })
					.on("mousemove", function (event) { hoverMeta.mouseMove(event, this); })
					.on("mouseleave", function (event) { hoverMeta.mouseLeave(event, this); });
			} else {
				Renderer.hover.updatePredefinedHover(rdState.infoHoverId, infoEntry);
			}

			$dispXpAdjustedTotal.html(`Adjusted XP <span class="ve-small ve-muted ml-2" title="XP Multiplier">(×${encounterXpInfo.playerAdjustedXpMult})</span>: <b class="ml-2">${encounterXpInfo.adjustedXp.toLocaleString()}</b>`);
			$dispXpAdjustedPerPlayer.text(`(${Math.floor(encounterXpInfo.adjustedXp / partyMeta.cntPlayers).toLocaleString()} per player)`);
		})();

		return $$`<div class="w-50 ve-text-right">
			${$dispXpRawTotal}
			<div>${$dispXpRawPerPlayer}</div>
			<div class="ve-flex-v-center ve-flex-h-right">${$hovXpAdjustedInfo}${$dispXpAdjustedTotal}</div>
			<div>${$dispXpAdjustedPerPlayer}</div>
		</div>`;
	}

	/* -------------------------------------------- */

	_render_addHooks ({rdState}) {
		this._comp.addHookPlayersSimple((valNotFirstRun) => {
			rdState.collectionPlayersSimple.render();

			if (valNotFirstRun == null) return;
			this._render_hk_setDerivedGroupAndDifficulty();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookPlayersAdvanced((valNotFirstRun) => {
			rdState.collectionPlayersAdvanced.render();

			if (valNotFirstRun == null) return;
			this._render_hk_setDerivedGroupAndDifficulty();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookIsAdvanced((valNotFirstRun) => {
			if (valNotFirstRun == null) return;
			this._render_hk_setDerivedGroupAndDifficulty();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookCreatureMetas(() => {
			this._render_hk_setDerivedGroupAndDifficulty();
			this._render_hk_doUpdateExternalStates();
		})();

		this._comp.addHookColsExtraAdvanced(() => {
			rdState.collectionColsExtraAdvanced.render();
			this._render_hk_doUpdateExternalStates();
		})();
	}

	_render_hk_setDerivedGroupAndDifficulty () {
		const partyMeta = this._getPartyMeta();
		const encounterXpInfo = EncounterBuilderCreatureMeta.getEncounterXpInfo(this._comp.creatureMetas, this._getPartyMeta());

		this._state.derivedGroupAndDifficulty = {
			partyMeta,
			encounterXpInfo,
		};
	}

	_render_hk_doUpdateExternalStates () {
		/* Implement as required */
	}

	/* -------------------------------------------- */

	_doShuffle ({creatureMeta}) {
		if (creatureMeta.isLocked) return;

		const ix = this._comp.creatureMetas.findIndex(creatureMeta_ => creatureMeta_.isSameCreature(creatureMeta));
		if (!~ix) throw new Error(`Could not find creature ${creatureMeta.getHash()} (${creatureMeta.customHashId})`);

		const creatureMeta_ = this._comp.creatureMetas[ix];
		if (creatureMeta_.isLocked) return;

		const lockedHashes = new Set(
			this._comp.creatureMetas
				.filter(creatureMeta => creatureMeta.isLocked)
				.map(creatureMeta => creatureMeta.getHash()),
		);

		const monRolled = this._doShuffle_getShuffled({creatureMeta: creatureMeta_, lockedHashes});
		if (!monRolled) return JqueryUtil.doToast({content: "Could not find another creature worth the same amount of XP!", type: "warning"});

		const creatureMetaNxt = new EncounterBuilderCreatureMeta({
			creature: monRolled,
			count: creatureMeta_.count,
		});

		const creatureMetasNxt = [...this._comp.creatureMetas];
		const withMonRolled = creatureMetasNxt.find(creatureMeta_ => creatureMeta_.hasCreature(monRolled));
		if (withMonRolled) {
			withMonRolled.count += creatureMetaNxt.count;
			creatureMetasNxt.splice(ix, 1);
		} else {
			creatureMetasNxt[ix] = creatureMetaNxt;
		}

		this._comp.creatureMetas = creatureMetasNxt;
	}

	_doShuffle_getShuffled ({creatureMeta, lockedHashes}) {
		const xp = creatureMeta.getXp();
		const hash = creatureMeta.getHash();

		const availMons = this._cache.getCreaturesByXp(xp)
			.filter(mon => {
				const hash_ = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
				return !lockedHashes.has(hash) && hash_ !== hash;
			});
		if (!availMons.length) return null;

		return RollerUtil.rollOnArray(availMons);
	}

	/* -------------------------------------------- */

	_getPartyMeta () {
		return this._comp.getPartyMeta();
	}

	_getDefaultState () {
		return {
			derivedGroupAndDifficulty: {},
		};
	}
}
