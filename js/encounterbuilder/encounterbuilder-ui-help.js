export class EncounterBuilderUiHelp {
	static getHelpEntry ({partyMeta, encounterXpInfo}) {
		// TODO(Future) update this based on the actual method being used
		return {
			type: "entries",
			entries: [
				`{@b Adjusted by a ${encounterXpInfo.playerAdjustedXpMult}× multiplier, based on a minimum challenge rating threshold of approximately ${`${encounterXpInfo.crCutoff.toFixed(2)}`.replace(/[,.]?0+$/, "")}*&dagger;, and a party size of ${encounterXpInfo.playerCount} players.}`,
				// `{@note * If the maximum challenge rating is two or less, there is no minimum threshold. Similarly, if less than a third of the party are level 5 or higher, there is no minimum threshold. Otherwise, for each creature in the encounter, the average CR of the encounter is calculated while excluding that creature. The highest of these averages is then halved to produce a minimum CR threshold. CRs less than this minimum are ignored for the purposes of calculating the final CR multiplier.}`,
				`{@note * If the maximum challenge rating is two or less, there is no minimum threshold. Similarly, if less than a third of the party are level 5 or higher, there is no minimum threshold. Otherwise, for each creature in the encounter in lowest-to-highest CR order, the average CR of the encounter is calculated while excluding that creature. Then, if the removed creature's CR is more than one deviation less than  this average, the process repeats. Once the process halts, this threshold value (average minus one deviation) becomes the final CR cutoff.}`,
				`<hr>`,
				{
					type: "quote",
					entries: [
						`&dagger; [...] don't count any monsters whose challenge rating is significantly below the average challenge rating of the other monsters in the group [...]`,
					],
					"by": `{@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}, page 82|DMG|3|4 Modify Total XP for Multiple Monsters}`,
				},
				`<hr>`,
				{
					"type": "table",
					"caption": "Encounter Multipliers",
					"colLabels": [
						"Number of Monsters",
						"Multiplier",
					],
					"colStyles": [
						"col-6 text-center",
						"col-6 text-center",
					],
					"rows": [
						[
							"1",
							"×1",
						],
						[
							"2",
							"×1.5",
						],
						[
							"3-6",
							"×2",
						],
						[
							"7-10",
							"×2.5",
						],
						[
							"11-14",
							"×3",
						],
						[
							"15 or more",
							"×4",
						],
					],
				},
				...(partyMeta.cntPlayers < 3
					? [
						{
							type: "quote",
							entries: [
								"If the party contains fewer than three characters, apply the next highest multiplier on the Encounter Multipliers table.",
							],
							"by": `{@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}, page 83|DMG|3|Party Size}`,
						},
					]
					: partyMeta.cntPlayers >= 6
						? [
							{
								type: "quote",
								entries: [
									"If the party contains six or more characters, use the next lowest multiplier on the table. Use a multiplier of 0.5 for a single monster.",
								],
								"by": `{@book ${Parser.sourceJsonToFull(Parser.SRC_DMG)}, page 83|DMG|3|Party Size}`,
							},
						]
						: []
				),
			],
		};
	}
}
