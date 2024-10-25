import {StatGenUtilAdditionalFeats} from "./statgen-util-additionalfeats.js";
import {MAX_CUSTOM_FEATS} from "./statgen-ui-consts.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__CLASSIC} from "../consts.js";

export class StatGenUiCompAsi extends BaseComponent {
	constructor ({parent}) {
		super();
		this._parent = parent;

		this._metasAsi = {ability: [], race: [], background: [], custom: []};

		this._doPulseThrottled = MiscUtil.throttle(this._doPulse_.bind(this), 50);
	}

	/**
	 * Add this to UI interactions rather than state hooks, as there is a copy of this component per tab.
	 */
	_doPulse_ () { this._parent.state.common_pulseAsi = !this._parent.state.common_pulseAsi; }

	_render_renderAsiFeatSection (propCnt, namespace, $wrpRows) {
		const hk = () => {
			let ix = 0;

			for (; ix < this._parent.state[propCnt]; ++ix) {
				const ix_ = ix;
				const {propMode, propIxFeat, propIxAsiPointOne, propIxAsiPointTwo, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAsi(ix_, namespace);

				if (!this._metasAsi[namespace][ix_]) {
					this._parent.state[propMode] = this._parent.state[propMode] || (namespace === "ability" ? "asi" : "feat");

					const $btnAsi = namespace !== "ability" ? null : $(`<button class="ve-btn ve-btn-xs ve-btn-default w-50p">ASI</button>`)
						.click(() => {
							this._parent.state[propMode] = "asi";
							this._doPulseThrottled();
						});

					const $btnFeat = namespace !== "ability" ? $(`<div class="w-100p ve-text-center">Feat</div>`) : $(`<button class="ve-btn ve-btn-xs ve-btn-default w-50p">Feat</button>`)
						.click(() => {
							this._parent.state[propMode] = "feat";
							this._doPulseThrottled();
						});

					// region ASI
					let $stgAsi;
					if (namespace === "ability") {
						const $colsAsi = Parser.ABIL_ABVS.map((it, ixAsi) => {
							const updateDisplay = () => $ipt.val(Number(this._parent.state[propIxAsiPointOne] === ixAsi) + Number(this._parent.state[propIxAsiPointTwo] === ixAsi));

							const $ipt = $(`<input class="form-control form-control--minimal ve-text-right input-xs statgen-shared__ipt" type="number" style="width: 42px;">`)
								.disableSpellcheck()
								.keydown(evt => { if (evt.key === "Escape") $ipt.blur(); })
								.change(() => {
									const raw = $ipt.val().trim();
									const asNum = Number(raw);

									const activeProps = [propIxAsiPointOne, propIxAsiPointTwo].filter(prop => this._parent.state[prop] === ixAsi);

									if (isNaN(asNum) || asNum <= 0) {
										this._parent.proxyAssignSimple(
											"state",
											{
												...activeProps.mergeMap(prop => ({[prop]: null})),
											},
										);
										updateDisplay();
										return this._doPulseThrottled();
									}

									if (asNum >= 2) {
										this._parent.proxyAssignSimple(
											"state",
											{
												[propIxAsiPointOne]: ixAsi,
												[propIxAsiPointTwo]: ixAsi,
											},
										);
										updateDisplay();
										return this._doPulseThrottled();
									}

									if (activeProps.length === 2) {
										this._parent.state[propIxAsiPointTwo] = null;
										updateDisplay();
										return this._doPulseThrottled();
									}

									if (this._parent.state[propIxAsiPointOne] == null) {
										this._parent.state[propIxAsiPointOne] = ixAsi;
										updateDisplay();
										return this._doPulseThrottled();
									}

									this._parent.state[propIxAsiPointTwo] = ixAsi;
									updateDisplay();
									this._doPulseThrottled();
								});

							const hkSelected = () => updateDisplay();
							this._parent.addHookBase(propIxAsiPointOne, hkSelected);
							this._parent.addHookBase(propIxAsiPointTwo, hkSelected);
							hkSelected();

							return $$`<div class="ve-flex-col h-100 mr-2">
								<div class="statgen-asi__cell ve-text-center pb-1" title="${Parser.attAbvToFull(it)}">${it.toUpperCase()}</div>
								<div class="ve-flex-vh-center statgen-asi__cell relative">
									<div class="absolute no-events statgen-asi__disp-plus">+</div>
									${$ipt}
								</div>
							</div>`;
						});

						$stgAsi = $$`<div class="ve-flex-v-center">
							${$colsAsi}
						</div>`;
					}
					// endregion

					// region Feat
					const {$stgFeat, $btnChooseFeat, hkIxFeat} = this._render_getMetaFeat({propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom});
					// endregion

					const hkMode = () => {
						if (namespace === "ability") {
							$btnAsi.toggleClass("active", this._parent.state[propMode] === "asi");
							$btnFeat.toggleClass("active", this._parent.state[propMode] === "feat");
						}

						$btnChooseFeat.toggleVe(this._parent.state[propMode] === "feat");

						if (namespace === "ability") $stgAsi.toggleVe(this._parent.state[propMode] === "asi");
						$stgFeat.toggleVe(this._parent.state[propMode] === "feat");

						hkIxFeat();
					};
					this._parent.addHookBase(propMode, hkMode);
					hkMode();

					const $row = $$`<div class="ve-flex-v-end py-3 px-1">
						<div class="ve-btn-group">${$btnAsi}${$btnFeat}</div>
						<div class="vr-4"></div>
						${$stgAsi}
						${$stgFeat}
					</div>`.appendTo($wrpRows);

					this._metasAsi[namespace][ix_] = {
						$row,
					};
				}

				this._metasAsi[namespace][ix_].$row.showVe().addClass("statgen-asi__row");
			}

			// Remove border styling from the last visible row
			if (this._metasAsi[namespace][ix - 1]) this._metasAsi[namespace][ix - 1].$row.removeClass("statgen-asi__row");

			for (; ix < this._metasAsi[namespace].length; ++ix) {
				if (!this._metasAsi[namespace][ix]) continue;
				this._metasAsi[namespace][ix].$row.hideVe().removeClass("statgen-asi__row");
			}
		};
		this._parent.addHookBase(propCnt, hk);
		hk();
	}

	_render_renderAdditionalFeatSection ({namespace, $wrpRows, propEntity}) {
		const fnsCleanupEnt = [];
		const fnsCleanupGroup = [];

		const {propIxSel, propPrefix} = this._parent.getPropsAdditionalFeats_(namespace);

		const resetGroupState = () => {
			const nxtState = Object.keys(this._parent.state)
				.filter(k => k.startsWith(propPrefix) && k !== propIxSel)
				.mergeMap(k => ({[k]: null}));
			this._parent.proxyAssignSimple("state", nxtState);
		};

		const hkEnt = (isNotFirstRun) => {
			fnsCleanupEnt.splice(0, fnsCleanupEnt.length).forEach(fn => fn());
			fnsCleanupGroup.splice(0, fnsCleanupGroup.length).forEach(fn => fn());
			$wrpRows.empty();

			if (isNotFirstRun) resetGroupState();

			const ent = this._parent[namespace]; // e.g. `this._parent.race`

			if ((ent?.feats?.length || 0) > 1) {
				const {$sel: $selGroup, unhook: unhookIxGroup} = StatGenUtilAdditionalFeats.getSelIxSetMeta({comp: this._parent, prop: propIxSel, available: ent.feats});
				fnsCleanupEnt.push(unhookIxGroup);
				$$`<div class="ve-flex-col mb-2">
					<div class="ve-flex-v-center mb-2">
						<div class="mr-2">Feat Set:</div>
						${$selGroup.addClass("max-w-200p")}
					</div>
				</div>`.appendTo($wrpRows);
			} else {
				this._parent.state[propIxSel] = 0;
			}

			const $wrpRowsInner = $(`<div class="w-100 ve-flex-col min-h-0"></div>`).appendTo($wrpRows);

			const hkIxSel = (isNotFirstRun) => {
				fnsCleanupGroup.splice(0, fnsCleanupGroup.length).forEach(fn => fn());
				$wrpRowsInner.empty();

				if (isNotFirstRun) resetGroupState();

				const featSet = ent?.feats?.[this._parent.state[propIxSel]];

				const uidsStatic = StatGenUtilAdditionalFeats.getUidsStatic(featSet);

				const $rows = [];

				uidsStatic.map((uid, ix) => {
					const {propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAdditionalFeatsFeatSet_(namespace, "static", ix);
					const {name, source} = DataUtil.proxy.unpackUid("feat", uid, "feat", {isLower: true});
					const feat = this._parent.feats.find(it => it.name.toLowerCase() === name && it.source.toLowerCase() === source);
					const {$stgFeat, hkIxFeat, cleanup} = this._render_getMetaFeat({featStatic: feat, propIxFeatAbility, propFeatAbilityChooseFrom});
					fnsCleanupGroup.push(cleanup);
					hkIxFeat();

					const $row = $$`<div class="ve-flex-v-end py-3 px-1 statgen-asi__row">
						<div class="ve-btn-group"><div class="w-100p ve-text-center">Feat</div></div>
						<div class="vr-4"></div>
						${$stgFeat}
					</div>`.appendTo($wrpRowsInner);
					$rows.push($row);
				});

				[...new Array(featSet?.any || 0)].map((_, ix) => {
					const {propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAdditionalFeatsFeatSet_(namespace, "choose", ix);
					const {$stgFeat, hkIxFeat, cleanup} = this._render_getMetaFeat({propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom});
					fnsCleanupGroup.push(cleanup);
					hkIxFeat();

					const $row = $$`<div class="ve-flex-v-end py-3 px-1 statgen-asi__row">
						<div class="ve-btn-group"><div class="w-100p ve-text-center">Feat</div></div>
						<div class="vr-4"></div>
						${$stgFeat}
					</div>`.appendTo($wrpRowsInner);
					$rows.push($row);
				});

				[...new Array(featSet?.anyFromCategory?.count || 0)].map((_, ix) => {
					const {propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAdditionalFeatsFeatSet_(namespace, "chooseCategory", ix);
					const {$stgFeat, hkIxFeat, cleanup} = this._render_getMetaFeat({propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom, category: featSet.anyFromCategory.category});
					fnsCleanupGroup.push(cleanup);
					hkIxFeat();

					const $row = $$`<div class="ve-flex-v-end py-3 px-1 statgen-asi__row">
						<div class="ve-btn-group"><div class="w-100p ve-text-center">${Parser.featCategoryToFull(featSet.anyFromCategory.category)} Feat</div></div>
						<div class="vr-4"></div>
						${$stgFeat}
					</div>`.appendTo($wrpRowsInner);
					$rows.push($row);
				});

				// Remove border styling from the last row
				if ($rows.last()) $rows.last().removeClass("statgen-asi__row");

				this._doPulseThrottled();
			};
			this._parent.addHookBase(propIxSel, hkIxSel);
			fnsCleanupEnt.push(() => this._parent.removeHookBase(propIxSel, hkIxSel));
			hkIxSel();
			this._doPulseThrottled();
		};
		this._parent.addHookBase(propEntity, hkEnt);
		hkEnt();
	}

	/**
	 * @param {?string} featStatic Static feat UID.
	 * @param {?string} propIxFeat Dynamic feat UID property.
	 * @param {string} propIxFeatAbility Feat chosen ability score set property.
	 * @param {string} propFeatAbilityChooseFrom Feat chosen-from ability score property.
	 * @param {?string} category Category feat is to be chosen from, e.g. `O` ("Origin").
	 * @private
	 */
	_render_getMetaFeat ({featStatic = null, propIxFeat = null, propIxFeatAbility, propFeatAbilityChooseFrom, category = null}) {
		if (featStatic && propIxFeat) throw new Error(`Cannot combine static feat and feat property!`);
		if (featStatic == null && propIxFeat == null) throw new Error(`Either a static feat or a feat property must be specified!`);

		const $btnChooseFeat = featStatic ? null : $(`<button class="ve-btn ve-btn-xxs ve-btn-default mr-2" title="Choose a Feat"><span class="glyphicon glyphicon-search"></span></button>`)
			.click(async () => {
				const selecteds = await this._parent.modalFilterFeats.pGetUserSelection({
					filterExpression: category ? `Category=${category}` : `Category=`,
				});
				if (selecteds == null || !selecteds.length) return;

				const selected = selecteds[0];
				const ix = this._parent.feats.findIndex(it => it.name === selected.name && it.source === selected.values.sourceJson);
				if (!~ix) throw new Error(`Could not find selected entity: ${JSON.stringify(selected)}`); // Should never occur
				this._parent.state[propIxFeat] = ix;

				this._doPulseThrottled();
			});

		// region Feat
		const $dispFeat = $(`<div class="ve-flex-v-center mr-2"></div>`);
		const $stgSelectAbilitySet = $$`<div class="ve-flex-v-center mr-2"></div>`;
		const $stgFeatNoChoice = $$`<div class="ve-flex-v-center mr-2"></div>`;
		const $stgFeatChooseAsiFrom = $$`<div class="ve-flex-v-end"></div>`;
		const $stgFeatChooseAsiWeighted = $$`<div class="ve-flex-v-center"></div>`;

		const $stgFeat = $$`<div class="ve-flex-v-center">
			${$btnChooseFeat}
			${$dispFeat}
			${$stgSelectAbilitySet}
			${$stgFeatNoChoice}
			${$stgFeatChooseAsiFrom}
			${$stgFeatChooseAsiWeighted}
		</div>`;

		const fnsCleanup = [];
		const fnsCleanupFeat = [];
		const fnsCleanupFeatAbility = [];

		const hkIxFeat = (isNotFirstRun) => {
			fnsCleanupFeat.splice(0, fnsCleanupFeat.length).forEach(fn => fn());
			fnsCleanupFeatAbility.splice(0, fnsCleanupFeatAbility.length).forEach(fn => fn());

			if (isNotFirstRun) {
				const nxtState = Object.keys(this._parent.state).filter(it => it.startsWith(propFeatAbilityChooseFrom)).mergeMap(it => ({[it]: null}));
				this._parent.proxyAssignSimple("state", nxtState);
			}

			const feat = featStatic || this._parent.feats[this._parent.state[propIxFeat]];

			$stgFeat.removeClass("ve-flex-v-end").addClass("ve-flex-v-center");
			$dispFeat.toggleClass("italic ve-muted", !feat);
			$dispFeat.html(feat ? Renderer.get().render(`{@feat ${VetoolsConfig.get("styleSwitcher", "style") === SITE_STYLE__CLASSIC ? feat.name.toLowerCase() : feat.name}|${feat.source}}`) : `(Choose a feat)`);

			this._parent.state[propIxFeatAbility] = 0;

			$stgSelectAbilitySet.hideVe();
			if (feat) {
				if (feat.ability && feat.ability.length > 1) {
					const metaChooseAbilitySet = ComponentUiUtil.$getSelEnum(
						this._parent,
						propIxFeatAbility,
						{
							values: feat.ability.map((_, i) => i),
							fnDisplay: ix => Renderer.getAbilityData([feat.ability[ix]]).asText,
							asMeta: true,
						},
					);

					$stgSelectAbilitySet.showVe().append(metaChooseAbilitySet.$sel);
					metaChooseAbilitySet.$sel.change(() => this._doPulseThrottled());
					fnsCleanupFeat.push(() => metaChooseAbilitySet.unhook());
				}

				const hkAbilitySet = () => {
					fnsCleanupFeatAbility.splice(0, fnsCleanupFeatAbility.length).forEach(fn => fn());

					if (!feat.ability) {
						$stgFeatNoChoice.empty().hideVe();
						$stgFeatChooseAsiFrom.empty().hideVe();
						return;
					}

					const abilitySet = feat.ability[this._parent.state[propIxFeatAbility]];

					// region Static/no choices
					const ptsNoChoose = Parser.ABIL_ABVS.filter(ab => abilitySet[ab]).map(ab => `${Parser.attAbvToFull(ab)} ${UiUtil.intToBonus(abilitySet[ab], {isPretty: true})}`);
					$stgFeatNoChoice.empty().toggleVe(ptsNoChoose.length).html(`<div><span class="mr-2">\u2014</span>${ptsNoChoose.join(", ")}</div>`);
					// endregion

					// region Choices
					if (abilitySet.choose && abilitySet.choose.from) {
						$stgFeat.removeClass("ve-flex-v-center").addClass("ve-flex-v-end");
						$stgFeatChooseAsiFrom.showVe().empty();
						$stgFeatChooseAsiWeighted.empty().hideVe();

						const count = abilitySet.choose.count || 1;
						const amount = abilitySet.choose.amount || 1;

						const {rowMetas, cleanup: cleanupAsiPicker} = ComponentUiUtil.getMetaWrpMultipleChoice(
							this._parent,
							propFeatAbilityChooseFrom,
							{
								values: abilitySet.choose.from,
								fnDisplay: v => `${Parser.attAbvToFull(v)} ${UiUtil.intToBonus(amount, {isPretty: true})}`,
								count,
							},
						);
						fnsCleanupFeatAbility.push(() => cleanupAsiPicker());

						$stgFeatChooseAsiFrom.append(`<div><span class="mr-2">\u2014</span>choose ${count > 1 ? `${count} ` : ""}${UiUtil.intToBonus(amount, {isPretty: true})}</div>`);

						rowMetas.forEach(meta => {
							meta.$cb.change(() => this._doPulseThrottled());

							$$`<label class="ve-flex-col no-select">
								<div class="ve-flex-vh-center statgen-asi__cell-feat" title="${Parser.attAbvToFull(meta.value)}">${meta.value.toUpperCase()}</div>
								<div class="ve-flex-vh-center statgen-asi__cell-feat">${meta.$cb}</div>
							</label>`.appendTo($stgFeatChooseAsiFrom);
						});
					} else if (abilitySet.choose && abilitySet.choose.weighted) {
						// TODO(Future) unsupported, for now
						$stgFeatChooseAsiFrom.empty().hideVe();
						$stgFeatChooseAsiWeighted.showVe().html(`<i class="ve-muted">The selected ability score format is currently unsupported. Please check back later!</i>`);
					} else {
						$stgFeatChooseAsiFrom.empty().hideVe();
						$stgFeatChooseAsiWeighted.empty().hideVe();
					}
					// endregion

					this._doPulseThrottled();
				};
				this._parent.addHookBase(propIxFeatAbility, hkAbilitySet);
				fnsCleanupFeat.push(() => this._parent.removeHookBase(propIxFeatAbility, hkAbilitySet));
				hkAbilitySet();
			} else {
				$stgFeatNoChoice.empty().hideVe();
				$stgFeatChooseAsiFrom.empty().hideVe();
				$stgFeatChooseAsiWeighted.empty().hideVe();
			}

			this._doPulseThrottled();
		};

		if (!featStatic) {
			this._parent.addHookBase(propIxFeat, hkIxFeat);
			fnsCleanup.push(() => this._parent.removeHookBase(propIxFeat, hkIxFeat));
		}

		const cleanup = () => {
			fnsCleanup.splice(0, fnsCleanup.length).forEach(fn => fn());
			fnsCleanupFeat.splice(0, fnsCleanupFeat.length).forEach(fn => fn());
			fnsCleanupFeatAbility.splice(0, fnsCleanupFeatAbility.length).forEach(fn => fn());
		};

		return {$btnChooseFeat, $stgFeat, hkIxFeat, cleanup};
	}

	render ($wrpAsi) {
		const $wrpRowsAsi = $(`<div class="ve-flex-col w-100 ve-overflow-y-auto"></div>`);
		const $wrpRowsRace = $(`<div class="ve-flex-col w-100 ve-overflow-y-auto"></div>`);
		const $wrpRowsBackground = $(`<div class="ve-flex-col w-100 ve-overflow-y-auto"></div>`);
		const $wrpRowsCustom = $(`<div class="ve-flex-col w-100 ve-overflow-y-auto"></div>`);

		this._render_renderAsiFeatSection("common_cntAsi", "ability", $wrpRowsAsi);
		this._render_renderAsiFeatSection("common_cntFeatsCustom", "custom", $wrpRowsCustom);
		this._render_renderAdditionalFeatSection({propEntity: "common_ixRace", namespace: "race", $wrpRows: $wrpRowsRace});
		this._render_renderAdditionalFeatSection({propEntity: "common_ixBackground", namespace: "background", $wrpRows: $wrpRowsBackground});

		const $getStgEntity = ({title, $wrpRows, propEntity, propIxEntity}) => {
			const $stg = $$`<div class="ve-flex-col">
				<hr class="hr-3 hr--dotted">
				<h4 class="my-2 bold">${title} Feats</h4>
				${$wrpRows}
			</div>`;

			const hkIxEntity = () => {
				const entity = this._parent[propEntity];
				$stg.toggleVe(!this._parent.isLevelUp && !!entity?.feats);
			};
			this._parent.addHookBase(propIxEntity, hkIxEntity);
			hkIxEntity();

			return $stg;
		};

		const $stgRace = $getStgEntity({title: "Species", $wrpRows: $wrpRowsRace, propEntity: "race", propIxEntity: "common_ixRace"});

		const $stgBackground = $getStgEntity({title: "Background", $wrpRows: $wrpRowsBackground, propEntity: "background", propIxEntity: "common_ixBackground"});

		const $iptCountFeatsCustom = ComponentUiUtil.$getIptInt(this._parent, "common_cntFeatsCustom", 0, {min: 0, max: MAX_CUSTOM_FEATS})
			.addClass("w-100p ve-text-center");

		$$($wrpAsi)`
			<h4 class="my-2 bold">Ability Score Increases</h4>
			${this._render_$getStageCntAsi()}
			${$wrpRowsAsi}

			${$stgRace}

			${$stgBackground}

			<hr class="hr-3 hr--dotted">
			<h4 class="my-2 bold">Additional Feats</h4>
			<label class="w-100 ve-flex-v-center mb-2">
				<div class="mr-2 no-shrink">Number of additional feats:</div>${$iptCountFeatsCustom}
			</label>
			${$wrpRowsCustom}
		`;
	}

	_render_$getStageCntAsi () {
		if (!this._parent.isCharacterMode) {
			const $iptCountAsi = ComponentUiUtil.$getIptInt(this._parent, "common_cntAsi", 0, {min: 0, max: 20})
				.addClass("w-100p ve-text-center");
			return $$`<label class="w-100 ve-flex-v-center mb-2"><div class="mr-2 no-shrink">Number of Ability Score Increases to apply:</div>${$iptCountAsi}</label>`;
		}

		const $out = $$`<div class="w-100 ve-flex-v-center mb-2 italic ve-muted">No ability score increases available.</div>`;
		const hkCntAsis = () => $out.toggleVe(this._parent.state.common_cntAsi === 0);
		this._parent.addHookBase("common_cntAsi", hkCntAsis);
		hkCntAsis();
		return $out;
	}

	_getFormData_getForNamespace_basic (outs, outIsFormCompletes, outFeats, propCnt, namespace) {
		for (let i = 0; i < this._parent.state[propCnt]; ++i) {
			const {propMode, propIxFeat, propIxAsiPointOne, propIxAsiPointTwo, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAsi(i, namespace);

			if (this._parent.state[propMode] === "asi") {
				const out = {};

				let ttlChosen = 0;

				Parser.ABIL_ABVS.forEach((ab, abI) => {
					const increase = [this._parent.state[propIxAsiPointOne] === abI, this._parent.state[propIxAsiPointTwo] === abI].filter(Boolean).length;
					if (increase) out[ab] = increase;
					ttlChosen += increase;
				});

				const isFormComplete = ttlChosen === 2;

				outFeats[namespace].push(null); // Pad the array

				outs.push(out);
				outIsFormCompletes.push(isFormComplete);
			} else if (this._parent.state[propMode] === "feat") {
				const {isFormComplete, out} = this._getFormData_doAddFeatMeta({
					namespace,
					outFeats,
					propIxFeat,
					propIxFeatAbility,
					propFeatAbilityChooseFrom,
					featsAdditionType: "choose",
				});
				outs.push(out);
				outIsFormCompletes.push(isFormComplete);
			}
		}
	}

	_getFormData_getForNamespace_additional (outs, outIsFormCompletes, outFeats, namespace) {
		const ent = this._parent[namespace]; // e.g. `this._parent.race`
		if (!ent?.feats?.length) return;

		const {propIxSel} = this._parent.getPropsAdditionalFeats_(namespace);

		const featSet = ent.feats[this._parent.state[propIxSel]];
		if (!featSet) {
			outIsFormCompletes.push(false);
			return;
		}

		const uidsStatic = StatGenUtilAdditionalFeats.getUidsStatic(featSet);

		uidsStatic.map((uid, ix) => {
			const {propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAdditionalFeatsFeatSet_(namespace, "static", ix);
			const {name, source} = DataUtil.proxy.unpackUid("feat", uid, "feat", {isLower: true});
			const feat = this._parent.feats.find(it => it.name.toLowerCase() === name && it.source.toLowerCase() === source);

			const {isFormComplete, out} = this._getFormData_doAddFeatMeta({
				namespace,
				outFeats,
				featStatic: feat,
				propIxFeatAbility,
				propFeatAbilityChooseFrom,
				featsAdditionType: "static",
			});

			outs.push(out);
			outIsFormCompletes.push(isFormComplete);
		});

		[...new Array(featSet.any || 0)].map((_, ix) => {
			const {propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAdditionalFeatsFeatSet_(namespace, "choose", ix);

			const {isFormComplete, out} = this._getFormData_doAddFeatMeta({
				namespace,
				outFeats,
				propIxFeat,
				propIxFeatAbility,
				propFeatAbilityChooseFrom,
				featsAdditionType: "choose",
			});

			outs.push(out);
			outIsFormCompletes.push(isFormComplete);
		});

		[...new Array(featSet?.anyFromCategory?.count || 0)].map((_, ix) => {
			const {propIxFeat, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAdditionalFeatsFeatSet_(namespace, "chooseCategory", ix);

			const {isFormComplete, out} = this._getFormData_doAddFeatMeta({
				namespace,
				outFeats,
				propIxFeat,
				propIxFeatAbility,
				propFeatAbilityChooseFrom,
				featsAdditionType: "chooseCategory",
			});

			outs.push(out);
			outIsFormCompletes.push(isFormComplete);
		});
	}

	_getFormData_doAddFeatMeta ({namespace, outFeats, propIxFeat = null, featStatic = null, propIxFeatAbility, propFeatAbilityChooseFrom, featsAdditionType}) {
		if (featStatic && propIxFeat) throw new Error(`Cannot combine static feat and feat property!`);
		if (featStatic == null && propIxFeat == null) throw new Error(`Either a static feat or a feat property must be specified!`);

		const out = {};

		const feat = featStatic || this._parent.feats[this._parent.state[propIxFeat]];

		const featMeta = feat
			? {ix: this._parent.state[propIxFeat], uid: `${feat.name}|${feat.source}`, featsAdditionType}
			: {ix: -1, uid: null, featsAdditionType};
		outFeats[namespace].push(featMeta);

		if (!~featMeta.ix) return {isFormComplete: false, out};
		if (!feat.ability) return {isFormComplete: true, out};

		const abilitySet = feat.ability[this._parent.state[propIxFeatAbility] || 0];

		// Add static values
		Parser.ABIL_ABVS.forEach(ab => { if (abilitySet[ab]) out[ab] = abilitySet[ab]; });

		if (!abilitySet.choose) return {isFormComplete: true, out};

		let isFormComplete = true;

		// Track any bonuses chosen, so we can use `"inherit"` when handling a feats "additionalSpells" elsewhere
		featMeta.abilityChosen = {};

		if (abilitySet.choose.from) {
			if (isFormComplete) isFormComplete = !!this._parent.state[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsAcceptable(propFeatAbilityChooseFrom)];

			const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this._parent, propFeatAbilityChooseFrom);
			ixs.map(it => abilitySet.choose.from[it]).forEach(ab => {
				const amount = abilitySet.choose.amount || 1;
				out[ab] = (out[ab] || 0) + amount;
				featMeta.abilityChosen[ab] = amount;
			});
		}

		return {isFormComplete, out};
	}

	getFormData () {
		const outs = [];
		const isFormCompletes = [];
		const feats = {ability: [], race: [], background: [], custom: []};

		this._getFormData_getForNamespace_basic(outs, isFormCompletes, feats, "common_cntAsi", "ability");
		this._getFormData_getForNamespace_basic(outs, isFormCompletes, feats, "common_cntFeatsCustom", "custom");
		this._getFormData_getForNamespace_additional(outs, isFormCompletes, feats, "race");
		this._getFormData_getForNamespace_additional(outs, isFormCompletes, feats, "background");

		const data = {};
		outs.filter(Boolean).forEach(abilBonuses => Object.entries(abilBonuses).forEach(([ab, bonus]) => data[ab] = (data[ab] || 0) + bonus));

		return {
			isFormComplete: isFormCompletes.every(Boolean),
			dataPerAsi: outs,
			data,
			feats,
		};
	}
}
