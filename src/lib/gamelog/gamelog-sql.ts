import Database from '@tauri-apps/plugin-sql';

const db: Database = await Database.load('sqlite:spectre.db');

export async function checkDb() {
	let result = await db.execute("SELECT * FROM log");
	console.log(result);
}

export async function addLog(log: string) {
	if (log.startsWith("[Video Playback] ERROR:")) {
		let result = await db.execute("INSERT into log (time, type, message) VALUES (Datetime('now'), $1, $2)", [
			"Error",
			log
		]);
		console.log(result);
	}
	if (log.startsWith("[Behaviour] OnPlayerJoined")) {
		let result = await db.execute("INSERT into log (time, type, message) VALUES (Datetime('now'), $1, $2)", [
			"OnPlayerJoined",
			log
		]);
		console.log(result);
	}
	if (log.startsWith("[Behaviour] OnPlayerLeft")) {
		let result = await db.execute("INSERT into log (time, type, message) VALUES (Datetime('now'), $1, $2)", [
			"OnPlayerLeft",
			log
		]);
		console.log(result);
	}
}