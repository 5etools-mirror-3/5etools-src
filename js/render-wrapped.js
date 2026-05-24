export class WrappedRenderer {
	constructor (
		{
			renderWrapper = null,
			renderPostProcess = null,
		} = {},
	) {
		this._renderWrapper = renderWrapper;
		this._renderPostProcess = renderPostProcess;
	}

	_er (entry, depth) {
		return Renderer.get().setFirstSection(true).render(entry, depth);
	}

	er (entry, depth) {
		const out = this._renderWrapper
			? this._renderWrapper(() => this._er(entry, depth))
			: this._er(entry, depth);
		return this._renderPostProcess ? this._renderPostProcess(out) : out;
	}

	/** (Alias to allow use in place of `renderer`) */
	render (...args) {
		return this.er(...args);
	}
}
