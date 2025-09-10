// VRC prevents image hotlinking, so we must proxy image requests through our backend in order to load images

// Images are cached via tauri fs in the application cache dir, with blob urls being cached in a hash map for quick load
// during runtime.

import { fetch } from '@tauri-apps/plugin-http';
import { BaseDirectory, mkdir, exists, writeFile, readFile } from '@tauri-apps/plugin-fs';

const cacheDir = 'cache';
const blobUrlMap = new Map<string, string>();

/*
 * Fetches images as binary data, and converts to a blob url.
 */
export async function loadImage(url: string): Promise<string> {
	try {
		if (blobUrlMap.has(url)) {
			return blobUrlMap.get(url)!;
		}

		// Create a file name based on url
		const fileName = btoa(url).replace(/=/g, '');
		const cachedImage = await loadImageFromCache(fileName);

		let blobUrl: string;
		if (cachedImage) {
			// Create a Blob URL from cached binary data
			blobUrl = createBlobUrl(cachedImage);
		} else {
			// Fetch and cache the image
			const response = await fetch(url, { method: 'GET' });
			const blob = await response.blob();
			const binaryData = new Uint8Array(await blob.arrayBuffer());

			// Save the image to the cache and create a Blob URL
			await saveImageToCache(fileName, binaryData);
			blobUrl = createBlobUrl(binaryData);
		}

		// Cache the Blob URL in memory
		blobUrlMap.set(url, blobUrl);

		return blobUrl;
	} catch (error) {
		console.error('Error loading image:', error);
		throw new Error(`Failed to load image from ${url}`);
	}
}

// Check the cache dir exists
async function checkDirectory() {
	const dirExists: boolean = await exists(cacheDir, { baseDir: BaseDirectory.AppCache });

	if (!dirExists) await mkdir(cacheDir, { baseDir: BaseDirectory.AppCache });
}

// Save binary image data to cache as file
async function saveImageToCache(fileName: string, binaryData: Uint8Array): Promise<void> {
	await checkDirectory();
	await writeFile(`${cacheDir}/${fileName}`, binaryData, { baseDir: BaseDirectory.AppCache });
}

// Load image from cached blob
async function loadImageFromCache(fileName: string): Promise<Uint8Array | null> {
	const filePath = `${cacheDir}/${fileName}`;
	const isCached = await exists(filePath, { baseDir: BaseDirectory.AppCache });

	if (isCached) {
		return await readFile(filePath, { baseDir: BaseDirectory.AppCache });
	}

	return null;
}

// Create a blob url for binary data
function createBlobUrl(binaryData: Uint8Array): string {
	const blob = new Blob([binaryData], { type: 'image/png' }); // Adjust MIME type as needed
	return URL.createObjectURL(blob);
}
