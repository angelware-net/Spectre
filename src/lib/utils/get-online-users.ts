import { get } from 'svelte/store';
import { friendsStore } from '$lib/svelte-stores';

export const getOnlineUsers = async () => {
	const friendsData = get(friendsStore);

	let joinableUsersCount = 0;

	friendsData.forEach((friend) => {
		if (friend.platform != 'web' && friend.location != 'offline' && friend.location != '') {
			joinableUsersCount++;
		}
	});

	return joinableUsersCount;
};
