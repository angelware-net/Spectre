import { get } from 'svelte/store';
import { friendsStore } from '$lib/svelte-stores';
import { externalUserDataStore } from '$lib/svelte-stores';

export const getJoinableUsers = async () => {
	const friendsData = get(friendsStore);
	const userData = get(externalUserDataStore);

	let joinableUsersCount = 0;

	friendsData.forEach(friend => {
		const user = userData.get(friend.id);
		if (user?.location !== "private" && user?.location !== "offline") {
			joinableUsersCount++;
		}
	});

	return joinableUsersCount;
};
