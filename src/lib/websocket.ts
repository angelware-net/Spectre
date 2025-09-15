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
import { getSetting } from '$lib/store';
import { sendXsNotification } from '$lib/xsoverlay/xsocket';
import { currentInstanceStore } from '$lib/svelte-stores';
import { get } from 'svelte/store';
import { addManualLog } from '$lib/gamelog/gamelog-sql';
import type { InstanceData } from '$lib/types/instance';
import {
	updateFriendActive,
	updateFriendLocation,
	updateFriendOffline,
	updateFriendOnline
} from '$lib/update-friends';
import type { WebsocketFriendLocation } from '$lib/types/websocket/websocket-friend-location';
import type { WebsocketFriendOffline } from '$lib/types/websocket/websocket-friend-offline';
import type { WebsocketFriendOnline } from '$lib/types/websocket/websocket-friend-online';
import type { WebsocketFriendActive } from '$lib/types/websocket/websocket-friend-active';
import { loadData } from '$lib/load-data';

let ws: WebSocket | null = null;
let permissionGranted: boolean = false;
let xsEnabled: boolean = true;

// heartbeat stuff, sometimes vrc seems to disconnect the socket, so this is like a watchdog for that
let reconnecting = false;
let attempts = 0;
const MAX_DELAY_MS = 60_000;
let lastMessageAt = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const now = () => Date.now();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (n: number) =>
	Math.min(1000 * 2 ** n, MAX_DELAY_MS) + Math.floor(Math.random() * 300);

async function startHeartbeat() {
	stopHeartbeat();
	lastMessageAt = now();
	heartbeatTimer = setInterval(async () => {
		if (now() - lastMessageAt > 30_000) {
			await loadData(); // we reload the data here because it might be out of sync...
			void safeReconnect('heartbeat-timeout');
			return;
		}
		try {
			await ws?.send('{"type":"ping"}');
		} catch {
			void safeReconnect('send-failed');
		}
	}, 10_000);
}

function stopHeartbeat() {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
		heartbeatTimer = null;
	}
}

async function safeReconnect(reason: string) {
	if (reconnecting) return;
	reconnecting = true;
	stopHeartbeat();

	try {
		await ws?.disconnect();
	} catch {
	}
	ws = null;

	while (true) {
		const wait = backoff(attempts++);
		console.warn(`[ws] reconnecting in ${wait}ms (${reason})`);
		await sleep(wait);
		try {
			await connectSocket();
			attempts = 0;
			reconnecting = false;
			console.info('[ws] reconnected');
			return;
		} catch (e) {
			console.error('[ws] reconnect attempt failed:', e);
		}
	}
}

async function connectSocketInternal() {
	if (ws) return; // Prevent a second websocket from connecting at the same time, should never happen.

	let cookie: string = await invoke('load_login_cookies');
	let cookieString = cookie.match(/auth=(authcookie_[\w-]+)/);

	if (cookieString != null && cookieString[1] != null) {
		ws = await WebSocket.connect(`wss://pipeline.vrchat.cloud/?authToken=${cookieString[1]}`, {
			headers: [['User-Agent', 'Spectre/2.0']]
		});

		ws.addListener(async (msg) => {
			lastMessageAt = now();
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
		startHeartbeat();
		console.log('Websocket connected...');
	} else {
		console.error(
			'Websocket could not be created because the authentication cookie was null or invalid.'
		);
	}
}

export async function connectSocket() {
	if (ws) return;
	await connectSocketInternal().catch((e) => {
		console.error('[ws] initial connect failed:', e);
		void safeReconnect('initial-connect');
	});
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
				await addManualLog(
					'User Location',
					`${instanceData.world.name}`,
					undefined,
					`${instanceData.worldId}`
				);
			}
		}
	} else if (msgObject.type === 'friend-location') {
		const setting = await getSetting('friendTravelingNotif');
		let msg: WebsocketFriendLocation = JSON.parse(msgObject.content);
		if (setting?.toLowerCase() === 'true') {
			if (msg.travelingToLocation !== '') {
				let currentLocation = get(currentInstanceStore);
				if (currentLocation !== null || currentLocation !== '') {
					if (currentLocation === msg.travelingToLocation) {
						let username = await getUsernameById(msg.userId);
						let title = `${username} is heading to your current location!`;
						await sendNotif(title, title);
					}
				}
			}
		}
		if (msg.location != '' && msg.location != 'traveling') {
			console.log(`friend-location ${msg.user.displayName}`);
			await updateFriendLocation(msg);
		}
	} else if (msgObject.type === 'friend-offline') {
		let msg: WebsocketFriendOffline = JSON.parse(msgObject.content);
		console.log(`friend-offline ${msg.userId}`);
		await updateFriendOffline(msg);
	} else if (msgObject.type === 'friend-online') {
		let msg: WebsocketFriendOnline = JSON.parse(msgObject.content);
		console.log(`friend-online ${msg.user.displayName}`);
		await updateFriendOnline(msg);
	} else if (msgObject.type === 'friend-active') {
		let msg: WebsocketFriendActive = JSON.parse(msgObject.content);
		console.log(`friend-active ${msg.user.displayName}`);
		await updateFriendActive(msg);
	} else if (msgObject.type !== undefined) {
		console.debug(`WebSocket message type is ${msgObject.type}`);
	} else {
		console.log('WebSocket ping received! Connection is alive!');
	}
}

export async function disconnectSocket() {
	if (ws != null) {
		try {
			await ws.disconnect();
			console.log('Websocket Disconnected');
		} finally {
			ws = null;
		}
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
