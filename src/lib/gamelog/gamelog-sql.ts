import Database from '@tauri-apps/plugin-sql';
import { gamelogStore } from '$lib/gamelog/gamelog-store';

let db: Database;

export async function loadDb() {
	db = await Database.load('sqlite:spectre.db');
}

export async function getLogsByDate(minDate: Date, maxDate: Date) {
	const minString = minDate.toISOString().replace('T', ' ').slice(0, 19);
	const maxString = maxDate.toISOString().replace('T', ' ').slice(0, 19);

	const result = await db.select<GameLogMessage[]>(
		`SELECT time, type, message
     FROM log
     WHERE time >= $1
       AND time <= $2
     ORDER BY time DESC
     LIMIT 1000`,
		[minString, maxString]
	);

	gamelogStore.set(result);
}

/** Get the last 24 hours of logs from the database **/
export async function getLogsLast24Hours() {
	const rows = await db.select<GameLogMessage[]>(
		`SELECT *
     FROM log
     WHERE time >= datetime('now', '-1 day')
       AND time <= datetime('now')
     ORDER BY time DESC
     LIMIT 1000`
	);
	gamelogStore.set(rows);
}

/** Manually adds a log to the database, along with pushing it to the current log store **/
export async function addManualLog(type: string, message: string, user?: string, location?: string) {
	const u = user ?? null;
	const loc = location ?? null;

	let result = await db.execute("INSERT into log (time, type, message, user, location) VALUES (Datetime('now', 'localtime'), $1, $2, $3, $4)", [
		type,
		message,
		u,
		loc
	]);

	console.log(result);

	const newLog: GameLogMessage = {
		time: new Date(),
		type: type,
		message: message,
		user: user,
		location: location
	};

	gamelogStore.update(logs => {
		return [newLog, ...logs];
	});
}

/** Adds logs from sidecar **/
export async function addLog(log: string) {
	if (log.includes("[Video Playback] ERROR:")) {
		let result = await db.execute("INSERT into log (time, type, message) VALUES (Datetime('now', 'localtime'), $1, $2)", [
			"Error",
			log
		]);

		const newLog: GameLogMessage = {
			time: new Date(),
			type: "Error",
			message: log,
		};

		gamelogStore.update(logs => {
			return [newLog, ...logs];
		});
	}
	if (log.includes('[Behaviour] OnPlayerJoined')) {
		let info = parseJoinLog(log);

		if (info) {
			let result = await db.execute(
				"INSERT into log (time, type, message, user, location) VALUES (Datetime('now', 'localtime'), $1, $2, $3, null)",
				['OnPlayerJoined', info.username, info.userId]
			);

			const newLog: GameLogMessage = {
				time: new Date(),
				type: 'OnPlayerJoined',
				message: info.username,
				user: info.userId
			};

			gamelogStore.update((logs) => {
				return [newLog, ...logs];
			});
		}
	}
	if (log.includes("[Behaviour] OnPlayerLeft")) {
		let info = parseLeaveLog(log);

		if (info) {
			let result = await db.execute("INSERT into log (time, type, message, user, location) VALUES (Datetime('now', 'localtime'), $1, $2, $3, null)", [
				"OnPlayerLeft",
				info.username,
				info.userId
			]);

			const newLog: GameLogMessage = {
				time: new Date(),
				type: "OnPlayerLeft",
				message: info.username,
				user: info.userId
			};

			gamelogStore.update(logs => {
				return [newLog, ...logs];
			});
		}
	}
}

/** Simple function to parse join logs for relevant info **/
function parseJoinLog(line: string): JoinInfo | null {
	const re = /OnPlayerJoined\s+(.+?)\s*\((usr_[^)\s]+)\)/;
	const m = re.exec(line);
	if (!m) return null;
	const [, username, userId] = m;
	return { username, userId };
}

/** Simple function to parse leave logs for relevant info **/
function parseLeaveLog(line: string): JoinInfo | null {
	const re = /OnPlayerLeft\s+(.+?)\s*\((usr_[^)\s]+)\)/;
	const m = re.exec(line);
	if (!m) return null;
	const [, username, userId] = m;
	return { username, userId };
}

export interface GameLogMessage {
	time: Date,
	type: string,
	message: string,
	user?: string,
	location?: string
}

interface JoinInfo {
	username: string;
	userId: string;
}