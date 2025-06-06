import { derived } from 'svelte/store';
import { friendsStore, instanceDataStore } from '$lib/svelte-stores';
import type { Friend } from '$lib/types/friend';
import type { InstanceData } from '$lib/types/instance';

// Derived store to get friends by instanceId
export const friendsByInstanceId = derived(
	[friendsStore, instanceDataStore],
	([$friends, $instanceDataStore]) => {
		const instanceFriendsMap = new Map<string, Friend[]>();

		$instanceDataStore.forEach((instanceData: InstanceData, userId: string) => {
			if (instanceData.instanceId) {
				const friend = $friends.get(userId);
				if (friend) {
					if (!instanceFriendsMap.has(instanceData.instanceId)) {
						instanceFriendsMap.set(instanceData.instanceId, []);
					}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					instanceFriendsMap.get(instanceData.instanceId).push(friend);
				}
			}
		});

		return instanceFriendsMap;
	}
);

// Function to get friends by instanceId
export const getFriendsByInstanceId = (instanceId: string) => {
	let instanceFriends: Friend[] = [];
	friendsByInstanceId.subscribe((map) => {
		instanceFriends = map.get(instanceId) || [];
	})();
	return instanceFriends;
};
