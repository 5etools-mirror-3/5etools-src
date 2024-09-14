"use strict";

class RenderVehicles {
	static $getRenderedVehicle (vehicle) {
		return $$`${Renderer.utils.getBorderTr()}
		${Renderer.vehicle.getRenderedString(vehicle)}
		${Renderer.utils.getPageTr(vehicle)}
		${Renderer.utils.getBorderTr()}`;
	}
}
