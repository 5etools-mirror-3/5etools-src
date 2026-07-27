class _PanzoomComp extends BaseComponent {
	constructor ({scaleMin, scaleMax}) {
		super();
		this._scaleMin = scaleMin ?? 0.01;
		this._scaleMax = scaleMax ?? 100;
	}

	setPos (xy) {
		this._state.posX = xy[0];
		this._state.posY = xy[1];
	}

	getPos () {
		return [this._state.posX, this._state.posY];
	}

	setZoom (val) {
		if (val <= this._scaleMin) val = this._scaleMin;
		if (val >= this._scaleMax) val = this._scaleMax;
		this._state.zoom = val;
	}
	getZoom () { return this._state.zoom; }

	reset () {
		this._proxyAssignSimple("state", this._getDefaultState());
	}

	bindOnChange ({img, iptRange}) {
		this._addHookBase("zoom", () => iptRange.vee.val(this._state.zoom))();

		this._addHookAllBase(() => {
			img.vee.css({
				transform: this._getTransformationMatrix(),
				transformOrigin: this._getTransformOrigin(),
			});
		})();
	}

	_getTransformationMatrix () {
		const ptZoom = this._state.zoom;
		const ptTranslateX = this._state.posX;
		const ptTranslateY = this._state.posY;
		return `matrix(${ptZoom}, 0, 0, ${ptZoom}, ${ptTranslateX}, ${ptTranslateY})`;
	}

	_getTransformOrigin () {
		return `calc(50% - ${this._state.posX / 2}px) calc(50% - ${this._state.posY / 2}px)`;
	}

	getZoomFactor () {
		if (this._state.zoom <= 1.0) return 1;
		return Math.pow(1 / this._state.zoom, 0.3);
	}

	_getDefaultState () {
		return {
			zoom: 1.0,
			posX: 0.0,
			posY: 0.0,
		};
	}
}

// TODO(Future) make MMB zoom change transform origin
export class Panzoom {
	static mutBindPanzoom (
		{
			img,
			btnReset,
			iptRange,
			scaleMin,
			scaleMax,
			scaleStep,
		},
	) {
		const comp = new _PanzoomComp({scaleMin, scaleMax});

		btnReset.vee.onn("click", () => comp.reset());

		iptRange
			.vee.onn("input", () => {
				comp.setZoom(Number(iptRange.vee.val()));
			})
			.vee.attr("min", scaleMin)
			.vee.attr("max", scaleMax)
			.vee.attr("step", scaleStep);

		img
			.vee.css({
				cursor: "move",
				userSelect: "none",
			});

		comp.bindOnChange({img, iptRange});

		const dragState = {
			pointInitial: null,

			zoomInitial: null,
			zoomInitialY: null,
		};

		const eleBody = veE(document.body);

		const onBodyMouseUpPan = evt => {
			img.style.cursor = "move";
			eleBody
				.vee.off("mouseup", onBodyMouseUpPan)
				.vee.off("mousemove", onBodyMouseMovePan);
			dragState.pointInitial = null;
		};

		const onBodyMouseMovePan = evt => {
			const zoomFactor = comp.getZoomFactor();
			comp.setPos([
				(EventUtil.getClientX(evt) - dragState.pointInitial[0]) / zoomFactor,
				(EventUtil.getClientY(evt) - dragState.pointInitial[1]) / zoomFactor,
			]);
		};

		const onBodyMouseUpZoom = evt => {
			img.style.cursor = "move";
			eleBody
				.vee.off("mouseup", onBodyMouseUpZoom)
				.vee.off("mousemove", onBodyMouseMoveZoom);
			dragState.zoomInitial = null;
			dragState.zoomInitialY = null;
		};

		const onBodyMouseMoveZoom = evt => {
			const pxZoom = dragState.zoomInitialY - EventUtil.getClientY(evt);
			comp.setZoom(dragState.zoomInitial + pxZoom / 100);
		};

		img
			.vee.onn("mousedown", evt => {
				switch (evt.button) {
					// LMB
					case 0: {
						evt.preventDefault();

						img.style.cursor = "grabbing";
						const zoomFactor = comp.getZoomFactor();
						const posExisting = comp.getPos()
							.map(p => p * zoomFactor);
						dragState.pointInitial = [
							EventUtil.getClientX(evt) - posExisting[0],
							EventUtil.getClientY(evt) - posExisting[1],
						];

						eleBody
							.vee.onn("mouseup", onBodyMouseUpPan)
							.vee.onn("mousemove", onBodyMouseMovePan);

						break;
					}

					// MMB
					case 1: {
						evt.preventDefault();

						img.style.cursor = "zoom-in";

						dragState.zoomInitial = comp.getZoom();
						dragState.zoomInitialY = EventUtil.getClientY(evt);

						eleBody
							.vee.onn("mouseup", onBodyMouseUpZoom)
							.vee.onn("mousemove", onBodyMouseMoveZoom);
					}
				}
			});
	}
}
