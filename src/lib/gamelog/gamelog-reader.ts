import { Child, Command } from '@tauri-apps/plugin-shell';
import { type Platform, platform } from '@tauri-apps/plugin-os';
import WebSocket from '@tauri-apps/plugin-websocket';
import { addLog } from '$lib/gamelog/gamelog-sql';

let process: Child | null = null;
let ws: WebSocket | null = null;

/**
Sidecar process for reading VRChat logfiles. We use a sidecar because Tauri has very strict policies surrounding
file system access. We also only have these functions available on windows. Sidecar app is located in
`src-tauri/sidecar/spectre-sidecar-*` or https://github.com/angelware-net/spectre-sidecar
**/
export async function spawnProcess() {
	const currentPlatform: Platform = platform();
	if (currentPlatform !== 'windows') return;

	const command = Command.sidecar('sidecar/spectre-sidecar');
	process = await command.spawn();
	console.log("SIDECAR: Started sidecar process.");

	await startWebsocket();
}

export async function killProcess() {
	if (!process) return;

	try {
		await process.kill();
		console.log("SIDECAR: Successfully killed sidecar process.");
	} catch (e) {
		console.error(`SIDECAR: Failed to kill sidecar process: ${e}`);
	}
}

async function startWebsocket() {
	if (ws) return;
	console.log("SIDECAR: Starting websocket...")

	try {
		ws = await WebSocket.connect('ws://127.0.0.1:40602');

		ws.addListener(async (msg) => {
			console.log(`SIDECAR LOGGER: ${msg.data}`);
			await addLog(<string>msg.data);
		});
	} catch (e) {
		console.error(`SIDECAR: An error occurred when trying to connect to sidecar websocket: ${e}`);
	}
}
