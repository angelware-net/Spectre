import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'svelte-sonner';

export async function updateApp() {
	const update = await check();
	if (update) {
		console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);

		toast('Downloading Update...');

		let downloaded = 0;
		let contentLength: number | undefined = 0;
		// alternatively we could also call update.download() and update.install() separately
		await update.downloadAndInstall((event) => {
			switch (event.event) {
				case 'Started':
					contentLength = event.data.contentLength;
					console.log(`started downloading ${event.data.contentLength} bytes`);
					break;
				case 'Progress':
					downloaded += event.data.chunkLength;
					console.log(`downloaded ${downloaded} from ${contentLength}`);
					break;
				case 'Finished':
					console.log('download finished');
					break;
			}
		});

		toast('Update Success! Relaunching...');

		console.log('update installed');
		await relaunch();
	} else {
		console.log('No update needed.');
	}
}
