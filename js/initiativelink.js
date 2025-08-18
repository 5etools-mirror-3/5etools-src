"use strict";

import { CONTROLLER_APP_PATH } from "./controller-config.js";

// Create a broadcast channel to communicate between open tabs/windows
const channel = new BroadcastChannel("orcnog-initiative-controller-broadcast-channel");
let controllerWindow = null;
let pendingEncounterData = null;

// Helper function to send encounter data and wait for acknowledgment
async function sendEncounterData (data, timeout = 100) {
	const message = {
		new_initiative_board: {
			players: data.creatures,
			currentRound: 1,
			currentTurn: 1,
		},
		timestamp: Date.now(),
	};

	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			channel.removeEventListener("message", messageHandler);
			reject(new Error("No controller response"));
		}, timeout);

		async function messageHandler (event) {
			if (event.data.type === "controller_ack" && event.data.timestamp === message.timestamp) {
				clearTimeout(timer);
				channel.removeEventListener("message", messageHandler);
				// showAlert("Data Sent", "<p>New encounter data sent to your Voice Initiative Controller tab.</p>");
				await InputUiUtil.pGetUserBoolean({title: "Encounter Data Sent", htmlDescription: `<p>New encounter data sent to your Voice Initiative Controller tab.</p>`, isAlert: true});
				resolve(event.data);
			}
		}

		channel.addEventListener("message", messageHandler);
		console.log("Sending message:", message);
		channel.postMessage(message);
	});
}

// Listen for controller ready messages with a separate handler
channel.addEventListener("message", async (event) => {
	// Log message data for debugging
	console.debug("Received message:", event.data);
	if (event.data.type === "controller_ready" && pendingEncounterData) {
		console.log("New controller is ready, sending pending encounter data");
		try {
			await sendEncounterData(pendingEncounterData);
			pendingEncounterData = null;
		} catch (error) {
			console.error("Failed to send pending encounter data:", error);
		}
	}
});

window.addEventListener("click", async (evt) => {
	if (evt.target.classList.contains("initiative-tracker-link")) {
		evt.preventDefault();
		const escapedDataJSON = evt.target?.dataset?.encounter;
		if (!escapedDataJSON) return;

		try {
			const data = JSON.parse(escapedDataJSON);
			console.log("Encounter Data:", data);

			// First, try to focus existing window if we have a reference
			if (controllerWindow && !controllerWindow.closed) {
				controllerWindow.focus();
				try {
					const response = await sendEncounterData(data);
					if (response.status === "ready") {
						console.log("Existing controller processed the message");
						return;
					}
				} catch (error) {
					console.log("Stored controller window reference is invalid");
					controllerWindow = null;
				}
			}

			// If no stored window reference, try broadcasting to any open controller
			try {
				const response = await sendEncounterData(data);
				if (response.status === "ready") {
					console.log("Controller processed the message");
					return;
				}
				if (response.status === "waiting") {
					console.log("Controller exists but isn't connected yet");
					// Store the encounter data to be sent when controller is ready
					pendingEncounterData = data;
				}
			} catch (error) {
				console.log("No controller responded, opening new tab");

				// Store the encounter data to be sent when controller is ready
				pendingEncounterData = data;

				// Open new controller window and store reference
				controllerWindow = window.open(
					`${CONTROLLER_APP_PATH}controller.html`,
					"_blank",
				);

				if (controllerWindow) {
					controllerWindow.focus();
				}
			}
		} catch (e) {
			console.error("Error processing encounter data:", e);
		}
	}
});