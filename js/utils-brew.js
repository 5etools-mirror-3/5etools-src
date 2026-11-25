import {BrewUtilShared} from "./utils-brew/utils-brew-helpers.js";
import {PrereleaseUtil_} from "./utils-brew/utils-brew-impl-prerelease.js";
import {BrewUtil2_} from "./utils-brew/utils-brew-impl-brew.js";
import {BrewUtilRegistry} from "./utils-brew/utils-brew-registry.js";

const PrereleaseUtil = new PrereleaseUtil_();
const BrewUtil2 = new BrewUtil2_({parent: globalThis.PrereleaseUtil}); // Homebrew can depend on prerelease, but not the other way around

BrewUtilRegistry.doRegister(PrereleaseUtil);
BrewUtilRegistry.doRegister(BrewUtil2);

globalThis.BrewUtilShared = BrewUtilShared;
globalThis.PrereleaseUtil = PrereleaseUtil;
globalThis.BrewUtil2 = BrewUtil2;
