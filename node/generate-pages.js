import "../js/parser.js";
import "../js/utils.js";
import {PAGE_GENERATORS} from "./generate-pages/generate-pages-page-generator-config.js";

PAGE_GENERATORS
	.map(gen => gen.init())
	.forEach(generator => generator.generatePage());
