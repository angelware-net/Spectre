import type { WebsocketFriendLocation } from '$lib/types/websocket/websocket-friend-location';
import { friendsStore, instanceDataStore } from '$lib/svelte-stores';
import { get } from 'svelte/store';
import type { Friend } from '$lib/types/friend';
import type { WebsocketFriendOnline } from '$lib/types/websocket/websocket-friend-online';
import type { WebsocketFriendOffline } from '$lib/types/websocket/websocket-friend-offline';
import { invoke } from '@tauri-apps/api/core';
import type { ExternalUserData } from '$lib/types/external-user';
import type { WebsocketFriendActive } from '$lib/types/websocket/websocket-friend-active';
import type { InstanceData } from '$lib/types/instance';

export async function updateFriendLocation(msg: WebsocketFriendLocation) {
	let needsNewFriend = false;

	friendsStore.update((map) => {
		const current = map.get(msg.userId);
		if (!current) {
			needsNewFriend = true;
			return map;
		}

		const patch = patchFriend(msg);
		if (shallowEqualSubsetUtil(current, patch)) return map;

		const newMap = new Map(map);
		newMap.set(msg.userId, { ...current, ...patch });
		return newMap;
	});

	if (needsNewFriend) {
		await insertNewFriend(msg.userId);
		return;
	}

	if (msg.location != 'private') {
		let updatedInstanceString = await invoke<string>('get_vrc_instance', {
			instanceId: msg.location
		});
		let updatedInstance: InstanceData = JSON.parse(updatedInstanceString);

		instanceDataStore.update((map) => {
			const newMap = new Map(map);
			newMap.set(msg.userId, updatedInstance);
			return newMap;
		});
	} else {
		instanceDataStore.update((map) => {
			const newMap = new Map(map);
			newMap.delete(msg.userId);
			return newMap;
		});
	}
}

export async function updateFriendOffline(msg: WebsocketFriendOffline) {
	friendsStore.update((map) => {
		const current = map.get(msg.userId);
		if (!current) {
			return map;
		}

		current.location = 'offline';
		current.platform = 'offline';

		const newMap = new Map(map);
		newMap.set(msg.userId, current);
		return newMap;
	});
}

export async function updateFriendOnline(msg: WebsocketFriendOnline) {
	await insertNewFriend(msg.userId);
}

export async function updateFriendActive(msg: WebsocketFriendActive) {
	await insertNewFriend(msg.userId);
}

async function insertNewFriend(userId: string) {
	let newFriendString = await invoke<string>('get_vrc_user', {
		userId: userId
	});

	const user: ExternalUserData = JSON.parse(newFriendString);

	let newFriend: Friend = {
		bio: user.bio,
		bioLinks: user.bioLinks,
		currentAvatarImageUrl: user.currentAvatarImageUrl,
		currentAvatarTags: user.currentAvatarTags,
		currentAvatarThumbnailImageUrl: user.currentAvatarThumbnailImageUrl,
		developerType: user.developerType,
		displayName: user.displayName,
		fallbackAvatar: user.fallbackAvatar,
		friendKey: user.friendKey,
		id: user.id,
		isFriend: user.isFriend,
		last_platform: user.last_platform,
		location: user.location,
		platform: user.platform,
		profilePicOverride: user.profilePicOverride,
		pronouns: user.pronouns,
		status: user.status,
		statusDescription: user.statusDescription,
		tags: user.tags,
		userIcon: user.userIcon
	};

	friendsStore.update((map) => {
		const current = map.get(userId);

		const newMap = new Map(map);
		newMap.set(userId, {...current, ...newFriend});
		return newMap;
	});
}

// Utilities
function patchFriend(msg: WebsocketFriendLocation): Partial<Friend> {
	const u = msg.user;
	return {
		bio: u.bio,
		bioLinks: u.bioLinks,
		currentAvatarImageUrl: u.currentAvatarImageUrl,
		currentAvatarThumbnailImageUrl: u.currentAvatarThumbnailImageUrl,
		currentAvatarTags: u.currentAvatarTags,
		developerType: u.developerType,
		displayName: u.displayName,
		id: u.id,
		isFriend: u.isFriend,
		last_platform: u.last_platform,
		profilePicOverride: u.profilePicOverride,
		pronouns: u.pronouns,
		status: u.status,
		statusDescription: u.statusDescription,
		tags: u.tags,
		userIcon: u.userIcon,
		location: msg.location,
		platform: msg.platform,
	};
}

function shallowEqualSubsetUtil<T extends object>(base: T, subset: Partial<T>): boolean {
	for (const k in subset) {
		if (base[k] !== subset[k]) return false;
	}
	return true;
}
