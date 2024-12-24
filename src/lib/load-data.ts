// Similar to v1.0, we are going to have one large function to populate all stores.

// System
import { invoke } from '@tauri-apps/api/core';

// Types
import type { Friend } from '$lib/types/friend';
import type { ExternalUserData } from '$lib/types/external-user';
import type { InstanceData } from '$lib/types/instance';

// Stores
import { externalUserDataStore, friendsStore, instanceDataStore } from '$lib/svelte-stores';
import { get } from 'svelte/store';

// Delay util function
function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadData() {
	// Load friends list
	const friendsResponse = await invoke<string>('get_vrc_friends');
	const friendsList: Friend[] = JSON.parse(friendsResponse);
	friendsStore.set(new Map(friendsList.map((friend) => [friend.id, friend])));
	console.log(friendsList);

	// Setup maps
	const userDataMap = new Map<string, ExternalUserData>();
	const instanceDataMap = new Map<string, InstanceData>();

	// Limit to 50 requests per second
	const batchSize = 150;
	for (let i = 0; i < friendsList.length; i += batchSize) {
		const batch = friendsList.slice(i, i + batchSize);

		await Promise.all(
			batch.map(async (friend) => {
				try {
					// Load user's data
					const userString = await invoke<string>('get_vrc_user', {
						userId: friend.id
					});
					const userData: ExternalUserData = JSON.parse(userString);
					userDataMap.set(friend.id, userData);

					// If location is public, load and map location data
					if (
						userData.location &&
						userData.location !== 'private' &&
						userData.location !== 'Private' &&
						userData.location !== 'offline'
					) {
						const instanceString = await invoke<string>('get_vrc_instance', {
							instanceId: userData.location
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

	externalUserDataStore.set(userDataMap);
	instanceDataStore.set(instanceDataMap);
}

export const reloadData = async (forceReload: boolean) => {
	const friends = get(friendsStore);
	const externalUserData = get(externalUserDataStore);
	const instanceStore = get(instanceDataStore);

	if (
		forceReload ||
		friends.size === 0 ||
		externalUserData.size === 0 ||
		instanceStore.size === 0
	) {
		console.log('Reloading data...');
		await loadData();
	}
};
