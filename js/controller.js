// TODO:
// 1. Add feature that totals up all encounters in an adventure and displays the total adjusted XP vs Daily Budget.
// 2. Related to #3, I think! 5et handles for summoned CRs. I haven't bothered... but I feel like I need to eventually support them.
// 3. Related to #2, I think! Apparently, there are some 5et creatures with CRs set to "0.5" instead of "1/2".  Need to handle for those. See: Aberrant Spirit (TCE).
// 4. Apparently, some creatures have no CR listed.  Need to handle for those in controller.js AND render.js encounter adj xp calculation.
// 5a. IDEA: allow monster rows to have "onHalfHealth" and "onZeroHealth" attributes, which can produce popups with text notes as those combatants HP changes.
// 5b. Support this in the Encounter Block in render.js
// 5c. Add a context menu option to add / edit these attributes in the controller.js interface. (Don't send this info to the voice app.)
// 6a. IDEA (related to #5): allow encounters to have "Turn 0" thru "Turn N" popup notes as well.
// 6b. Support in Encounter Blocks: probably display as nested entries UNDER the Run: Initiative Tracker link.
// 6c. Support in controller.js interface??  Not sure what that UI/UX would be like.
// 7. Support Day Mode.
// 8. Allow for "hidden" combatants in the controller.js side. Might need to support this on the voice app side, as advancing a turn to a hidden creature would have to be handled by probably highlighting no creature in the app.

import { VOICE_APP_PATH } from "./controller-config.js";

