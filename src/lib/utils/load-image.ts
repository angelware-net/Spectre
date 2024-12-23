// VRC prevents image hotlinking, so we must proxy image requests through our backend in order to load images
// TODO: Implement image caching

import { fetch } from '@tauri-apps/plugin-http';

export async function loadImage(url: string): Promise<string> {
	try {
		// Fetch the image as binary data
		const response = await fetch(url, { method: 'GET' });

		// Convert the binary data to a Blob
		const blob = await response.blob(); // Adjust MIME type as needed

		const forcedBlob = new Blob([blob], { type: 'image/png' });

		// Create and return a blob URL
		return URL.createObjectURL(forcedBlob);
	} catch (error) {
		console.error('Error loading image:', error);
		throw new Error(`Failed to load image from ${url}`);
	}
}