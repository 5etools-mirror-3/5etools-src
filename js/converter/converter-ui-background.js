import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterBackground} from "./converter-background.js";

export class BackgroundConverterUi extends ConverterUiBase {
	constructor (ui) {
		super(
			ui,
			{
				name: "Background",
				converterId: "background",
				canSaveLocal: true,
				modes: ["txt"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "background",
			},
		);
	}

	_renderSidebar (parent, $wrpSidebar) {
		$wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterBackground.doParseText(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}

	_getSample (format) {
		switch (format) {
			case "txt": return BackgroundConverterUi._SAMPLE_TEXT;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}
}
// region sample
BackgroundConverterUi._SAMPLE_TEXT = `Giant Foundling
Skill Proficiencies: Intimidation, Survival
Languages: Giant and one other language of your choice
Equipment: A backpack, a set of traveler’s clothes, a small stone or sprig that reminds you of home, and a pouch containing 10 gp

Origin Stories
How you came to live among colossal creatures is up to you to determine, but the Foundling Origin table suggests a variety of possibilities.

Foundling Origin
d6 Origin
1 You were found as a baby by a family of nomadic giants who raised you as one of their own.
2 A family of stone giants rescued you when you fell into a mountain chasm, and you have lived with them underground ever since.
3 You were lost or abandoned as a child in a jungle that teemed with ravenous dinosaurs. There, you found an equally lost frost giant; together, you survived.
4 Your farm was crushed and your family killed in a battle between warring groups of giants. Racked with guilt over the destruction, a sympathetic giant soldier promised to care for you.
5 After you had a series of strange dreams as a child, your superstitious parents sent you to study with a powerful but aloof storm giant oracle.
6 While playing hide-and-seek with your friends, you stumbled into the castle of a cloud giant, who immediately adopted you.

Building a Giant Foundling Character
Your life among giants has given you a unique perspective. Though you are unusually large for your kind, you’re no larger than a giant child, so you might be very mindful of your size.

Feature: Strike of the Giants
You gain the Strike of the Giants feat.

Suggested Characteristics
The Giant Foundling Personality Traits table suggests a variety of traits you might adopt for your character.

d6 Personality Trait
1 What I lack in stature compared to giants, I make up for with sheer spite.
2 I insist on being taken seriously as a full-grown adult. Nobody talks down to me!
3 Crowded spaces make me uncomfortable. I’d much rather be in an open field than a bustling tavern.
4 I embrace my shorter stature. It helps me stay unnoticed—and underestimated.
5 Every avalanche begins as a single pebble.
6 The world always feels too big, and I’m afraid I’ll never find my place in it.`;
// endregion
