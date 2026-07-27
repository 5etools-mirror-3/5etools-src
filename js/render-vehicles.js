"use strict";

class RenderVehicles {
	static getRenderedVehicle (vehicle) {
		return veT`${Renderer.utils.getBorderTr()}
		${Renderer.vehicle.getRenderedString(vehicle)}
		${Renderer.utils.getPageTr(vehicle)}
		${Renderer.utils.getBorderTr()}`;
	}
}
