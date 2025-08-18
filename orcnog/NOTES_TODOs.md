# Orcnog's TODO's

## Bug fixes

* [ ] **Clear cache quicker / more thoroughly / more reliably on `main` changes.**<br/>--Should I be creating PRs with v** tags to kick off the built-in .yml workflows in github, and would that help clear the cache more consistently?

## UI Enhancements

* [ ] Make adventures / books open in "View Full..." mode initially.

* [ ] Update the "monster" icon in initiative tracker, which looks like a printer icon.

* [x] Update Day mode adventure text to have parchment-colored bg. (update block bg's as needed to look okay with that change)

* [x] Add `{@cue some text}` tag with pipe args for different color cues: `|dm` (default, green), `|media` (yellow), and `|critical` (red).

* [x] Add `insetDMAction` block type. Shows like an inset, but with a greener bg. Meant to be instructions for the DM.

## Data Updates

* [ ] **Group the _DoD_ adventures** (_DoDTTG_, _DoDAWH_, etc), much like the _Tales From the Yawning Portal_ books or the _MCDM: Where Evil Lives_ books are grouped.

* [ ] **Fix repeated creatures**, like "Stormtrooper" that exists in _SnV_ as well as _Rugosa_.  Model after Frost Giants, which exist in _MM_ as well as _SKT_ (and others).

* [ ] **Pick a convention for json paths** (both folder and file names), and convert all to follow it.  Follow 5etools existing conventions as closely as possible.

* [ ] **Pick a convention for source IDs**, and convert all to follow it. Maybe follow MCDM conventions, or other prominent homebrew contributors?

* [ ] **Pick a convention for source Abbreviations**, and convert all to follow it. Maybe follow MCDM conventions, or other prominent homebrew contributors?

* [ ] **Pick a convention for Encounter blocks** inside adventure text, and convert all to follow it. Check for conventions in other prominent homebrew contributors... if none exist, consider sticking with the _DoD_ encounter blocks I have used (see: [example encounter from _A Wretched Hive_](https://5e.orcnog.com/adventure.html#orcnogdodep2,1,swoop%20marauders%20encounter%20\(cr%203\),0)).

* [ ] **Pick a convention for DM Action Prompts** inside adventure text, such as "[ DC 10 Investigation Check: If the players investigate the orb, read the following: ]"

* [ ] **Add token images to all custom creatures**. (and maybe fluff images too?)

* [ ] **Finish converting the _House of Elazar_ adventure.**

* [ ] **Finish converting Rugosa adventure.**

* [ ] **Convert Halcyon adventure.**

* [ ] **Convert Decryptor adventure.**

* [ ] **Convert Lost Temple adventure.**

* [ ] **Finish converting DoD adventures...**

## Back End Enhancements

* [ ] Connect the 5etools initiative tracker to the d20.orcnog.com/controller functionality.

* [ ] Auto URL shortener for super long DM Screen URLs?

* [ ] Add a Print Statblocks option in the DM Screen or maybe a separate Print page, which styles statblocks a bit better (fonts closer to the WotC book standards), and allows for layout choices (vertical vs horizontal, # of columns inside the statblock itself).

* [ ] Make an "encounter" an includable object inside an adventure, much like a statblock or a table. Develop its own default rendering and styling.

## Grand (maybe unrealistic) Enhancement Goals

* [ ] Allow an includable encounter block to be run/operated directly from the adventure text.
    * Maybe ^ this looks like just adding the HP and condition trackers to already-includable statblocks? And tracking HPs of named NPCs globally (within the adventure text)?  Idunno... that is kinda half-baked.  A full-on initiative tracker inside the adventure would be superior, and possibly easier to implement.

* [ ] Automate the conversion of my OneNote articles into 5eTools adventure json??  Maybe OneNote -> Markdown -> json?  Maybe AI can help? (that's not really automating it, but it might speed me up)

* [ ] Add a sign-in feature. No more saving JSON files to your PC.