(async function () {
	let lastPeerId = null;
	let peer = null;
	let conn = null;
	let p2pconnected = false;
	const broadcastChannel = new BroadcastChannel("orcnog-initiative-controller-broadcast-channel");
	let recvIdInput = document.getElementById("receiver-id");
	let status = document.getElementById("status");
	let message = document.getElementById("message");
	let sendMessageBox = document.getElementById("sendMessageBox");
	let sendButton = document.getElementById("sendButton");
	let clearMsgsButton = document.getElementById("clearMsgsButton");
	let connectButton = document.getElementById("connect-button");
	let cueString = "<span class=\"cueMsg\">Cue: </span>";
	let activeAlerts = [];
	let isRowHoverEnabled = true;
	let isMicActive = false;
	let initTrackerTable;
	const hpCookieSuffix = "__hp";
	const maxhpCookieSuffix = "__hpmax";

	// Initialize with empty objects/arrays as fallbacks
	let themes = [];
	let slideshows = [];
	let musicPlaylists = [];
	let ambiencePlaylists = [];

	try {
		themes = await fetchJSON(`${VOICE_APP_PATH}/../styles/themes/themes.json`);
	} catch (error) {
		console.warn("Failed to load themes:", error);
	}

	try {
		slideshows = await fetchJSON(`${VOICE_APP_PATH}/../slideshow/slideshow-config.json`);
	} catch (error) {
		console.warn("Failed to load slideshows:", error);
	}

	try {
		musicPlaylists = await fetchJSON(`${VOICE_APP_PATH}/../audio/playlists.json`);
	} catch (error) {
		console.warn("Failed to load music playlists:", error);
	}

	try {
		ambiencePlaylists = await fetchJSON(`${VOICE_APP_PATH}/../audio/ambience.json`);
	} catch (error) {
		console.warn("Failed to load ambience playlists:", error);
	}

	/*************************************/
	/* Networking communication          */
	/*************************************/

	function initPeer2Peer () {
		peer = new Peer(null, { debug: 2 });
		peer.on("open", function (id) {
			if (peer.id === null) {
				peer.id = lastPeerId;
			} else {
				lastPeerId = peer.id;
			}
			console.log(`peer.on('open')`);
			checkForKeyAndJoin();
		});
		peer.on("connection", function (c) {
			console.log(`peer.on('connection')`);
			c.on("open", function () {
				c.send("Sender does not accept incoming connections");
				setTimeout(function () { c.close(); }, 500);
			});
		});
		peer.on("disconnected", function () {
			console.log(`peer.on('disconnected')`);
			p2pconnected = false;
			status.innerHTML = "<span class=\"red\">Connection lost. Please reconnect</span>";
			document.querySelectorAll(".control-panel").forEach(c => { c.classList.add("closed"); });
			peer.id = lastPeerId;
			peer._lastServerId = lastPeerId;
			peer.reconnect();
		});
		peer.on("close", function () {
			console.log(`peer.on('close')`);
			p2pconnected = false;
			conn = null;
			status.innerHTML = "<span class=\"red\">Connection destroyed. Please refresh</span>";
			document.querySelectorAll(".control-panel").forEach(c => { c.classList.add("closed"); });
		});
		peer.on("error", function (err) {
			p2pconnected = false;
			showAlert(`${err}`);
		});
	}

	async function signal (sigName) {
		// If mic is active, wait for it to become inactive
		if (isMicActive) {
			console.warn("Signal delayed: Waiting for microphone to become inactive...");

			await new Promise(resolve => {
				// Create a function to check mic status
				function checkMic () {
					if (!isMicActive) {
						resolve();
					} else {
						// Check again in 250ms
						setTimeout(checkMic, 250);
					}
				}
				// Start checking
				checkMic();
			});
		}

		// Create a promise to wait for a response
		return new Promise((resolve) => {
			// Store the resolve function to call later
			const handleResponse = (data) => {
				// Resolve the promise with the received data
				document.removeEventListener("initiative_tracker_ready", handleResponse);
				resolve(data);
			};

			// Add the response handler
			document.addEventListener("initiative_tracker_ready", handleResponse);

			// Now send the signal
			if (conn && conn.open) {
				conn.send(sigName);
				addMessage(cueString + (typeof sigName === "object" ? JSON.stringify(sigName) : sigName));
				console.info("Data Sent:", sigName);
			} else {
				console.error("No connection found.");
				showAlert("No connection found.");
				resolve(null); // Resolve with null if no connection
			}
		});
	}

	function join (forcedPasskey) {
		const passkey = forcedPasskey || recvIdInput.value;
		if (passkey) {
			setCookie("passkey", passkey);
			if (conn) { conn.close(); }
			conn = peer.connect(`orcnog-${passkey}`, { label: "CONTROLLER", reliable: true });

			conn.on("open", function () {
				console.log(`conn.on("open")`);
				p2pconnected = true;
				status.innerHTML = `Connected to: ${conn.peer.split("orcnog-")[1]}`;
				document.querySelectorAll(".control-panel").forEach(c => { c.classList.remove("closed"); });
				// Send ready broadcast to other tabs/windows immediately
				broadcastChannel.postMessage({
					type: "controller_ready",
					timestamp: Date.now(),
				});
			});

			conn.on("data", async (data) => {
				console.log(`conn.on("data")`, data);
				// Check for error message
				if (data?.error === "CONTROLLER_ALREADY_CONNECTED") {
					p2pconnected = false;
					status.innerHTML = "<span class=\"red\">Connection rejected: Another controller is already connected</span>";
					showAlert("Connection Error", "Another controller is already connected to this session.");
					conn.duplicateControllerError = true;
					return;
				}

				// Handle normal data
				if (typeof data === "object" && "controllerData" in data) {
					await handleDataObject(data.controllerData);
					// addMessage(`<span class="peerMsg">Received:</span> ${JSON.stringify(data)}`);
					console.info("Peer Data Recieved: ", data.controllerData);
				} else {
					addMessage(`<span class="peerMsg">Peer said:</span> ${data}`);
				}
			});

			conn.on("close", function () {
				console.log(`"conn.on("close")`);
				p2pconnected = false;
				// Only show generic close message if it wasn't a duplicate controller error
				if (!conn.duplicateControllerError) {
					status.innerHTML = "<span class=\"red\">Connection closed</span>";
				}
				document.querySelectorAll(".control-panel").forEach(c => { c.classList.add("closed"); });
			});
		}
	}

	function checkForKeyAndJoin () {
		let passkey;

		if (!p2pconnected) {
			// Get the current URL search parameters
			const urlParams = new URLSearchParams(window.location.search);

			// Check if the 'key' parameter exists
			if (urlParams.has("key")) {
				// Get the value of the 'key' parameter
				const qsKeyVal = urlParams.get("key");
				passkey = qsKeyVal;
				// Call the join function with the value
				join(passkey);
			}
		}
		if (!passkey) passkey = getCookie("passkey");
		if (passkey) recvIdInput.value = passkey;

		recvIdInput.focus();
	}

	function initTab2Tab () {
		broadcastChannel.onmessage = async (event) => {
			console.log("Message from other tab:", event.data);

			if (p2pconnected) {
				// Send acknowledgment immediately
				broadcastChannel.postMessage({
					type: "controller_ack",
					timestamp: event.data.timestamp,
					status: "ready",
				});

				if (event?.data?.hasOwnProperty("new_initiative_board")) {
					const newInitObj = event.data.new_initiative_board;
					const result = await getEncounterLoadOptions(newInitObj?.players);
					if (!result) return; // User cancelled
					// Or, handle the result...
					if (result.action === "clearAll") clearAll();
					else if (result.action === "clearMonsters") clearMonsters();

					// Create the grouped initiatives map outside the loop
					const groupedInits = new Map();

					// Process players sequentially
					for (const player of newInitObj?.players || []) {
						let playerId;
						// Use the options
						if (result.rollInitiative) {
							if (result.groupCreatures) {
								// Roll grouped initiatives - only roll once per creature type
								let init = groupedInits.get(player.name);
								if (init === undefined) {
									init = await calculateNewInit(player, 3);
									groupedInits.set(player.name, init);
									console.log(`Rolling new initiative ${init} for ${player.name}`);
								} else {
									console.log(`Using existing initiative ${init} for ${player.name}`);
								}
								player.initiative = init;
							} else {
								// Roll individual initiatives
								player.initiative = await calculateNewInit(player, 3);
							}
						}

						if (result.rollHp) {
							// Only generate ID if we're rolling HP
							playerId = generatePlayerID();
							const mon = await get5etMonsterByHash(player.hash);
							const newHp = await calculateNewHp(mon, 3); // Roll random HP
							// Store HP in cookies immediately using the generated ID
							setCookie(`${playerId}${hpCookieSuffix}`, newHp);
							setCookie(`${playerId}${maxhpCookieSuffix}`, newHp);
						}

						const playerObjToAdd = getPlayerObjFromMon({
							name: player.name,
							order: player.initiative || 0,
							hash: player.hash,
							mon: player,
							...(playerId && { id: playerId }), // Only include ID if it was generated
						});
						// Add the player
						// Wait for the signal to complete before continuing
						try {
							// console.debug(`Sending add_player signal:`, playerObjToAdd);
							await signal({ "add_player": playerObjToAdd }).then(() => {
								// console.debug(`---response received`);
							});
						} catch (error) {
							console.error(`Error adding player ${player.name}:`, error);
							continue;
						}
					}

					console.debug("activating row");
					const activeRow = document.querySelector(".initiative-tracker tr.active");
					if (activeRow) {
						displayStatblock(activeRow.dataset.name, activeRow.dataset.id, activeRow.dataset.hash);
						highlightRow(activeRow);
					}
				}
			} else {
				// Send "exists but not connected" acknowledgment
				broadcastChannel.postMessage({
					type: "controller_ack",
					timestamp: event.data.timestamp,
					status: "waiting",
				});
			}
		};
	}

	/*************************************/
	/* DOM Initial Population            */
	/*************************************/

	// Function to populate theme selectbox with received data
	function populateThemesData (themes) {
		const selectElement = document.getElementById("updateTheme");
		selectElement.innerHTML = ""; // empty it out first
		themes?.forEach(theme => {
			const option = document.createElement("option");
			option.value = theme.name;
			option.textContent = theme.name;
			option.setAttribute("data-image", theme.img);
			selectElement.appendChild(option);
		});
	}

	// Function to populate slideshows selectbox with received data
	function populateSlideshowsData (slideshows) {
		const selectElement = document.getElementById("updateSlideshowContext");
		selectElement.innerHTML = ""; // empty it out first

		// Insert a blank option into the slideshows object
		slideshows = { "": { id: "", name: "None" }, ...slideshows };

		for (const [id, config] of Object.entries(slideshows)) {
			const option = document.createElement("option");
			option.value = id;
			option.textContent = config.name;
			selectElement.appendChild(option);
		}
	}

	// Function to populate playlist data
	function populatePlaylistData (playlist, elemId) {
		const selectElement = document.getElementById(elemId);
		selectElement.innerHTML = ""; // empty it out first

		// Insert a blank option into the playlist object
		playlist = { "": [], ...playlist };

		for (const [id] of Object.entries(playlist)) {
			const option = document.createElement("option");
			option.value = id;
			const name = !id ? "None" : id.replace(/^dnd_/, "D&D ").replace(/^sw_/, "Starwars ").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
			option.textContent = name;
			selectElement.appendChild(option);
		}
	}

	function populateTrackData (playlistId, musicOrAmbience) {
		// Find the selected playlist based on the playlistId
		const selectedPlaylist = musicOrAmbience === "ambience" ? ambiencePlaylists[playlistId] : musicPlaylists[playlistId]; // Access the playlist based on its ID (e.g., 'dnd_calm')

		// Clear the current select options
		const selectElement = document.getElementById(`update_${musicOrAmbience}_track`);
		selectElement.innerHTML = ""; // Clear existing options

		// If the playlist is found and contains tracks, loop through them
		if (selectedPlaylist) {
			let i = 0;
			selectedPlaylist.forEach(trackPath => {
				// Extract the file name and format it using the replacements
				const title = trackPath
					.split("/").pop() // Get the file name
					.replace(/\.[^/.]+$/, "") // Remove file extension
					.replace(/_s_/g, "'s ")
					.replace(/_m_/g, "'m ")
					.replace(/_t_/g, "'t ")
					.replace(/_d_/g, "'d ")
					.replace(/_/g, " "); // Replace underscores with spaces

				// Create a new option element for the select dropdown
				const optionElement = document.createElement("option");
				optionElement.value = i; // Set the value to the track number (starting at 0)
				optionElement.textContent = title; // Set the displayed text to the formatted title

				// Append the option to the select element
				selectElement.appendChild(optionElement);
				i++;
			});
		}
	}

	async function createRadioButtons (containerId, groupName, currentSlideshow) {
		if (typeof currentSlideshow === "undefined") return false;
		const container = document.getElementById(containerId);
		const totalSlides = currentSlideshow?.scenes?.length || 0;
		container.innerHTML = ""; // Clear previous radio buttons

		for (let i = 1; i <= totalSlides; i++) {
			const radioInput = document.createElement("input");
			radioInput.type = "radio";
			radioInput.id = `${groupName}_${i}`;
			radioInput.name = groupName;
			radioInput.value = i;

			// Add the click event listener to the radio input
			radioInput.onclick = function (event) {
				signal(`${containerId}:${event.target.value}`);
			};

			const radioLabel = document.createElement("label");
			radioLabel.htmlFor = radioInput.id;
			radioLabel.textContent = i;
			radioLabel.classList.add("radio-button");

			// Check if the currentSlideshow contains images, and set the background-image
			if (currentSlideshow.scenes[i - 1]) {
				const config = currentSlideshow.scenes[i - 1];
				let imageUrl;
				const fromTop = config.focalPointDistanceFromTop ?? "50%";
				const fromLeft = config.focalPointDistanceFromLeft ?? "50%";
				let title;
				if (config.image) {
					imageUrl = `${VOICE_APP_PATH}../${config.image}`;
				} else if (config.url) {
					const url = config.url;
					const response = await fetch(`../${url}`);
					const htmlString = await response.text(); // Get HTML as text

					// Create a temporary DOM element to parse the HTML string
					const tempDiv = document.createElement("div");
					tempDiv.innerHTML = htmlString;

					// Check if there is an <img> tag in the parsed HTML
					if (tempDiv.querySelector(".slideshow-content img")) {
						imageUrl = `${VOICE_APP_PATH}../${tempDiv.querySelector("img").getAttribute("src")}`;
						console.log("Image URL:", imageUrl);
					}
				}
				if (config.caption) {
					title = config.caption;
					if (config.subcap) {
						title += `\n${config.subcap}`;
					}
				}
				radioLabel.style.backgroundImage = `url("${imageUrl}")`;
				radioLabel.style.backgroundSize = "cover";
				radioLabel.style.backgroundPosition = `${fromLeft} ${fromTop}`;
				if (title) radioLabel.title = title;
			}

			container.appendChild(radioInput);
			container.appendChild(radioLabel);
		}
	}

	async function handleDataObject (data) {
		const obj = data;

		if (obj.hasOwnProperty("debug")) console.log(obj.debug);
		if (obj.hasOwnProperty("hotMic")) handleMicData(obj);
		if (obj.hasOwnProperty("currentTheme")) handleCurrentThemeData(obj);
		if (obj.hasOwnProperty("currentSlideshow")) await handleCurrentSlideshowData(obj);
		if (obj.hasOwnProperty("currentSlideshowId")) handleCurrentSlideshowIdData(obj);
		if (obj.hasOwnProperty("currentSlideNum") && typeof obj.currentSlideNum === "number") handleCurrentSlideNumData(obj);
		if (obj.hasOwnProperty("initiativeActive") && obj.initiativeActive === true) handleInitiativeActiveData();
		if (obj.hasOwnProperty("currentAppScale")) handleCurrentAppScaleData(obj);
		if (obj.hasOwnProperty("currentFontSize")) handleCurrentFontSizeData(obj);
		if (obj.hasOwnProperty("currentCombatPlaylist")) handleCurrentCombatPlaylistData(obj);
		if (obj.hasOwnProperty("currentMusicPlaylist")) handleCurrentMusicPlaylistData(obj);
		if (obj.hasOwnProperty("currentMusicTrack")) handleCurrentMusicTrackData(obj);
		if (obj.hasOwnProperty("currentMusicVolume")) handleCurrentMusicVolumeData(obj);
		if (obj.hasOwnProperty("musicWillFade")) handleWillFadeData(obj, "music");
		if (obj.hasOwnProperty("musicIsPlaying")) handleMusicIsPlayingData(obj.musicIsPlaying);
		if (obj.hasOwnProperty("musicIsLooping")) handleMusicIsLoopingData(obj.musicIsLooping);
		if (obj.hasOwnProperty("musicIsShuffling")) handleMusicIsShufflingData(obj.musicIsShuffling);
		if (obj.hasOwnProperty("ambienceIsPlaying")) handleAmbienceIsPlayingData(obj.ambienceIsPlaying);
		if (obj.hasOwnProperty("currentAmbienceVolume")) handleCurrentAmbienceVolumeData(obj);
		if (obj.hasOwnProperty("ambienceWillFade")) handleWillFadeData(obj, "ambience");
		if (obj.hasOwnProperty("currentAmbiencePlaylist")) handleCurrentAmbiencePlaylistData(obj);
		if (obj.hasOwnProperty("currentAmbienceTrack")) handleCurrentAmbienceTrackData(obj);
		if (obj.hasOwnProperty("currentPlayers")) await handleCurrentPlayersData(obj);
		if (obj.hasOwnProperty("currentRound")) handleCurrentRoundData(obj);
		if (obj.hasOwnProperty("currentTurn")) handleCurrentTurnData(obj);
	}

	/*************************************/
	/* Handle data objects               */
	/*************************************/

	// Function to handle hotMic data
	function handleMicData (obj) {
		const isHotMic = obj.hotMic === true;
		if (isHotMic) {
			document.getElementById("mic_status").classList.add("hot");
			updateMicStatus(true);
		} else {
			document.getElementById("mic_status").classList.remove("hot");
			updateMicStatus(false);
		}
	}

	// Function to handle currentTheme data
	function handleCurrentThemeData (obj) {
		document.getElementById("updateTheme").value = obj.currentTheme;
		const themeImage = document.getElementById("updateTheme")?.selectedOptions?.[0]?.getAttribute("data-image");
		if (themeImage) document.getElementById("back_to_initiative").style.backgroundImage = `url("${VOICE_APP_PATH}${themeImage}")`;
	}

	// Function to handle currentSlideshow data and create radio buttons
	async function handleCurrentSlideshowData (obj) {
		await createRadioButtons("go_to_slide", "goToSlideGroup", obj.currentSlideshow);
	}

	// Function to handle currentSlideshowId data
	function handleCurrentSlideshowIdData (obj) {
		const id = obj.currentSlideshowId;
		document.getElementById("updateSlideshowContext").value = id;
		document.getElementById("slideshow_slide_buttons").style.display = id ? "block" : "none";
	}

	// Function to handle currentSlideNum data
	function handleCurrentSlideNumData (obj) {
		const radioToCheck = document.querySelector(`input[name="goToSlideGroup"][value="${obj.currentSlideNum}"]`);

		if (radioToCheck) {
			radioToCheck.checked = true;
		}

		if (obj.currentSlideNum > 0) {
			document.getElementById("back_to_initiative").classList.remove("active");
			document.getElementById("go_to_slide").classList.add("active");
		}
	}

	// Function to handle initiativeActive data
	function handleInitiativeActiveData () {
		document.getElementById("back_to_initiative").classList.add("active");
		document.getElementById("go_to_slide").classList.remove("active");
	}

	// Function to handle currentPlayers data and populate the table
	async function handleCurrentPlayersData (obj) {
		const players = obj.currentPlayers;

		initTrackerTable = document.getElementById("initiative_order").querySelector("tbody");

		// Clear the table before inserting new rows
		initTrackerTable.innerHTML = "";

		// Loop through each player and create a row
		for (const player of players) {
			// Create a table row for each combatant
			const row = await createPlayerRow(player);
			// Append the row to the table
			initTrackerTable.appendChild(row);
		}
		const event = new Event("initiative_tracker_ready");
		document.dispatchEvent(event);
	}

	function handleCurrentRoundData (obj) {
		document.getElementById("round_tracker").textContent = Number(obj.currentRound);
	}

	function handleCurrentTurnData (obj) {
		const turnNum = Number(obj.currentTurn);
		const table = document.getElementById("initiative_order").querySelector("tbody");
		table.querySelector("tr.active")?.classList.remove("active");
		const playerRow = table.querySelector(`tr:nth-of-type(${turnNum})`);
		playerRow?.classList.add("active");
	}

	function handleCurrentMusicVolumeData (obj) {
		const newVol = Number(obj.currentMusicVolume);
		if (typeof newVol === "number") document.getElementById("volume_music").value = newVol * 100;
	}

	let fadeInterval;
	function handleWillFadeData (obj, musicOrAmbience) {
		const { start, finish, duration, id } = obj[`${musicOrAmbience}WillFade`];

		if (typeof start === "number" && typeof finish === "number" && typeof duration === "number") {
			const startTime = Date.now(); // Record the start time

			// Calculate the change in volume per interval (assuming fade is linear)
			const fadeStep = (finish - start) / (duration / 250); // Change per 250ms

			let currentVolume = start;

			fadeInterval = setInterval(() => {
				const elapsedTime = Date.now() - startTime;
				currentVolume += fadeStep;

				// Update the volume slider or volume display
				document.getElementById(`volume_${musicOrAmbience}`).value = currentVolume * 100;
				document.getElementById(`volume_${musicOrAmbience}`).disabled = true;

				// Check if the duration has been reached
				if (elapsedTime >= duration) finishFade();
			}, 250);

			// Ensure the interval clears after the specified duration
			setTimeout(finishFade, duration);
		}
		function finishFade () {
			clearInterval(fadeInterval); // Stop the interval
			document.getElementById(`volume_${musicOrAmbience}`).value = finish * 100; // Ensure it ends at the target volume
			document.getElementById(`volume_${musicOrAmbience}`).disabled = false;
		}
	}

	function handleCurrentAppScaleData (obj) {
		document.getElementById("update_app_scale").value = obj.currentAppScale;
	}

	function handleCurrentFontSizeData (obj) {
		document.getElementById("update_font_size").value = obj.currentFontSize;
	}

	function handleCurrentCombatPlaylistData (obj) {
		document.getElementById("update_combat_playlist").value = obj.currentCombatPlaylist;
	}

	function handleCurrentMusicPlaylistData (obj) {
		document.getElementById("update_music_playlist").value = obj.currentMusicPlaylist;
		populateTrackData(obj.currentMusicPlaylist, "music");
	}

	function handleCurrentMusicTrackData (obj) {
		document.getElementById("update_music_track").value = obj.currentMusicTrack;
	}

	function handleMusicIsPlayingData (isPlaying) {
		if (isPlaying) document.querySelector(".music-player").classList.add("playing");
		else document.querySelector(".music-player").classList.remove("playing");
	}

	function handleMusicIsLoopingData (isLooping) {
		if (isLooping) document.querySelector(".music-player").classList.add("looping");
		else document.querySelector(".music-player").classList.remove("looping");
	}

	function handleMusicIsShufflingData (isShuffling) {
		if (isShuffling) document.querySelector(".music-player").classList.add("shuffling");
		else document.querySelector(".music-player").classList.remove("shuffling");
	}

	function handleAmbienceIsPlayingData (isPlaying) {
		if (isPlaying) document.querySelector(".ambience-player").classList.add("playing");
		else document.querySelector(".ambience-player").classList.remove("playing");
	}

	function handleCurrentAmbienceVolumeData (obj) {
		const newVol = Number(obj.currentAmbienceVolume);
		if (typeof newVol === "number") document.getElementById("volume_ambience").value = newVol * 100;
	}

	function handleCurrentAmbiencePlaylistData (obj) {
		document.getElementById("update_ambience_playlist").value = obj.currentAmbiencePlaylist;
		populateTrackData(obj.currentAmbiencePlaylist, "ambience");
	}

	function handleCurrentAmbienceTrackData (obj) {
		document.getElementById("update_ambience_track").value = obj.currentAmbienceTrack;
	}

	/*************************************/
	/* Create player rows                */
	/*************************************/

	async function createPlayerRow (player) {
		const row = document.createElement("tr");

		// UrlUtil.autoEncodeHash(mon)

		// add data-attributes for each of the following, if they exist in the incoming player obj
		["id", "name", "spoken", "fromapp", "hash", "isNpc", "scaledCr"].forEach(prop => {
			if (player[prop] != null) row.dataset[prop] = player[prop];
		});
		row.dataset.order = Number(player.order); // ensure order is a number

		if (player.bloodied) row.classList.add("bloodied");
		if (player.dead) row.classList.add("dead");

		// Create and append the "order" cell
		const orderCell = document.createElement("td");
		const orderInput = document.createElement("input");
		orderInput.type = "text";
		orderInput.value = Number(player.order);
		orderInput.className = "player-order";
		orderInput.addEventListener("focus", () => { orderInput.select(); });
		orderInput.addEventListener("change", () => { signal(`update_player:{"id":"${player.id}","order":${Number(orderInput.value)}}`); });
		orderCell.addEventListener("click", async (e) => {
			e.preventDefault();
			if (player.hash) {
				const userSelection = await popoverChooseRollableValue(orderInput, "Initiative");
				if (userSelection !== null) {
					if (userSelection === 3) {
						const rollAnimationMinMax = {min: await calculateNewInit(mon, 2), max: await calculateNewInit(mon, 1)};
						const newInit = await calculateNewInit(mon, 3);
						animateNumber(orderInput, newInit, rollAnimationMinMax).then(() => {
							signal(`update_player:{"id":"${player.id}","order":${Number(newInit)}}`).then(() => {
								popoverApplyInitiativeToAll(orderInput, newInit, true);
							});
						});
					} else {
						const newInit = await calculateNewInit(mon, userSelection);
						signal(`update_player:{"id":"${player.id}","order":${Number(newInit)}}`).then(() => {
							popoverApplyInitiativeToAll(orderInput, newInit, true);
						});
					}
				}
			}
		});
		orderCell.appendChild(orderInput);
		row.appendChild(orderCell);

		// Create and append the "name" cell
		const nameCell = document.createElement("td");
		const nameInput = document.createElement("input");
		nameInput.type = "text";
		nameInput.value = player.name;
		nameInput.className = "player-name";

		// Set the width based on the character count plus a small buffer
		function adjustInputWidth (input) {
			input.style.width = `${Math.max(input.value.length, 1) + 2}ch`;
		}

		nameInput.addEventListener("click", (e) => { if (e.button === 0) nameInput.focus(); });
		nameInput.addEventListener("focus", () => { nameInput.select(); });
		nameInput.addEventListener("change", () => {
			adjustInputWidth(nameInput);
			signal(`update_player:{"id":"${player.id}","name":"${nameInput.value}"}`);
		});

		adjustInputWidth(nameInput); // Adjust the width on initial load
		nameCell.appendChild(nameInput); // Append the input to the table cell and the cell to the row
		row.appendChild(nameCell);

		// Create and append the "statblock-lock-status" cell
		const lockCell = document.createElement("td");
		const lockSpan = document.createElement("span");
		lockSpan.classList.add("statblock-lock-status");
		lockCell.appendChild(lockSpan);
		row.appendChild(lockCell);

		const mon = await get5etMonsterByHash(player.hash, player.scaledCr);

		// For creatures with statblocks...
		if (mon) {
			// Identify the row as having a statblock
			row.classList.add("has-statblock");

			// Create the hp and maxhp cells and inputs
			const hpCell = document.createElement("td");
			const hpInput = document.createElement("input");
			const maxhpCell = document.createElement("td");
			const maxhpInput = document.createElement("input");

			// HP cell
			let hp = getCookie(`${player.id}${hpCookieSuffix}`);
			if (!hp || hp === "null" || hp === "undefined") {
				hp = await calculateNewHp(mon, 0);
			}
			hpInput.type = "text";
			hpInput.setAttribute("pattern", "[\\+\\-]?\\d+");
			hpInput.className = "player-hp";
			hpInput.addEventListener("focus", handleHpFocus);
			hpInput.addEventListener("change", handleHpChange);
			hpInput.addEventListener("keydown", handleHpKeydown);
			hpInput.addEventListener("value_update", (e) => {
				// final rendered value after custom event handling
				handleHpValuesUpdate(hpInput, maxhpInput);
			});
			hpCell.addEventListener("click", () => { hpInput.select(); });
			hpInput.dataset.cookie = hpCookieSuffix;
			setPlayerHp(hpInput, player.id, hp, hpCookieSuffix);

			// Max HP cell
			let maxhp = getCookie(`${player.id}${maxhpCookieSuffix}`);
			if (!maxhp || maxhp === "null" || maxhp === "undefined") {
				maxhp = await calculateNewHp(mon, 0);
			}
			maxhpCell.className = "td-player-maxhp";
			maxhpInput.type = "text";
			maxhpInput.setAttribute("pattern", "[\\+\\-]?\\d+");
			maxhpInput.className = "player-maxhp";
			maxhpInput.dataset.cookie = maxhpCookieSuffix;
			maxhpInput.addEventListener("focus", handleHpFocus);
			maxhpInput.addEventListener("change", handleHpChange);
			maxhpInput.addEventListener("keydown", handleHpKeydown);
			maxhpInput.addEventListener("value_update", (e) => {
				handleHpValuesUpdate(hpInput, maxhpInput);
			});
			maxhpInput.addEventListener("click", async (e) => {
				e.preventDefault();
				await popoverChooseHpValue(maxhpInput, mon, player.id, false);
			});
			setPlayerHp(maxhpInput, player.id, maxhp, maxhpCookieSuffix);

			// Append hp, then maxhp to the table row
			hpCell.appendChild(hpInput);
			row.appendChild(hpCell);
			maxhpCell.appendChild(maxhpInput);
			row.appendChild(maxhpCell);
		} else {
			// add an "assign monster" btn that spans 2 cells
			row.appendChild(document.createElement("td")); // blank td
			const td = document.createElement("td");
			const span = document.createElement("span");
			span.className = "player-assign-btn assign-a-monster";
			td.appendChild(span);
			row.appendChild(td);
		}

		// Create and append the "badge" cell (if it exists)
		const badgeCell = document.createElement("td");
		const badgeInput = document.createElement("input");
		badgeInput.type = "text";
		badgeInput.className = "player-badge";
		if (player.dead) {
			badgeInput.value = "Dead";
		} else if (player.bloodied) {
			badgeInput.value = "Bloodied";
		} else {
			badgeInput.value = "Healthy";
		}
		badgeInput.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.target.blur(); // prevent cursor from flashing visibily inside the text field
		});
		badgeInput.addEventListener("click", (e) => {
			e.preventDefault();
			if (player.dead) {
				signal(`update_player:{"id":"${player.id}","dead":false,"bloodied":false}`); // cycle back to healthy
			} else if (player.bloodied) {
				signal(`update_player:{"id":"${player.id}","dead":true,"bloodied":false}`); // from bloodied to dead
			} else {
				signal(`update_player:{"id":"${player.id}","dead":false,"bloodied":true}`); // from healthy to bloodied
			}
		});
		badgeCell.appendChild(badgeInput);
		row.appendChild(badgeCell);

		const showStatblockOnEvent = (e) => {
			const tr = e.target.closest("tr");
			const { name, id, hash, scaledCr } = tr.dataset;
			displayStatblock(name, id, hash, scaledCr);
			highlightRow(tr);
		};

		// If it's a monster, add the statblock display on hover
		row.addEventListener("mouseover", (e) => {
			// If hover is enabled, show the statblock
			if (isRowHoverEnabled && "hash" in row.dataset) {
				showStatblockOnEvent(e);

				// Bind the keydown event to the document
				const keydownHandler = (event) => {
					if (event.shiftKey) {
						isRowHoverEnabled = false; // Disable hover on Shift key press
						document.removeEventListener("keydown", keydownHandler); // Unbind the keydown event
					}
				};

				// Add the keydown event listener to the document
				document.addEventListener("keydown", keydownHandler);
			}
		});

		initTrackerTable.addEventListener("mouseleave", (e) => {
			if (!initTrackerTable.contains(e.relatedTarget)) {
				if (!document.querySelector(".statblock-lock-status.locked")) {
					isRowHoverEnabled = true;
				}
			}
		});

		row.addEventListener("click", (e) => {
			if (e.target.tagName === "INPUT" || !("hash" in row.dataset)) return;
			showStatblockOnEvent(e);

			// Get the clicked row's statblock-lock-status
			const statBlockLockCell = e.target?.closest("tr")?.querySelector(".statblock-lock-status");

			if (statBlockLockCell) {
				// Check if the row is currently locked
				if (statBlockLockCell.classList.contains("locked")) {
					// If locked, remove the class and enable row hover
					statBlockLockCell.classList.remove("locked");
					isRowHoverEnabled = true;
				} else {
					// If not locked, add the class and disable row hover
					document.querySelectorAll(".statblock-lock-status.locked").forEach((c) => c.classList.remove("locked"));
					statBlockLockCell.classList.add("locked");
					isRowHoverEnabled = false;
				}
			}
		});

		// Add a dragover event handler to allow dropping
		row.addEventListener("dragover", (evt) => {
			evt.preventDefault(); // Prevent default to allow drop
			evt.stopPropagation(); // Stop the event from bubbling up

			// Calculate if we're in the top or bottom half of the row
			const rect = row.getBoundingClientRect();
			const isInsertBelow = evt.clientY > rect.bottom - 7;

			// Only allow drop-below if this is the last row of its initiative group
			if (isInsertBelow && !isLastOfInitiativeGroup(row)) {
				row.classList.remove("drop-below", "drop-highlight");
				return;
			}

			// Update visual indicator
			row.classList.toggle("drop-below", isInsertBelow);
			row.classList.toggle("drop-highlight", !isInsertBelow);
		});
		row.addEventListener("dragenter", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
		});
		row.addEventListener("dragleave", (evt) => {
			if (row.contains(evt.relatedTarget)) return;
			row.classList.remove("drop-below", "drop-highlight");
		});
		// Add a drop event handler to the row
		row.addEventListener("drop", async (evt) => {
			evt.preventDefault(); // Prevent default behavior
			evt.stopPropagation(); // Stop the event from bubbling up

			// Clean up indicators
			row.classList.remove("drop-below", "drop-highlight");

			// Get drop position
			const rect = row.getBoundingClientRect();
			const isInsertBelow = evt.clientY > rect.bottom - 7;

			// Log the dataTransfer object to see what is received
			const hash = evt.dataTransfer.getData("text/plain").split("#")?.[1];

			if (isInsertBelow) {
				// Insert new monster below
				const newMonsterName = getMonsterNameFromHash(hash);
				const newPlayerOrder = Number(row.dataset.order);
				addNewPlayer(newMonsterName, newPlayerOrder, hash);
			} else {
				await assignMonsterToRow(row, hash);
			}
		});

		return row;
	}

	/*************************************/
	/* Misc functions                    */
	/*************************************/

	function isLastOfInitiativeGroup (row) {
		const currentOrder = row.querySelector(".player-order").value;
		const nextRow = row.nextElementSibling;

		// If there's no next row, or the next row has a different order, this is the last of its group
		return !nextRow || nextRow.querySelector(".player-order").value !== currentOrder;
	}

	function updateMicStatus (isActive) {
		isMicActive = isActive;
		// Update the visual indicator
		const micStatus = document.getElementById("mic_status");
		if (isActive) {
			micStatus?.classList.add("active");
		} else {
			micStatus?.classList.remove("active");
		}
	}

	async function openOmnibox (value) {
		return new Promise(resolve => {
			// Set value and focus
			const input = document.querySelector(".omni__input");
			input.value = value;
			input.focus();

			// Show the output wrapper
			document.querySelector(".omni__wrp-output")?.classList.remove("ve-hidden");

			// Try to open search results div immediately
			Omnisearch._pHandleClickSubmit();

			// If it doesn't open immediately, wait for the TYPE_TIMEOUT_MS duration before triggering search
			setTimeout(async () => {
				if (document.querySelector(".omni__wrp-output").classList.contains("ve-hidden")) {
					await Omnisearch._pHandleClickSubmit();
				}
				resolve();
			}, Omnisearch._TYPE_TIMEOUT_MS);
		});
	}

	function closeOmnibox () {
		// Clear and blur the input
		document.querySelector(".omni__input").value = "";
		document.querySelector(".omni__input").blur();

		// Hide the output
		document.querySelector(".omni__wrp-output").classList.add("ve-hidden");
	}

	async function selectMonsterFromOmnibox (row) {
		const dismissedNotice = getCookie("assign_monster_notice_dismissed") === "true";
		if (!dismissedNotice) {
			if (await InputUiUtil.pGetUserBoolean({title: "How to Assign a Creature", htmlDescription: `<ol><li>Search for a creature in the global search box.</li><li>Drag and drop that creature's name onto a combatant name in the initiative tracker.</li></ol>`, textYes: "Do not show this again", textNo: "Okay"})) {
				setCookie("assign_monster_notice_dismissed", "true");
			}
		}
		if (row) {
			row.classList.add("soft-select-highlight");
		}
		await openOmnibox("in:bestiary ");
		if (row) {
			const assignClickedMonsterToRow = (e) => {
				if (e.target.tagName === "A" && e.target.dataset.vetPage === "bestiary.html") {
					e.preventDefault();
					e.stopImmediatePropagation();
					const hash = e.target.dataset.vetHash;
					assignMonsterToRow(row, hash)
						.catch(err => console.error("Error assigning monster:", err))
						.finally(() => {
						// Clean up event listener and css after assignment completes
							document.querySelector(`.omni__output`).removeEventListener("click", assignClickedMonsterToRow);
							row.classList.remove("soft-select-highlight");
						});
				}
			};
			document.querySelector(`.omni__output`).addEventListener("click", assignClickedMonsterToRow);
		}
	}

	function addMessage (msg) {
		let now = new Date();
		let h = now.getHours();
		let m = addZero(now.getMinutes());
		let s = addZero(now.getSeconds());
		if (h > 12) h -= 12; else if (h === 0) h = 12;
		function addZero (t) { if (t < 10) t = `0${t}`; return t; }
		message.innerHTML = `${message.innerHTML}<span class="msg-time">${h}:${m}:${s}</span> - ${msg}<br/>`;
		message.scrollTo({
			top: message.scrollHeight,
			behavior: "smooth",
		});
	}

	function clearMessages () {
		message.innerHTML = "";
		addMessage("Msgs cleared");
	}

	async function fetchJSON (url) {
		const response = await fetch(url);
		return response.json();
	}

	function getDataOrNull (value) {
		return (value === undefined || value === null || value === "null" || value === "undefined" || value === "") ? null : value;
	}

	function generatePlayerID () {
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const idLength = 6;
		let newID;

		const playerRows = document.querySelectorAll("[data-playerid]");
		const ids = Array.from(playerRows).map(p => p.dataset.playerid); // Extract all existing player IDs

		do {
			newID = "";
			for (let i = 0; i < idLength; i++) {
				newID += characters.charAt(Math.floor(Math.random() * characters.length));
			}
		} while (ids.includes(newID)); // Keep generating until a unique ID is found

		return newID;
	}

	function highlightRow (tr, clazz = "statblock") {
		if (tr?.parentNode?.children) {
			[...tr.parentNode.children].forEach(sibling => sibling !== tr && sibling?.classList?.remove(`${clazz}-highlight`));
			tr.classList?.add(`${clazz}-highlight`);
		}
	}

	function getMonsterNameFromHash (hash) {
		if (!hash) return null;
		const namePart = hash.split("_")[0];
		const lowercaseName = decodeURIComponent(namePart).replace(/%20/g, " ");
		const sentenceCaseName = lowercaseName.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
		return sentenceCaseName;
	}

	async function get5etMonsterByHash (hash, scaledCr) {
		if (!hash) return;
		const baseMon = await DataLoader.pCacheAndGetHash(UrlUtil.PG_BESTIARY, hash);
		// If it's a scaled CR, grab the scaled version from cache, otherwise, use the base version
		const mon = (scaledCr !== undefined && scaledCr !== null && scaledCr !== "null") ? await ScaleCreature.scale(baseMon, scaledCr) : baseMon;
		return mon;
	}

	async function displayStatblock (name, id, hash, scaledCr) {
		name = getDataOrNull(name);
		id = getDataOrNull(id);
		hash = getDataOrNull(hash);
		scaledCr = getDataOrNull(scaledCr);

		// If it's got hash, it's a... it's a MONSTER!! (or npc with a statblock)!!
		if (id && hash) {
			// Add a statblock display on mouseover
			const mon = await get5etMonsterByHash(hash, scaledCr);
			const statblock = Renderer.hover.$getHoverContent_stats(UrlUtil.PG_BESTIARY, mon);
			const scrollTop = window.scrollY;
			$("#initiative-statblock-display").html("").append(statblock);
			$("#initiative-statblock-display").off("cr_update").on("cr_update", (e, scaledMon) => {
				const cr = Parser?.crToNumber(scaledMon?.cr);
				signal(`update_player:{"id":"${id}","scaledCr":"${cr}"}`).then(() => {
					postProcessStatblockTitle(name, scaledMon);
					const maxHpField = document.querySelector(`[data-id="${id}"] .player-maxhp`);
					popoverChooseHpValue(maxHpField, scaledMon, id, true);
				});
			});
			$("#initiative-statblock-display").off("cr_reset").on("cr_reset", (e, resetMon) => {
				signal(`update_player:{"id":"${id}","scaledCr":null}`).then(() => {
					postProcessStatblockTitle(name, resetMon);
					const maxHpField = document.querySelector(`[data-id="${id}"] .player-maxhp`);
					popoverChooseHpValue(maxHpField, resetMon, id, true);
				});
			});
			postProcessStatblockTitle(name, mon);
			window.scrollTo(0, scrollTop);
		} else {
			const $btnAddMonster = $(`<button class="assign-a-monster" title="Assign a creature...">Assign a creature...</button>`);
			$("#initiative-statblock-display").html("").append($btnAddMonster);
		}
	}

	function postProcessStatblockTitle (name, mon) {
		// Update display name, if name was provided.
		if (name && name !== mon.name) document.getElementById("initiative-statblock-display").querySelector("h1").textContent = `${name} [${mon._displayName || mon.name}]`;
	}

	function renamePlayer (row) {
		row.querySelector(".player-name").focus();
	}

	async function assignMonsterToRow (row, hash) {
		// Update row's hash
		row.dataset.hash = hash;

		// Get player data from row
		const player = {
			name: row.dataset.name,
			id: row.dataset.id,
			order: row.querySelector(".player-order").value,
			hadStats: row.classList.contains("has-statblock"),
		};

		// Get monster data and create player object
		const dmon = await get5etMonsterByHash(hash);
		const playerObjToUpdate = getPlayerObjFromMon({
			name: player.name,
			id: player.id,
			order: Number(player.order),
			hash: hash,
			mon: dmon,
		});

		// Uncomment to clear max HP before sending the new updated player signal
		// removeCookie(`${player.id}${maxhpCookieSuffix}`);

		// Send the new updated player signal
		signal(`update_player:${JSON.stringify(playerObjToUpdate)}`).then(() => {
			if (player.hadStats) {
				const maxHpField = document.querySelector(`[data-id="${player.id}"] .player-maxhp`);
				popoverChooseHpValue(maxHpField, dmon, player.id, true);
			}
			// Close omnibox and update display
			closeOmnibox();
			displayStatblock(player.name, player.id, hash);
			highlightRow(row);
		});
	}

	async function removeMonsterAssignment (row) {
		signal(`update_player:{"id":"${row.dataset.id}","hash":null}`);
	}

	async function resetHpToAverage (row) {
		// Get the monster data from the row
		const hash = row.dataset.hash;
		const id = row.dataset.id;
		const scaledCr = row.dataset.scaledCr;

		// Get the monster stats
		const mon = await get5etMonsterByHash(hash, scaledCr);
		const avgHp = await calculateNewHp(mon, 0);
		if (avgHp === null) return;

		// Reset both current HP and max HP to the monster's average
		const hpInput = row.querySelector(".player-hp");
		const maxHpInput = row.querySelector(".player-maxhp");

		setPlayerHp(hpInput, id, avgHp, hpCookieSuffix);
		setPlayerHp(maxHpInput, id, avgHp, maxhpCookieSuffix);
	}

	function addNewPlayer (name, order, hash = null) {
		if (!name) return;
		hash = hash || null;
		order = Number(order) || 0;
		const playerObjToAdd = {
			name: name,
			order: order,
			hash: hash,
		};
		signal({ "add_player": playerObjToAdd });
	}

	function duplicatePlayer (row) {
		addNewPlayer(row.dataset.name, row.dataset.order, row.dataset.hash);
	}

	function deletePlayer (row) {
		signal(`update_player:{"id":"${row.dataset.id}","name":"","hash":null}`);
	}

	function showAlert (title, $modalContent) {
		if (activeAlerts.includes($modalContent)) return; // if $modalContent is already in our array of active alerts, don't show a duplicate
		const {$modalInner} = UiUtil.getShowModal({
			title: title || "Alert",
			isMinHeight0: true,
			cbClose: () => { activeAlerts.splice(activeAlerts.indexOf($modalContent), 1); }, // remove $modalContent from our array of active alerts
		});
		$modalInner.append($modalContent);
		activeAlerts.push($modalContent);
	}

	function showModal (title, $modalContent) {
		const {$modalInner} = UiUtil.getShowModal({
			title: title,
		});
		$modalInner.append($modalContent);
	}

	async function getEncounterLoadOptions () {
		// Create a state object to track checkbox values
		const comp = BaseComponent.fromObject({
			rollInitiative: true,
			groupCreatures: true,
			rollHp: false,
		});

		const {$modalInner, doClose, pGetResolved} = await InputUiUtil._pGetShowModal({
			title: "Load Encounter Options",
			isHeaderBorder: true,
			isMinHeight0: true,
		});

		// Add checkboxes using the utility method
		UiUtil.$getAddModalRowCb2({
			$wrp: $modalInner,
			comp,
			prop: "rollInitiative",
			text: "Roll Initiatives",
		});

		UiUtil.$getAddModalRowCb2({
			$wrp: $modalInner,
			comp,
			prop: "groupCreatures",
			text: "Group creatures by type",
		});

		UiUtil.$getAddModalRowCb2({
			$wrp: $modalInner,
			comp,
			prop: "rollHp",
			text: "Roll HP",
		});

		// Create custom buttons
		const $btnClearAll = $(`<button class="ve-btn ve-btn-primary mr-2"><span class="glyphicon glyphicon-ok"></span> Clear All and Add</button>`)
			.click(() => doClose(true, {
				action: "clearAll",
				...comp._state,
			}));

		const $btnClearMonsters = $(`<button class="ve-btn ve-btn-primary mr-2"><span class="glyphicon glyphicon-filter"></span> Clear Monsters and Add</button>`)
			.click(() => doClose(true, {
				action: "clearMonsters",
				...comp._state,
			}));

		const $btnCancel = $(`<button class="ve-btn ve-btn-default">Cancel</button>`)
			.click(() => doClose(false));

		$$`<div class="ve-flex-v-center ve-flex-h-right pb-1 px-1 mt-2">
			${$btnClearAll}
			${$btnClearMonsters}
			${$btnCancel}
		</div>`.appendTo($modalInner);

		// Get the result
		const [isDataEntered, data] = await pGetResolved();
		if (!isDataEntered) return null;
		return data;
	}

	async function clearEncounterConfirmAndDo (title, htmlDescription) {
		// Ask user if they want to clear everything, or just the monsters?
		const userVal = await InputUiUtil.pGetUserGenericButton({
			title: title || "Clear Creatures",
			buttons: [
				new InputUiUtil.GenericButtonInfo({
					text: "Clear Everything",
					clazzIcon: "glyphicon glyphicon-ok",
					value: "everything",
				}),
				new InputUiUtil.GenericButtonInfo({
					text: "Clear Monsters",
					clazzIcon: "glyphicon glyphicon-remove",
					isPrimary: true,
					value: "monsters",
				}),
				new InputUiUtil.GenericButtonInfo({
					text: "Cancel",
					clazzIcon: "glyphicon glyphicon-stop",
					isSmall: true,
					value: "cancel",
				}),
			],
			htmlDescription: htmlDescription || `<p>Do you want to clear everything from the encounter?  Or, clear only the monsters (those with assigned statblocks)?</p>`,
		});

		// handle user response...
		switch (userVal) {
			case "everything": {
				clearAll();
				return true;
			}

			case "monsters": {
				clearMonsters();
				return true;
			}

			case null:
			case "cancel": {
				return false;
			}

			default: throw new Error(`Unexpected value "${userVal}"`);
		}
	}

	function clearMonsters () {
		// clear out only the rows that are mapped to statblocks
		$(".initiative-tracker tr").each((i, el) => {
			const $el = $(el);
			if ($(el).is("[data-hash]")) {
				const playerId = $(el).data("id");
				signal(`update_player:{"id":"${playerId}","name":""}`);
				removeCookie(`${playerId}${hpCookieSuffix}`);
				removeCookie(`${playerId}${maxhpCookieSuffix}`);
			}
		});
	}

	async function clearAll () {
		signal(`clear_initiative`);
		$("#initiative-statblock-display").html("");

		// Clear all "[playerId]__hp" cookies
		const cookies = document.cookie.split(";"); // Get all cookies
		cookies.forEach(cookie => {
			const cookieName = cookie.split("=")[0].trim(); // Get the cookie name
			if (cookieName.endsWith(hpCookieSuffix)) {
				// If the cookie name ends with "__hp", delete it
				removeCookie(cookieName);
			}
		});
	}

	function getGroupedCreatures (row) {
		// Get all the creatures that are very similarly named, including numerated creatures (ex: Goblin 1, Goblin 2, etc.)
		// Get the base name by removing any trailing numbers and whitespace
		const baseName = row.dataset.name.replace(/\s*\d+$/, "").trim();

		// Get all rows from initiative tracker
		const rows = Array.from(document.querySelectorAll(".initiative-tracker tr"));

		// Filter rows to find similarly named creatures
		return rows.filter(r => {
			// Skip if no name
			if (!r.dataset.name) return false;

			// Get base name of current row by removing trailing numbers
			const currBaseName = r.dataset.name.replace(/\s*\d+$/, "").trim();

			// Return true if base names match
			return currBaseName === baseName;
		});
	}

	async function modalChooseCreatureMaxHP (ele) {
		// Ask user what kinda max HP to set: average, maximum, minimum, or rolled.
		const userVal = await InputUiUtil.pGetUserGenericButton({
			title: "Choose Max HP Type",
			buttons: [
				new InputUiUtil.GenericButtonInfo({
					text: "Average HP",
					isPrimary: true,
					isSmall: true,
					value: 0,
				}),
				new InputUiUtil.GenericButtonInfo({
					text: "Maximum Rollable HP",
					isSmall: true,
					value: 1,
				}),
				new InputUiUtil.GenericButtonInfo({
					text: "Minimum Rollable HP",
					isSmall: true,
					value: 2,
				}),
				new InputUiUtil.GenericButtonInfo({
					text: "Roll for HP!",
					isSmall: true,
					value: 3,
				}),
			],
			htmlDescription: `<p>Select which fixed HP value you would like to assign to this creature, or roll for a random HP value.</p>`,
		});
		return userVal;
	}
	/**
	 * This function is used to create a modal for choosing the maximum HP of a creature.
	 * @param {Element} ele - The element to which the modal is attached.
	 * @param {String} title - The title of the modal, indicating what rollable value is being chosen (e.g., "Initiative" or "HP").
	 * @param {Boolean} doFocus - If true, the focus will be set on the chosen btn.
	 * @returns {Promise} - A promise that resolves with the user's choice of max HP type.
	 */
	async function popoverChooseRollableValue (ele, title, doFocus) {
		return new Promise((resolve) => {
			ele.classList.add("soft-select-highlight");
			let focusOnThis;
			// Create a table to hold the icons
			const popover = createPopover(ele, "top", "choose-rollable-value", (popover) => {
				const table = document.createElement("div");
				table.className = "popover-choose-roll";

				// Create and append each cell individually
				const cell1 = document.createElement("button");
				cell1.className = "popover-choose-roll-btn";
				cell1.innerHTML = "Avg";
				cell1.title = `Set to Average ${title} value.`;
				cell1.value = 0;
				cell1.addEventListener("click", () => {
					resolve(0); // Resolve with the value 0 for "average"
					destroyPopover();
				});
				if (doFocus) focusOnThis = cell1;
				table.appendChild(cell1);

				const cell2 = document.createElement("button");
				cell2.className = "popover-choose-roll-btn";
				cell2.innerHTML = "Max";
				cell2.title = `Set to Maximum rollable ${title} value.`;
				cell2.value = 1;
				cell2.addEventListener("click", () => {
					resolve(1); // Resolve with the value 1 for "maximum"
					destroyPopover();
				});
				table.appendChild(cell2);

				const cell3 = document.createElement("button");
				cell3.className = "popover-choose-roll-btn";
				cell3.innerHTML = "Min";
				cell3.title = `Set to Minimum rollable ${title} value.`;
				cell3.value = 2;
				cell3.addEventListener("click", () => {
					resolve(2); // Resolve with the value 2 for "minimum"
					destroyPopover();
				});
				table.appendChild(cell3);

				const cell4 = document.createElement("button");
				cell4.className = "popover-choose-roll-btn d20-icon";
				cell4.innerHTML = `<svg fill="#ffffff" height="20" width="20" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-50.75 -50.75 609.02 609.02" xml:space="preserve" stroke="#ffffff" stroke-width="0.0050752" transform="rotate(0)"><g id="SVGRepo_iconCarrier"> <g> <g> <g> <polygon points="386.603,185.92 488.427,347.136 488.427,138.944 "></polygon> <polygon points="218.283,18.645 30.827,125.781 131.883,167.893 "></polygon> <polygon points="135.787,202.325 27.264,374.144 235.264,383.189 "></polygon> <polygon points="352.597,170.667 253.781,0 253.739,0 154.923,170.667 "></polygon> <polygon points="471.915,123.051 289.237,18.645 375.445,167.573 "></polygon> <polygon points="19.093,144 19.093,347.136 120.661,186.325 "></polygon> <polygon points="243.093,507.52 243.093,404.843 48.661,396.416 "></polygon> <polygon points="272.235,383.232 480.256,374.144 371.733,202.325 "></polygon> <polygon points="264.427,507.52 458.837,396.416 264.427,404.885 "></polygon> <polygon points="154.475,192 253.76,372.523 353.045,192 "></polygon> </g> </g> </g> </g></svg>`;
				cell4.title = `Roll for ${title}!`;
				cell4.value = 3;
				cell4.addEventListener("click", () => {
					resolve(3); // Resolve with the value 3 for "roll"
					destroyPopover();
				});
				table.appendChild(cell4);

				return table;
			});

			if (doFocus && focusOnThis) focusOnThis.focus();

			function destroyPopover (e) {
				if (!e || e.relatedTarget === null || (e.relatedTarget !== ele && !popover.contains(e.relatedTarget))) {
					if (popover && document.body.contains(popover)) {
						document.body.removeChild(popover);
					}
					ele.removeEventListener("focusout", destroyPopover);
					ele.removeEventListener("change", destroyPopover);
					ele.removeEventListener("value_update", destroyPopover);
					ele.classList.remove("soft-select-highlight");
					resolve(null); // Resolve with null if the popover is closed without a choice
				}
			}

			ele.addEventListener("focusout", destroyPopover);
			ele.addEventListener("change", destroyPopover);
			ele.addEventListener("value_update", destroyPopover);

			return popover;
		});
	}

	async function popoverApplyMaxHpToHp (ele, doFocus) {
		const maxHpInput = ele;
		const hpInput = ele.closest("tr")?.querySelector("input.player-hp");
		if (!maxHpInput || !hpInput) return;

		hpInput.classList.add("soft-select-highlight");
		const userSelection = await new Promise(resolve => {
			let focusOnThis;
			const popover = createPopover(hpInput, "top", "hp-to-maxhp", () => {
				const table = document.createElement("div");
				table.className = "popover-choose-roll";
				const cell = document.createElement("button");
				cell.className = "popover-choose-roll-btn";
				cell.innerHTML = `Apply?`;
				cell.title = "Set HP equal to Max HP";
				cell.addEventListener("click", () => {
					resolve(true);
					destroyPopover();
				});
				if (doFocus) focusOnThis = cell;
				table.appendChild(cell);

				return table;
			});
			if (doFocus && focusOnThis) focusOnThis.focus();

			function destroyPopover (e) {
				if (!e || e.target === null || (!ele.contains(e.target) && e.target !== ele && !popover.contains(e.target))) {
					if (popover && document.body.contains(popover)) {
						document.body.removeChild(popover);
					}
					document.body.removeEventListener("mousedown", destroyPopover);
					document.body.removeEventListener("focusin", destroyPopover);
					hpInput.classList.remove("soft-select-highlight");
					resolve(null);
				}
			}

			document.body.addEventListener("mousedown", destroyPopover);
			document.body.addEventListener("focusin", destroyPopover);

			return popover;
		});

		// Now set the hp to the maxhp
		if (userSelection === true) {
			const id = maxHpInput.closest("tr").dataset.id;
			setPlayerHp(hpInput, id, maxHpInput.value, hpCookieSuffix);
		}
	}

	async function popoverApplyInitiativeToAll (ele, newInitValue, doFocus) {
		const initiativeSourceInput = ele;
		const sourceRow = initiativeSourceInput.closest("tr");
		const groupedCreatureRows = getGroupedCreatures(sourceRow);
		const topRowOrderInput = groupedCreatureRows[0].querySelector("input.player-order");

		const userSelection = await new Promise(resolve => {
			let focusOnThis;
			const popover = createPopover(topRowOrderInput, "top", "apply-initiative-to-all", () => {
				const table = document.createElement("div");
				table.className = "popover-choose-roll";
				const cell = document.createElement("button");
				cell.className = "popover-choose-roll-btn";
				cell.innerHTML = `Apply?`;
				cell.title = "Set initiative of all creatures to the same as the source creature.";
				cell.addEventListener("click", () => {
					resolve(true);
					destroyPopover();
				});
				if (doFocus) focusOnThis = cell;
				table.appendChild(cell);
				// soft-select-highlight all the rows
				groupedCreatureRows.forEach(row => {
					row.querySelector("input.player-order").classList.add("soft-select-highlight");
				});

				return table;
			});
			if (doFocus && focusOnThis) focusOnThis.focus();

			function destroyPopover (e) {
				if (!e || e.target === null || (!ele.contains(e.target) && e.target !== ele && !popover.contains(e.target))) {
					if (popover && document.body.contains(popover)) {
						document.body.removeChild(popover);
					}
					document.body.removeEventListener("mousedown", destroyPopover);
					document.body.removeEventListener("focusin", destroyPopover);
					initiativeSourceInput.classList.remove("soft-select-highlight");
					groupedCreatureRows.forEach(row => {
						row.querySelector("input.player-order").classList.remove("soft-select-highlight");
					});
					resolve(null);
				}
			}

			document.body.addEventListener("mousedown", destroyPopover);
			document.body.addEventListener("focusin", destroyPopover);

			return popover;
		});

		// Now set the hp to the maxhp
		if (userSelection === true) {
			for (const row of groupedCreatureRows) {
				const id = row.dataset.id;
				row.querySelector("input.player-order").value = newInitValue;
				await signal(`update_player:{"id":"${id}","order":${newInitValue}}`);
			}
		}
	}

	/**
	 * Creates a popover element positioned relative to a target element.
	 * @param {HTMLElement} ele - The target element to position the popover relative to
	 * @param {string} [dir='top'] - The direction to position the popover ('top', 'left', 'right', or 'bottom')
	 * @param {string} [clazz] - A class to add to the popover
	 * @param {Function} htmlFunc - Function that returns the HTML content for the popover
	 * @returns {HTMLElement} The created popover element
	 */

	function createPopover (ele, dir = "top", clazz, htmlFunc) {
		// Create the popover element
		const popover = document.createElement("div");
		popover.className = `controller-popover ${clazz || ""}`;
		popover.style.position = "absolute";
		popover.style.backgroundColor = "black";
		popover.style.border = "1px solid #222";
		popover.style.zIndex = "1000";
		popover.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
		popover.appendChild(htmlFunc(popover));

		// Append the popover to the body to measure its dimensions
		document.body.appendChild(popover);

		// Position the popover above the element
		const rect = ele.getBoundingClientRect();
		const popoverHeight = popover.offsetHeight; // Get the height after appending

		// Adjust the top position to account for the popover's height and scroll position
		if (dir === "top") {
			popover.style.top = `${rect.top + window.scrollY - popoverHeight}px`; // Position above the element
			popover.style.left = `${rect.left + (rect.width / 2) - (popover.offsetWidth / 2)}px`; // Center horizontally
		} else if (dir === "left") {
			popover.style.top = `${rect.top + window.scrollY}px`; // Position above the element
			popover.style.left = `${rect.left + window.scrollX - popover.offsetWidth}px`; // Center horizontally
		} else if (dir === "right") {
			popover.style.top = `${rect.top + window.scrollY}px`; // Position above the element
			popover.style.left = `${rect.left + window.scrollX + rect.width}px`; // Center horizontally
		} else if (dir === "bottom") {
			popover.style.top = `${rect.top + window.scrollY + rect.height}px`; // Position above the element
			popover.style.left = `${rect.left + (rect.width / 2) - (popover.offsetWidth / 2)}px`; // Center horizontally
		}

		return popover;
	}

	function getPlayerObjFromMon ({ name, id, order, hash, mon }) {
		if (!hash || !mon) return;
		const displayName = name || mon.name;
		const initiativeOrder = order !== null ? order : Parser.getAbilityModNumber(mon.dex || 10);
		return {
			"name": displayName,
			"order": Number(initiativeOrder),
			"id": id, // custom
			"hash": hash, // custom
			"isNpc": mon.isNpc ? mon.isNpc : null,
			"scaledCr": mon._isScaledCr ? mon._scaledCr : null,
		};
	}

	/**
	 * @param {*} mon a 5et monster object (hopefully containing an `hp` property obj)
	 * @param {*} hpType 0 = average HP, 1 = max HP, 2 = min HP, 3 = roll HP
	 * @returns {Number} HP
	 */
	async function calculateNewHp (mon, hpType) {
		if (!mon) {
			console.error("`mon` must be defined.");
			return;
		}
		let formula = mon.hp?.formula;
		if (!formula) {
			if (mon.hp?.average) {
				return mon.hp.average;
			}
			if (mon.hp?.special) {
				return mon.hp.special;
			}
			console.error("HP is not correctly defined in `mon`.");
			return;
		}
		if (hpType === 1) {
			const hpMaximum = Renderer.dice.parseRandomise2(`dmax(${mon.hp.formula})`);
			return hpMaximum;
		}
		if (hpType === 2) {
			const hpMinimum = Renderer.dice.parseRandomise2(`dmin(${mon.hp.formula})`);
			return hpMinimum;
		}
		if (hpType === 3) {
			const hpRandom = await Renderer.dice.pRoll2(mon.hp.formula, {
				isUser: false,
				name: mon.name,
				label: "HP",
			}, {isResultUsed: true});
			return hpRandom;
		}
		// Default or hpType === 0
		const hpAverage = mon.hp.average;
		return hpAverage;
	}

	/**
	 * @param {*} mon a 5et monster object (hopefully containing a `dex` property)
	 * @param {*} rolltype 0 = average, 1 = max, 2 = min, 3 = roll
	 * @returns {Number} Initiative roll
	 */
	async function calculateNewInit (mon, rollType) {
		if (typeof mon.dex !== "number") {
			console.error("`dex` must be defined in `mon`.");
			return;
		}
		const initiativeModifier = mon ? Parser.getAbilityModNumber(mon.dex) : 0;
		const initiativeFormula = `1d20${UiUtil.intToBonus(initiativeModifier)}`;
		if (rollType === 1) {
			const initMaximum = Renderer.dice.parseRandomise2(`dmax(${initiativeFormula})`);
			return initMaximum;
		}
		if (rollType === 2) {
			const initMinimum = Renderer.dice.parseRandomise2(`dmin(${initiativeFormula})`);
			return initMinimum;
		}
		if (rollType === 3) {
			const initRandom = await Renderer.dice.pRoll2(initiativeFormula, {
				isUser: false,
				name: mon.name,
				label: "Initiative",
			}, {isResultUsed: true});
			return initRandom;
		}
		// Default or rollType === 0
		const initAverage = 10 + initiativeModifier;
		return initAverage;
	}

	function setPlayerHp (ele, id, hp, cookieSuffix, rollAnimationMinMax) {
		const hpInput = ele; // Use the passed element
		hpInput.dataset.lastHp = hp; // Update the last HP value in the dataset
		if (rollAnimationMinMax) {
			animateNumber(ele, hp, rollAnimationMinMax);
		} else {
			hpInput.value = hp; // Set the input value to the new HP
			hpInput.dispatchEvent(new Event("value_update", { bubbles: true }));
		}

		// First try to get playerId from parameter
		let playerId = id;

		// If no playerId provided, try to get it from DOM
		if (!playerId) {
			const playerRow = hpInput?.closest("tr");
			playerId = playerRow?.dataset?.id;
		}

		if (playerId) {
			setCookie(`${playerId}${cookieSuffix}`, hp); // Save the new HP value in a cookie
		} else {
			console.error("Player ID not found in the row.");
		}
	}

	async function animateNumber (element, finalNumber, rollAnimationMinMax) {
		return new Promise((resolve) => {
			const totalUpdates = 14; // Total number of updates
			const interval = 3; // duration / totalUpdates; // Base time between updates
			let currentUpdate = 0; // Current update count
			let randomMin = rollAnimationMinMax?.min || 1;
			let randomMax = rollAnimationMinMax?.max || 100;
			// Function to generate a random number
			function getRandomNumber () {
				return Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin; // Random number between min and max (inclusive)
			}

			// Animation function
			function updateNumber () {
				if (currentUpdate < totalUpdates) {
					// Calculate the delay for the current update
					const speedFactor = Math.pow(1.35, currentUpdate); // Exponential increase
					const randomNumber = getRandomNumber();

					// Update the element's text content
					if (element.tagName === "INPUT") element.value = randomNumber;
					element.textContent = randomNumber;

					// Schedule the next update
					currentUpdate++;
					setTimeout(updateNumber, interval * speedFactor);
				} else {
					// Final number display
					if (element.tagName === "INPUT") element.value = finalNumber;
					element.textContent = finalNumber;
					resolve();
				}
			}

			// Start the animation
			updateNumber();
		});
	}

	// Function to handle HP input focus
	function handleHpFocus (e) {
		const hpInput = e.target;
		hpInput.select();
	}

	// Function to handle HP value changes
	function handleHpChange (e) {
		const hpInput = e.target;
		const raw = hpInput.value.trim();
		const cur = Number(hpInput.dataset.lastHp); // Ensure cur is a number
		const cookieSuffix = getDataOrNull(hpInput.dataset.cookie) || hpCookieSuffix
		const id = hpInput.dataset.id;

		let result; // Variable to hold the new HP value

		if (raw.startsWith("=")) {
			// If it starts with "=", force-set to the value provided
			result = Number(raw.slice(1)); // Convert the value after "=" to a number
		} else if (raw.startsWith("+")) {
			// If it starts with "+", add to the current value
			const addValue = Number(raw.slice(1)); // Get the value after "+"
			result = cur + addValue; // Add to current HP
		} else if (raw.startsWith("-")) {
			// If it starts with "-", subtract from the current value
			const subValue = Number(raw.slice(1)); // Get the value after "-"
			result = cur - subValue; // Subtract from current HP
		} else {
			// Otherwise, just set to the incoming value
			result = Number(raw); // Convert the raw input to a number
		}

		// Lock in the value, save it
		setPlayerHp(hpInput, id, result, cookieSuffix);
	}

	function handleHpKeydown (e) {
		const hpInput = e.target;
		const cur = Number(hpInput.dataset.lastHp); // Get the current HP as a number
		const cookieSuffix = getDataOrNull(hpInput.dataset.cookie) || hpCookieSuffix;
		const id = hpInput.dataset.id;
		let result;

		if (e.key === "ArrowUp") {
			e.preventDefault(); // Prevent the default action (scrolling)
			if (e.shiftKey) {
				result = Number(cur) + 10; // Increment HP by 10
			} else {
				result = Number(cur) + 1; // Increment HP by 1
			}
			setPlayerHp(hpInput, id, result, cookieSuffix);
		} else if (e.key === "ArrowDown") {
			e.preventDefault(); // Prevent the default action (scrolling)
			if (e.shiftKey) {
				result = Number(cur) - 10; // Decrement HP by 10
			} else {
				result = Number(cur) - 1; // Decrement HP by 1
			}
			setPlayerHp(hpInput, id, result, cookieSuffix);
		} else if (e.key === ".") {
			e.preventDefault();
		} else if (e.key === "Enter") {
			e.preventDefault();
			e.target.blur();
		}
	}

	function handleHpValuesUpdate (hpInput, maxHpInput) {
		hpInput.classList.remove("half-hp", "zero-hp", "over-max-hp");
		if (Number(hpInput.value) <= 0) {
			// if value is 0, assign class "zero-hp"
			hpInput.classList.add("zero-hp");
		} else if (Number(hpInput.value) <= Number(maxHpInput.value) / 2) {
			// if value is half (or less) of max hp, assign class "half-hp"
			hpInput.classList.add("half-hp");
		} else if (Number(hpInput.value) > Number(maxHpInput.value)) {
			// if value is greater than max hp, assign class "over-max-hp"
			hpInput.classList.add("over-max-hp");
		}
	}

	async function popoverChooseHpValue (maxhpInput, mon, id, doFocus) {
		if (!mon || !("hp" in mon)) return;
		const userSelection = await popoverChooseRollableValue(maxhpInput, "HP", doFocus);
		if (userSelection !== null) {
			const max = await calculateNewHp(mon, 1);
			const min = Math.max(await calculateNewHp(mon, 2), 1); // minimum value of 1
			const rollAnimationMinMax = userSelection === 3 ? { min, max } : null;
			let newHp;

			switch (userSelection) {
				case 1:
					newHp = max;
					break;
				case 2:
					newHp = min;
					break;
				case 3:
					newHp = await calculateNewHp(mon, 3);
					break;
				default:
					// case 0 or null:
					newHp = await calculateNewHp(mon, 0);
			}

			setPlayerHp(maxhpInput, id, newHp, maxhpCookieSuffix, rollAnimationMinMax);
			popoverApplyMaxHpToHp(maxhpInput, true);
		}
	}

	/**
	 * Cookie Management
	 */

	function setCookie (name, value) {
		document.cookie = `${name}=${value}; path=/`;
	}

	function getCookie (name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(";").shift();
	}

	function removeCookie (name) {
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
	}

	/*************************************/
	/* DOM manipulation                  */
	/*************************************/

	async function initializeDOM () {
		/**
		 * Populate some elements in the DOM
		 */

		populateThemesData(themes);
		populateSlideshowsData(slideshows);
		populatePlaylistData(musicPlaylists, "update_music_playlist");
		populatePlaylistData(musicPlaylists, "update_combat_playlist");
		populatePlaylistData(ambiencePlaylists, "update_ambience_playlist");

		/**
		 * Event listeners and handling
		 */

		// Theme dropdown
		document.getElementById("updateTheme").addEventListener("change", (e) => {
			signal(`updateTheme:${e.target.value}`);
		});

		// Combat playlist dropdown
		document.getElementById("update_combat_playlist").addEventListener("change", (e) => {
			signal(`updateCombatPlaylist:${e.target.value}`);
		});

		// Slideshow context dropdown
		document.getElementById("updateSlideshowContext").addEventListener("change", (e) => {
			signal(`updateSlideshowContext:${e.target.value}`);
		});

		// App scale input
		document.getElementById("update_app_scale").addEventListener("change", (e) => {
			signal(`updateAppScale:${e.target.value}`);
		});

		// Font size input
		document.getElementById("update_font_size").addEventListener("change", (e) => {
			signal(`updateFontSize:${e.target.value}`);
		});

		// Initiative tracker button
		document.getElementById("back_to_initiative").addEventListener("click", () => {
			signal("back_to_initiative");
		});

		// Turn navigation
		document.getElementById("prev_turn").addEventListener("click", () => {
			signal("prev_turn");
		});
		document.getElementById("next_turn").addEventListener("click", () => {
			signal("next_turn");
		});

		// Music controls
		document.getElementById("repeat_music").addEventListener("click", () => {
			signal("repeat_music");
		});
		document.getElementById("prev_track_music").addEventListener("click", () => {
			signal("prev_track_music");
		});
		document.getElementById("play_music").addEventListener("click", () => {
			signal("play_music");
		});
		document.getElementById("pause_music").addEventListener("click", () => {
			signal("pause_music");
		});
		document.getElementById("next_track_music").addEventListener("click", () => {
			signal("next_track_music");
		});
		document.getElementById("shuffle_music").addEventListener("click", () => {
			signal("shuffle_music");
		});
		document.getElementById("volume_music").addEventListener("click", (e) => {
			signal(`volume_music:${e.target.value / 100}`);
		});

		// Music playlist/track selection
		document.getElementById("update_music_playlist").addEventListener("change", (e) => {
			signal(`update_music:${e.target.value}`);
		});
		document.getElementById("update_music_track").addEventListener("change", (e) => {
			signal(`update_music_track:${e.target.value}`);
		});

		// Audio kill switch
		document.getElementById("audio_kill_switch").addEventListener("click", () => {
			signal("kill_audio");
		});

		// Ambience controls
		document.getElementById("prev_track_ambience").addEventListener("click", () => {
			signal("prev_track_ambience");
		});
		document.getElementById("play_ambience").addEventListener("click", () => {
			signal("play_ambience");
		});
		document.getElementById("pause_ambience").addEventListener("click", () => {
			signal("pause_ambience");
		});
		document.getElementById("next_track_ambience").addEventListener("click", () => {
			signal("next_track_ambience");
		});
		document.getElementById("volume_ambience").addEventListener("click", (e) => {
			signal(`volume_ambience:${e.target.value / 100}`);
		});

		// Ambience playlist/track selection
		document.getElementById("update_ambience_playlist").addEventListener("change", (e) => {
			signal(`update_ambience:${e.target.value}`);
		});
		document.getElementById("update_ambience_track").addEventListener("change", (e) => {
			signal(`update_ambience_track:${e.target.value}`);
		});

		document.querySelectorAll(".toggle").forEach(tog => {
			tog.addEventListener("click", (e) => {
				const toggle = e.target.closest(".toggle");
				toggle?.classList.toggle("active");
				document.querySelector(toggle?.dataset.target)?.classList.toggle("closed");
			});
		});

		document.getElementById("update_music_playlist").addEventListener("change", function (e) {
			populateTrackData(e.target.value, "music");
		});
		document.getElementById("update_ambience_playlist").addEventListener("change", function (e) {
			populateTrackData(e.target.value, "ambience");
		});

		sendMessageBox.addEventListener("keypress", function (e) {
			if (e.key == "Enter") sendButton.click();
		});

		sendButton.addEventListener("click", function () {
			if (conn && conn.open) {
				let msg = sendMessageBox.value;
				sendMessageBox.value = "";
				conn.send(msg);
				addMessage(`<span class="selfMsg">Self: </span>${msg}`);
			}
		});

		clearMsgsButton.addEventListener("click", clearMessages);
		connectButton.addEventListener("click", () => { join(); });
		recvIdInput.addEventListener("focus", function (e) {
			e.target.select();
		});
		recvIdInput.addEventListener("keypress", function (e) {
			if (e.key == "Enter") connectButton.click();
		});
		recvIdInput.addEventListener("input", () => {
			recvIdInput.value = recvIdInput.value.toLowerCase().replace(/\s+/g, "-"); // Convert to lowercase and replace spaces with dashes
		});

		document.getElementById("new_player").addEventListener("submit", (e) => {
			e.preventDefault(); // Prevent default form submission

			// Get form data
			const name = document.getElementById("new_player_name").value;
			const number = document.getElementById("new_player_roll").value;

			addNewPlayer(name, number);
		});

		document.getElementById("new_player_master").addEventListener("submit", (e) => {
			e.preventDefault(); // Prevent default form submission
			// Get form data
			const name = document.getElementById("new_player_name_master").value;
			const number = document.getElementById("new_player_roll_master").value;

			addNewPlayer(name, number);
		});

		document.body.addEventListener("click", async (e) => {
			if (e.target.classList.contains("assign-a-monster")) {
				selectMonsterFromOmnibox(e.target.closest("tr[data-id]"));
			}
		});

		document.getElementById("clear_initiative").addEventListener("click", async () => { await clearEncounterConfirmAndDo(); });

		document.querySelector(".initiative-tracker").addEventListener("contextmenu", evt => {
			const row = evt.target.closest("tr[data-id]");
			if (row) {
				evt.preventDefault();
				const hash = row.dataset.hash;
				const id = row.dataset.id;
				const menuItems = hash ? [
					new ContextUtil.Action("Rename", () => { renamePlayer(row); }),
					new ContextUtil.Action("Pick a different monster", () => { selectMonsterFromOmnibox(row); }),
					new ContextUtil.Action("Reset HP/Max to average", () => { resetHpToAverage(row); }),
					new ContextUtil.Action("Unassign monster", () => { removeMonsterAssignment(row); }),
					new ContextUtil.Action("Duplicate", () => { duplicatePlayer(row); }),
					new ContextUtil.Action("Delete", () => { deletePlayer(row); }),
				] : [
					new ContextUtil.Action("Rename", () => { renamePlayer(row); }),
					new ContextUtil.Action("Assign a monster", () => { selectMonsterFromOmnibox(row); }),
					new ContextUtil.Action("Track HP/Max HP", () => { assignMonsterToRow(row, "commoner_MM"); }),
					new ContextUtil.Action("Duplicate", () => { duplicatePlayer(row); }),
					new ContextUtil.Action("Delete", () => { deletePlayer(row); }),
				];

				ContextUtil.pOpenMenu(evt, ContextUtil.getMenu(menuItems),
					{userData: {entity: hash}},
				);
			}
		});
	}

	/*************************************/
	/* Initialization                    */
	/*************************************/

	initPeer2Peer();
	initTab2Tab();
	initializeDOM();
})();