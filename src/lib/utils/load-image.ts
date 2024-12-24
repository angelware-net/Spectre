// VRC prevents image hotlinking, so we must proxy image requests through our backend in order to load images
// TODO: Implement image caching

import { fetch } from '@tauri-apps/plugin-http';

/*
 * Fetches images as binary data, and converts to a blob url.
 */
export async function loadImage(url: string): Promise<string> {
	try {
		const response = await fetch(url, { method: 'GET' });

		const blob = await response.blob();

		const forcedBlob = new Blob([blob], { type: 'image/png' });

		return URL.createObjectURL(forcedBlob);
	} catch (error) {
		console.error('Error loading image:', error);
		throw new Error(`Failed to load image from ${url}`);
	}
}
