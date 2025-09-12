<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { loginStatusStore } from '$lib/svelte-stores';
	import { invoke } from '@tauri-apps/api/core';
	import WebSocket from '@tauri-apps/plugin-websocket';
	import type { WebsocketMessage } from '$lib/types/websocket/websocket-msg';
	import { type InviteNotification, type Notification } from '$lib/types/notification';

	import {
		isPermissionGranted,
		requestPermission,
		sendNotification
	} from '@tauri-apps/plugin-notification';
	import type { ExternalUserData } from '$lib/types/external-user';

	let ws: WebSocket | null = null;
	let permissionGranted: boolean = false;

	// setup notifications
	onMount(async () => {
		permissionGranted = await isPermissionGranted();

		if (!permissionGranted) {
			const permission = await requestPermission();
			permissionGranted = permission === 'granted';
		}
	});

	export async function disconnectSocket() {
		if (ws) {
			console.log('Disconnecting Websocket...');
			await ws.disconnect();
		}
	}

	loginStatusStore.subscribe(async (isLoggedIn) => {
		if (isLoggedIn && !ws) {
			try {
				let cookie: string = await invoke('load_login_cookies');
				let cookieString = cookie.match(/auth=(authcookie_[\w-]+)/);

				if (cookieString != null && cookieString[1] != null) {
					ws = await WebSocket.connect(
						`wss://pipeline.vrchat.cloud/?authToken=${cookieString[1]}`,
						{
							headers: [['User-Agent', 'Spectre/2.0']]
						}
					);

					ws.addListener((webmsg) => {
						// Check if the data is an object or string
						if (typeof webmsg.data === 'string') {
							// If it’s a string, log the raw message
							console.log('Raw WebSocket message (string):', webmsg.data);
							try {
								let msgObject: WebsocketMessage = JSON.parse(webmsg.data);
								handleWebSocketMessage(msgObject);
							} catch (e) {
								console.error('Failed to parse WebSocket message:', e, 'Message:', webmsg.data);
							}
						} else if (typeof webmsg.data === 'object') {
							// Directly handle the message if it’s an object
							console.log('Raw WebSocket message (object):', webmsg.data);
							handleWebSocketMessage(webmsg.data as WebsocketMessage);
						} else {
							console.warn('Received unsupported WebSocket message type:', webmsg.data);
						}
					});
					console.log('Websocket connected...');
				} else {
					console.error(
						'Websocket could not be created because the authentication cookie was null or invalid.'
					);
				}
			} catch (e) {
				console.error('An error occurred setting up the websocket: ' + e);
			}
		}
	});

	// handles a web socket message by pushing a notification based on the notification type
	async function handleWebSocketMessage(msgObject: WebsocketMessage) {
		if (msgObject.type === 'notification') {
			console.log('WebSocket received a notification!');

			let msg: Notification = JSON.parse(msgObject.content);

			switch (msg.type) {
				case 'invite': {
					if (msg.details !== null && msg.senderUserId !== null) {
						let detailsString = JSON.stringify(msg.details);
						let detailsObject: InviteNotification = JSON.parse(detailsString);
						let username = await getUsernameById(msg.senderUserId);

						let title = `${username} sent you an invite to ${detailsObject.worldName}`;

						await sendNotif(title, msg.message);
					}
					break;
				}
				case 'requestInvite': {
					if (msg.senderUserId !== null) {
						let username = await getUsernameById(msg.senderUserId);

						let title = `${username} is requesting an invite!`;

						await sendNotif(title, msg.message);
					}
					break;
				}
				case 'friendRequest': {
					if (msg.senderUserId !== null) {
						let username = await getUsernameById(msg.senderUserId);

						let title = `${username} sent you a friend request!`;

						await sendNotif(title, msg.message);
					}
					break;
				}
				case 'message': {
					if (msg.senderUserId !== null) {
						let username = await getUsernameById(msg.senderUserId);

						let title = `${username} sent you a message!`;

						await sendNotif(title, msg.message);
					}
					break;
				}
				case 'requestInviteResponse': {
					if (msg.senderUserId !== null) {
						let username = await getUsernameById(msg.senderUserId);

						let title = `${username} responded to your invite request!`;

						await sendNotif(title, msg.message);
					}
					break;
				}
				default: {
					// if the notification type is not know, we should just ignore it
					break;
				}
			}

			console.log(msg);
		} else if (msgObject.type !== undefined) {
			console.log(`WebSocket message type is ${msgObject.type}`);
		} else {
			console.log('WebSocket ping received! Connection is alive!');
		}
	}

	async function getUsernameById(id: string) {
		let userString = await invoke<string>('get_vrc_user', { userId: id });
		let userObject: ExternalUserData = JSON.parse(userString);
		return userObject.displayName;
	}

	async function sendNotif(title: string, msg: string) {
		if (permissionGranted) {
			sendNotification({ title: title, body: msg });
		}
	}

	onDestroy(async () => {
		if (ws != null) {
			await ws.disconnect();
			console.log('Websocket destroyed.');
		}
	});
</script>
