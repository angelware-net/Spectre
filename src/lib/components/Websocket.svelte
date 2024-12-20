<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { loginStatusStore } from '$lib/svelte-stores';
	import { invoke } from '@tauri-apps/api/core';
	import WebSocket from '@tauri-apps/plugin-websocket';
	import type { WebsocketMessage } from '$lib/types/websocket-msg';

	import {
		isPermissionGranted,
		requestPermission,
		sendNotification,
	} from '@tauri-apps/plugin-notification';

	let ws: WebSocket | null = null;
	let permissionGranted: boolean = false;

	// setup notifications
	// TODO: Move this into layout function
	onMount(async () => {
		permissionGranted = await isPermissionGranted();

		if (!permissionGranted) {
			const permission = await requestPermission();
			permissionGranted = permission === 'granted';
		}
	});


	loginStatusStore.subscribe(async (isLoggedIn) => {
		if (isLoggedIn && !ws) {
			try {
				let cookie: string = await invoke('load_login_cookies');
				let cookieString = cookie.match(/auth=(authcookie_[\w-]+)/);

				if (cookieString != null && cookieString[1] != null) {
					ws = await WebSocket.connect(`wss://pipeline.vrchat.cloud/?authToken=${cookieString[1]}`, {
						headers: [
							['User-Agent', 'Spectre/2.0']
						]
					});
					// ws.addListener((webmsg) => {
					// 	let msgString = JSON.stringify(webmsg.data);
					// 	let msgObject: WebsocketMessage = JSON.parse(webmsg.data);
					//
					// 	if (msgObject.type == 'notification'){
					// 		console.log('Websocket received a notification!');
					//
					// 		if (permissionGranted){
					// 			sendNotification("Received Notification via Websocket")
					// 		}
					// 	} else {
					// 		if (msgObject.type !== undefined) {
					// 			console.log(`Websocket message type is ${msgObject.type}`);
					// 		} else {
					// 			console.log("Websocket ping received! Connection is alive!")
					// 		}
					// 	}
					// 	console.log('Websocket received message: ' + JSON.stringify(webmsg.data));
					// });
					ws.addListener((webmsg) => {
						// Check if the data is an object or string
						if (typeof webmsg.data === 'string') {
							// If it’s a string, log the raw message
							console.log('Raw WebSocket message (string):', webmsg.data);
							try {
								let msgObject: WebsocketMessage = JSON.parse(webmsg.data);
								handleWebSocketMessage(msgObject);
							} catch (e) {
								console.error("Failed to parse WebSocket message:", e, "Message:", webmsg.data);
							}
						} else if (typeof webmsg.data === 'object') {
							// Directly handle the message if it’s an object
							console.log('Raw WebSocket message (object):', webmsg.data);
							handleWebSocketMessage(webmsg.data as WebsocketMessage);
						} else {
							console.warn("Received unsupported WebSocket message type:", webmsg.data);
						}
					});
					console.log('Websocket connected...')
				} else {
					console.error("Websocket could not be created because the authentication cookie was null or invalid.");
				}
			} catch (e) {
				console.error("An error occurred setting up the websocket: " + e);
			}
		}
	});

	function handleWebSocketMessage(msgObject: WebsocketMessage) {
		if (msgObject.type === 'notification') {
			console.log('WebSocket received a notification!');
			if (permissionGranted) {
				sendNotification("Received Notification via WebSocket");
			}
		} else if (msgObject.type !== undefined) {
			console.log(`WebSocket message type is ${msgObject.type}`);
		} else {
			console.log("WebSocket ping received! Connection is alive!");
		}
	}

	onDestroy(async () =>{
		if (ws != null) {
			await ws.disconnect();
			console.log("Websocket destroyed.")
		}
	})
</script>