import {ConverterUiBase} from "./converter-ui-base.js";

export class EntryConverterUi extends ConverterUiBase {
	constructor (ui) {
		super(
			ui,
			{
				name: "Generic",
				converterId: "generic",
				canSaveLocal: false,
				modes: ["md"],
				hasPageNumbers: false,
				hasSource: false,
			},
		);
	}

	_renderSidebar (parent, $wrpSidebar) {
		$wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = this._handleParse_getOpts({cbOutput, cbWarning, isAppend});

		switch (this._state.mode) {
			case "md": return cbOutput(MarkdownConverter.getEntries(input));
			default: throw new Error(`Unimplemented!`);
		}
	}

	_getSample (format) {
		switch (format) {
			case "md": return EntryConverterUi.SAMPLE_MD;
			default: throw new Error(`Unknown format "${format}"`);
		}
	}
}
// region sample
EntryConverterUi.SAMPLE_MD = `# Introduction

This book is written for the Dungeon Master. It contains a complete Dungeons & Dragons adventure, as well as descriptions for every creature and magic item that appears in the adventure. It also introduces the world of the Forgotten Realms, one of the game's most enduring settings, and it teaches you how to run a D&D game.

The smaller book that accompanies this one (hereafter called "the rulebook") contains the rules you need to adjudicate situations that arise during the adventure.

#### The Dungeon Master

The Dungeon Master (DM) has a special role in the Dungeons & Dragons game.

The DM is a **referee**. When it's not clear what ought to happen next, the DM decides how to apply the rules and keep the story going.


> ##### Rules to Game By
>
>As the Dungeon Master, you are the final authority when it comes to rules questions or disputes. Here are some guidelines to help you arbitrate issues as they come up.
>
>- **When in doubt, make it up!** It's better to keep the game moving than to get bogged down in the rules.
>- **It's not a competition.** The DM isn't competing against the player characters. You're there to run the monsters, referee the rules, and keep the story moving.
>- **It's a shared story.** It's the group's story, so let the players contribute to the outcome through the actions of their characters. Dungeons & Dragons is about imagination and coming together to tell a story as a group. Let the players participate in the storytelling.
>- **Be consistent.** If you decide that a rule works a certain way in one session, make sure it works that way the next time it comes into play.
>- **Make sure everyone is involved.** Ensure every character has a chance to shine. If some players are reluctant to speak up, remember to ask them what their characters are doing.
>- **Be fair.** Use your powers as Dungeon Master only for good. Treat the rules and the players in a fair and impartial manner.
>- **Pay attention.** Make sure you look around the table occasionally to see if the game is going well. If everyone seems to be having fun, relax and keep going. If the fun is waning, it might be time for a break, or you can try to liven things up.

#### Improvising Ability Checks

The adventure often tells you what ability checks characters might try in a certain situation and the Difficulty Class (DC) of those checks. Sometimes adventurers try things that the adventure can't possibly anticipate. It's up to you to decide whether their attempts are successful. If it seems like anyone should have an easy time doing it, don't ask for an ability check; just tell the player what happens. Likewise, if there's no way anyone could accomplish the task, just tell the player it doesn't work.

Otherwise, answer these three simple questions:

- What kind of ability check?
- How hard is it?
- What's the result?

Use the descriptions of the ability scores and their associated skills in the rulebook to help you decide what kind of ability check to use. Then determine how hard the task is so that you can set the DC for the check. The higher the DC, the more difficult the task. The easiest way to set a DC is to decide whether the task's difficulty is easy, moderate, or hard, and use these three DCs:

- **Easy (DC 10)**. An easy task requires a minimal level of competence or a modicum of luck to accomplish.
- **Moderate (DC 15)**. A moderate task requires a slightly higher level of competence to accomplish. A character with a combination of natural aptitude and specialized training can accomplish a moderate task more often than not.
- **Hard (DC 20)**. Hard tasks include any effort that is beyond the capabilities of most people without aid or exceptional ability.

#### Abbreviations

The following abbreviations are used in this adventure:

| Abbreviation          | Abbreviation           |
|-----------------------|------------------------|
| DC = Difficulty Class | XP = experience points |
| gp = gold piece(s)    | pp = platinum piece(s) |
| sp = silver piece(s)  | ep = electrum piece(s) |
| cp = copper piece(s)  | -                      |`;
// endregion
