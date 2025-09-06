import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

function forwardConsole(
	fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
	logger: (message: string) => Promise<void>
) {
	const original = console[fnName];
	console[fnName] = (...args) => {
		const message = args.map((a) =>
			typeof a === 'object' ? JSON.stringify(a) : String(a)
		).join(' ');

		original(...args);
		logger(message).catch((err) => {
			console.warn('[TAURI LOG ERROR]', err);
		});
	};
}

// function forwardConsole(
// 	fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
// 	logger: (message: string) => Promise<void>
// ) {
// 	const original = console[fnName];
// 	console[fnName] = (message) => {
// 		original(message);
// 		logger(message);
// 	};
// }

export function redirectConsoleToTauriLog() {
	forwardConsole('log', info);
	forwardConsole('debug', debug);
	forwardConsole('info', info);
	forwardConsole('warn', warn);
	forwardConsole('error', error);
}
