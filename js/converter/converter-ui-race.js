import {ConverterUiBase} from "./converter-ui-base.js";
import {ConverterRace} from "./converter-race.js";

export class RaceConverterUi extends ConverterUiBase {
	constructor (ui) {
		super(
			ui,
			{
				name: "Species",
				converterId: "race",
				canSaveLocal: true,
				modes: ["txt", "md"],
				hasPageNumbers: true,
				titleCaseFields: ["name"],
				hasSource: true,
				prop: "race",
			},
		);
	}

	_renderSidebar (parent, $wrpSidebar) {
		$wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "txt": return ConverterRace.doParseText(input, opts);
			case "md": return ConverterRace.doParseMarkdown(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}

	_getSample (format) {
		switch (format) {
			case "txt": return RaceConverterUi._SAMPLE_TEXT;
			case "md": return RaceConverterUi.SAMPLE_MD;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}
}
// region sample
RaceConverterUi._SAMPLE_TEXT = `Aasimar

Creature Type. You are a humanoid.

Size. You are Medium or Small. You choose the size when you select this race.

Speed. Your walking speed is 30 feet.

Celestial Resistance. You have resistance to necrotic damage and radiant damage.

Darkvision. You can see in dim light within 60 feet of you as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray.

Healing Hands. As an action, you can touch a creature and roll a number of d4s equal to your proficiency bonus. The creature regains a number of hit points equal to the total rolled. Once you use this trait, you can’t use it again until you finish a long rest.

Light Bearer. You know the light cantrip. Charisma is your spellcasting ability for it.

Celestial Revelation. When you reach 3rd level, choose one of the revelation options below. Thereafter, you can use a bonus action to unleash the celestial energy within yourself, gaining the benefits of that revelation. Your transformation lasts for 1 minute or until you end it as a bonus action. While you’re transformed, Once you transform using your revelation below, you can’t use it again until you finish a long rest.

• Necrotic Shroud. Your eyes briefly become pools of darkness, and ghostly, flightless wings sprout from your back temporarily. Creatures other than your allies within 10 feet of you that can see you must succeed on a Charisma saving throw (DC 8 + your proficiency bonus + your Charisma modifier) or become frightened of you until the end of your next turn. Until the transformation ends, once on each of your turns, you can deal extra necrotic damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your proficiency bonus.
• Radiant Consumption. Searing light temporarily radiates from your eyes and mouth. For the duration, you shed bright light in a 10-foot radius and dim light for an additional 10 feet, and at the end of each of your turns, each creature within 10 feet of you takes radiant damage equal to your proficiency bonus. Until the transformation ends, once on each of your turns, you can deal extra radiant damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your proficiency bonus.
• Radiant Soul. Two luminous, spectral wings sprout from your back temporarily. Until the transformation ends, you have a flying speed equal to your walking speed, and once on each of your turns, you can deal extra radiant damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your proficiency bonus.`;
RaceConverterUi.SAMPLE_MD = `Aasimar

**Creature Type.** You are a humanoid.

**Size**. You are Medium or Small. You choose the size when you select this race.

**Speed**. Your walking speed is 30 feet.

**Celestial Resistance.** You have resistance to necrotic damage and radiant damage.

**Darkvision**. You can see in dim light within 60 feet of you as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray.

**Healing Hands**. As an action, you can touch a creature and roll a number of d4s equal to your proficiency bonus. The creature regains a number of hit points equal to the total rolled. Once you use this trait, you can’t use it again until you finish a long rest.

**Light Bearer**. You know the light cantrip. Charisma is your spellcasting ability for it.

**Celestial Revelation. **When you reach 3rd level, choose one of the revelation options below. Thereafter, you can use a bonus action to unleash the celestial energy within yourself, gaining the benefits of that revelation. Your transformation lasts for 1 minute or until you end it as a bonus action. While you’re transformed, Once you transform using your revelation below, you can’t use it again until you finish a long rest.

* **Necrotic Shroud**. Your eyes briefly become pools of darkness, and ghostly, flightless wings sprout from your back temporarily. Creatures other than your allies within 10 feet of you that can see you must succeed on a Charisma saving throw (DC 8 + your proficiency bonus + your Charisma modifier) or become frightened of you until the end of your next turn. Until the transformation ends, once on each of your turns, you can deal extra necrotic damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your proficiency bonus.
* **Radiant Consumption**. Searing light temporarily radiates from your eyes and mouth. For the duration, you shed bright light in a 10-foot radius and dim light for an additional 10 feet, and at the end of each of your turns, each creature within 10 feet of you takes radiant damage equal to your proficiency bonus. Until the transformation ends, once on each of your turns, you can deal extra radiant damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your proficiency bonus.
* **Radiant Soul**. Two luminous, spectral wings sprout from your back temporarily. Until the transformation ends, you have a flying speed equal to your walking speed, and once on each of your turns, you can deal extra radiant damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your proficiency bonus.`;
// endregion
