import { get } from 'svelte/store';
import { friendsStore } from '$lib/svelte-stores';

export const getJoinableUsers = async () => {
	const friendsData = get(friendsStore);

	let joinableUsersCount = 0;

	friendsData.forEach((friend) => {
		if (friend.platform != 'web' && friend.location != 'private' && friend.location != 'offline') {
			joinableUsersCount++;
		}
	});

	return joinableUsersCount;
};
