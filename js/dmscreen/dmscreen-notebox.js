import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

export class NoteBox extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._$iptText = null;
	}

	_$getPanelElement (board, state) {
		this._$iptText = $(`<textarea class="panel-content-textarea" placeholder="Supports inline rolls and content tags (CTRL-q with the caret in the text to activate the embed):\n • Inline rolls,  [[1d20+2]]\n • Content tags (as per the Demo page), {@creature goblin}, {@spell fireball}\n • Link tags, {@link https://5e.tools}">${state.x || ""}</textarea>`)
			.on("keydown", async evt => {
				const key = EventUtil.getKeyIgnoreCapsLock(evt);

				const isCtrlQ = (EventUtil.isCtrlMetaKey(evt)) && key === "q";

				if (!isCtrlQ) {
					board.doSaveStateDebounced();
					return;
				}

				const iptTxt = this._$iptText[0];
				if (iptTxt.selectionStart === iptTxt.selectionEnd) {
					const pos = iptTxt.selectionStart - 1;
					const text = iptTxt.value;
					const l = text.length;
					let beltStack = [];
					let braceStack = [];
					let belts = 0;
					let braces = 0;
					let beltsAtPos = null;
					let bracesAtPos = null;
					let lastBeltPos = null;
					let lastBracePos = null;
					outer: for (let i = 0; i < l; ++i) {
						const c = text[i];
						switch (c) {
							case "[":
								belts = Math.min(belts + 1, 2);
								if (belts === 2) beltStack = [];
								lastBeltPos = i;
								break;
							case "]":
								belts = Math.max(belts - 1, 0);
								if (belts === 0 && i > pos) break outer;
								break;
							case "{":
								if (text[i + 1] === "@") {
									braces = 1;
									braceStack = [];
									lastBracePos = i;
								}
								break;
							case "}":
								braces = 0;
								if (i >= pos) break outer;
								break;
							default:
								if (belts === 2) {
									beltStack.push(c);
								}
								if (braces) {
									braceStack.push(c);
								}
						}
						if (i === pos) {
							beltsAtPos = belts;
							bracesAtPos = braces;
						}
					}

					if (beltsAtPos === 2 && belts === 0) {
						const str = beltStack.join("");
						await Renderer.dice.pRoll2(str.replace(`[[`, "").replace(`]]`, ""), {
							isUser: false,
							name: "DM Screen",
						});
					} else if (bracesAtPos === 1 && braces === 0) {
						const str = braceStack.join("");
						const tag = str.split(" ")[0].replace(/^@/, "");
						const text = str.split(" ").slice(1).join(" ");
						if (Renderer.tag.getPage(tag)) {
							const r = Renderer.get().render(`{${str}}`);
							evt.type = "mouseover";
							evt.shiftKey = true;
							evt.ctrlKey = false;
							evt.metaKey = false;
							$(r).trigger(evt);
						} else if (tag === "link") {
							const [txt, link] = Renderer.splitTagByPipe(text);
							window.open(link && link.trim() ? link : txt);
						}
					}
				}
			});

		return this._$iptText;
	}

	getState () {
		return {x: this._$iptText?.val()};
	}
}
