import { loginStatusStore } from '$lib/svelte-stores';
import { invoke } from '@tauri-apps/api/core';
import WebSocket from '@tauri-apps/plugin-websocket';
import type { WebsocketMessage } from '$lib/types/websocket-msg';
import { type InviteNotification, type Notification } from '$lib/types/notification';
import {
	isPermissionGranted,
	requestPermission,
	sendNotification
} from '@tauri-apps/plugin-notification';
import type { ExternalUserData } from '$lib/types/external-user';
import { getSetting } from '$lib/store';
import { sendXsNotification } from '$lib/xsoverlay/xsocket';
import { currentInstanceStore } from '$lib/svelte-stores';
import { get } from 'svelte/store';
import { addManualLog } from '$lib/gamelog/gamelog-sql';
import type { InstanceData } from '$lib/types/instance';

let ws: WebSocket | null = null;
let permissionGranted: boolean = false;
let xsEnabled: boolean = true;

export async function connectSocket() {
	if (ws) return; // Prevent a second websocket from connecting at the same time, should never happen.

	let cookie: string = await invoke('load_login_cookies');
	let cookieString = cookie.match(/auth=(authcookie_[\w-]+)/);

	if (cookieString != null && cookieString[1] != null) {
		ws = await WebSocket.connect(`wss://pipeline.vrchat.cloud/?authToken=${cookieString[1]}`, {
			headers: [['User-Agent', 'Spectre/2.0']]
		});

		ws.addListener(async (msg) => {
			// Handle message based on type
			if (typeof msg.data === 'string') {
				// console.log('Raw WebSocket message (string):', msg.data);
				try {
					let msgObject: WebsocketMessage = JSON.parse(msg.data);
					await handleWebSocketMessage(msgObject);
					console.debug(msgObject, JSON.parse(msgObject.content));
				} catch (e) {
					console.error('Failed to parse WebSocket message:', e, 'Message:', msg.data);
				}
			} else if (typeof msg.data === 'object') {
				console.debug('Raw WebSocket message (object):', msg.data);
				// await handleWebSocketMessage(webmsg.data as WebsocketMessage);
			} else {
				console.warn('Received unsupported WebSocket message type:', msg.data);
			}
		});
		console.log('Websocket connected...');
	} else {
		console.error(
			'Websocket could not be created because the authentication cookie was null or invalid.'
		);
	}
}

export async function checkNotificationPermission() {
	return await isPermissionGranted();
}

async function checkXsoEnabled() {
	let xsEnabledSetting = await getSetting('xsOverlayEnabled');
	if (xsEnabledSetting != null) {
		xsEnabled = xsEnabledSetting.toLowerCase() === 'true';
		return xsEnabled;
	} else {
		return (xsEnabled = true);
	}
}

export async function requestNotificationPermission() {
	try {
		let p = await requestPermission();
		return p === 'granted';
	} catch (e) {
		console.error(`An error occurred while requesting notification permissions: ${e}`);
		return false;
	}
}

async function sendNotif(title: string, msg: string) {
	permissionGranted = await isPermissionGranted();
	if (permissionGranted) {
		sendNotification({ title: title, body: msg });
	} else {
		await requestNotificationPermission();
		sendNotification({ title: title, body: msg });
	}

	if (xsEnabled) {
		await sendXsNotification(title);
	}
}

async function getUsernameById(id: string) {
	let userString = await invoke<string>('get_vrc_user', { userId: id });
	let userObject: ExternalUserData = JSON.parse(userString);
	return userObject.displayName;
}

async function handleWebSocketMessage(msgObject: WebsocketMessage) {
	if (msgObject.type === 'notification') {
		await checkNotificationPermission();
		await checkXsoEnabled();
		console.log('WebSocket received a notification!');

		let msg: Notification = JSON.parse(msgObject.content);

		switch (msg.type) {
			case 'invite': {
				if (msg.details !== null && msg.senderUserId !== null) {
					let detailsString = JSON.stringify(msg.details);
					let detailsObject: InviteNotification = JSON.parse(detailsString);
					let username = await getUsernameById(msg.senderUserId);

					let title = `${username} send you an invite to ${detailsObject.worldName}`;

					await sendNotif(title, msg.message);

					await addManualLog('Invite', title, msg.senderUserId);
				}
				break;
			}
			case 'requestInvite': {
				if (msg.senderUserId !== null) {
					let username = await getUsernameById(msg.senderUserId);

					let title = `${username} is requesting an invite!`;

					await sendNotif(title, msg.message);

					await addManualLog('Invite Request', title, msg.senderUserId);
				}
				break;
			}
			case 'friendRequest': {
				if (msg.senderUserId !== null) {
					let username = await getUsernameById(msg.senderUserId);

					let title = `${username} sent you a friend request!`;

					await sendNotif(title, msg.message);

					await addManualLog('Friend Request', title, msg.senderUserId);
				}
				break;
			}
			case 'message': {
				if (msg.senderUserId !== null) {
					let username = await getUsernameById(msg.senderUserId);

					let title = `${username} sent you a message!`;

					await sendNotif(title, msg.message);

					await addManualLog('Message', title, msg.senderUserId);
				}
				break;
			}
			case 'requestInviteResponse': {
				if (msg.senderUserId !== null) {
					let username = await getUsernameById(msg.senderUserId);

					let title = `${username} responded to your invite request!`;

					await sendNotif(title, msg.message);

					await addManualLog('Invite Response', title, msg.senderUserId);
				}
				break;
			}
			default: {
				// if the notification type is not know, we should just ignore it
				break;
			}
		}
	} else if (msgObject.type === 'user-location') {
		let msg = JSON.parse(msgObject.content);
		let location: string = msg.location;
		if (!location.startsWith('travel')) {
			currentInstanceStore.set(location);
			console.log(`Current user\'s location has changed ${location}`);

			if (!location.includes('offline')) {
				const instanceString = await invoke<string>('get_vrc_instance', {
					instanceId: location
				});
				const instanceData: InstanceData = JSON.parse(instanceString);
				await addManualLog('User Location', `${instanceData.world.name}`, undefined, `${instanceData.worldId}`);
			}
		}
	} else if (msgObject.type === 'friend-location') {
		let msg = JSON.parse(msgObject.content);
		if (msg.travelingToLocation !== "") {
			let currentLocation = get(currentInstanceStore);
			if (currentLocation !== null || currentLocation !== "") {
				if (currentLocation === msg.travelingToLocation){
					let username = await getUsernameById(msg.userId);
					let title = `${username} is heading to your current location!`;
					await sendNotif(title, title);
				}
			}
		}
  } else if (msgObject.type !== undefined) {
		console.debug(`WebSocket message type is ${msgObject.type}`);
	} else {
		console.log('WebSocket ping received! Connection is alive!');
	}
}

export async function disconnectSocket() {
	if (ws != null) {
		await ws.disconnect();
		console.log('Websocket Disconnected');
	}
}

async function getWorldInfo(location: string): Promise<string> {
	try {
		let world = await invoke<string>('get_vrc_instance', { instanceId: location });
		return world;
	} catch (e) {
		console.error(`Error getting world ${e}`);
		return 'not found';
	}
}
