// Similar to v1.0, we are going to have one large function to populate all stores.

// System
import { invoke } from '@tauri-apps/api/core';

// Types
import type { Friend } from '$lib/types/friend';
import type { ExternalUserData } from '$lib/types/external-user';
import type { InstanceData } from '$lib/types/instance';

// Stores
import { friendsStore, instanceDataStore } from '$lib/svelte-stores';
import { get } from 'svelte/store';

// Delay util function
function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadData() {
	try {
		// Load friends list
		const friendsResponse = await invoke<string>('get_vrc_friends');
		const friendsList: Friend[] = JSON.parse(friendsResponse);
		friendsStore.set(new Map(friendsList.map((friend) => [friend.id, friend])));

		// Setup maps
		const instanceDataMap = new Map<string, InstanceData>();

		const batchSize = 150;
		for (let i = 0; i < friendsList.length; i += batchSize) {
			const batch = friendsList.slice(i, i + batchSize);

			await Promise.all(
				batch.map(async (friend) => {
					try {
						// If location is public, load and map location data
						if (
							friend.location &&
							friend.location !== 'private' &&
							friend.location !== 'offline'
						) {
							const instanceString = await invoke<string>('get_vrc_instance', {
								instanceId: friend.location
							});
							const instanceData: InstanceData = JSON.parse(instanceString);
							instanceDataMap.set(friend.id, instanceData);
						}
					} catch (error) {
						console.error(`Error loading user data for ${friend.id}`, error);
					}
				})
			);

			// Wait 1 second before sending the next batch
			await delay(10);
		}

		instanceDataStore.set(instanceDataMap);
	} catch (e) {
		console.error('Error loading data: ' + e);
	}
}

export const reloadData = async (forceReload: boolean) => {
	const friends = get(friendsStore);
	const instanceStore = get(instanceDataStore);

	if (
		forceReload ||
		friends.size === 0 ||
		instanceStore.size === 0
	) {
		console.log('Reloading data...');
		await loadData();
	} else {
		console.log('Skipping reload, data exists...');
	}
};
