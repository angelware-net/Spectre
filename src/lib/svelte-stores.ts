import { writable } from 'svelte/store';
import type { UserData } from '$lib/types/user';
import type { Friend } from '$lib/types/friend';
import type { ExternalUserData } from '$lib/types/external-user';
import type { InstanceData } from '$lib/types/instance';

export const loadingStore = writable<boolean>(false);

export const onlineUsersStore = writable<number>(0);

export const currentUserStore = writable<UserData | null>(null);
export const friendsStore = writable<Map<string, Friend>>(new Map());
export const externalUserDataStore = writable<Map<string, ExternalUserData>>(new Map());
export const instanceDataStore = writable<Map<string, InstanceData>>(new Map());

export const loginStatusStore = writable<boolean>(false);

