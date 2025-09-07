export class LootGenRender {
	static _RENDER_WRAPPER = null;
	static _RENDER_POST_PROCESS = null;

	static setRenderWrapper (val) { this._RENDER_WRAPPER = val; }
	static setRenderPostProcess (val) { this._RENDER_POST_PROCESS = val; }

	static _er (entry, depth) {
		return Renderer.get().setFirstSection(true).render(entry, depth);
	}

	static er (entry, depth) {
		const out = this._RENDER_WRAPPER
			? this._RENDER_WRAPPER(() => this._er(entry, depth))
			: this._er(entry, depth);
		return this._RENDER_POST_PROCESS ? this._RENDER_POST_PROCESS(out) : out;
	}
}
