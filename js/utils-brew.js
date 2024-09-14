import {BrewUtilShared} from "./utils-brew/utils-brew-helpers.js";
import {PrereleaseUtil_} from "./utils-brew/utils-brew-impl-prerelease.js";
import {BrewUtil2_} from "./utils-brew/utils-brew-impl-brew.js";

globalThis.BrewUtilShared = BrewUtilShared;

globalThis.PrereleaseUtil = new PrereleaseUtil_();
globalThis.BrewUtil2 = new BrewUtil2_({parent: globalThis.PrereleaseUtil}); // Homebrew can depend on prerelease, but not the other way around
