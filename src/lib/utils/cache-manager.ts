/*
* Crude cache manager, runs a check at startup to verify the cache size isnt over an amount, if it is, it clears the cache
* to half the size of the initial value based on recency. I know this is really hacky, I will implement a real solution soon:tm:
*/

import { BaseDirectory, exists, mkdir, readDir, remove, stat } from '@tauri-apps/plugin-fs';
import { getNumericSetting } from '$lib/store';

const cacheDir = 'cache';
const maxSize = await getNumericSetting('maximumCacheSize'); // maximum size in mb
// const clearSize = maxSize / 2; // size to clear to, basically half the size of the cache

export async function manageCacheSize() {
	try {
		const files = await readDir(cacheDir, { baseDir: BaseDirectory.AppCache });

		const fileSizes: { path: string; size: number; modified: Date }[] = [];

		for (const file of files) {
			if (file.isFile) {
				const fileMeta = await stat(`${cacheDir}/${file.name}`, { baseDir: BaseDirectory.AppCache });
				fileSizes.push({
					path: `${cacheDir}/${file.name}`,
					size: fileMeta.size || 0, // In bytes
					modified: new Date(fileMeta.mtime || 0)
				});
			}
		}

		const totalSizeMB = fileSizes.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

		if (maxSize != null) {
			const clearSize = maxSize / 2;
			if (totalSizeMB > maxSize) {
				await clearOldestFiles(fileSizes, totalSizeMB - clearSize);
			}
		}
	} catch (error) {
		console.error('Error managing cache size:', error);
	}
}

export async function clearCache() {
	try {
		if (await exists(cacheDir, { baseDir: BaseDirectory.AppCache })) {
			await remove(cacheDir, { baseDir: BaseDirectory.AppCache, recursive: true });
			await mkdir(cacheDir, { baseDir: BaseDirectory.AppCache });
		}
	} catch (error) {
		console.error('Error managing clearing cache:', error);
	}
}

async function clearOldestFiles(fileSizes: { path: string; size: number; modified: Date }[], excessSizeMB: number): Promise<void> {
	// sort files by last modified time
	fileSizes.sort((a, b) => a.modified.getTime() - b.modified.getTime());

	let clearedSize = 0;
	for (const file of fileSizes) {
		if (clearedSize >= excessSizeMB * 1024 * 1024) break;

		try {
			await remove(file.path, { baseDir: BaseDirectory.AppCache });
			clearedSize += file.size;
		} catch (error) {
			console.error(`Failed to remove file ${file.path}:`, error);
		}
	}
}
