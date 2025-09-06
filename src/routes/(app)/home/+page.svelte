<script lang="ts">
	import '$lib/styles/stars.css';
	import ArrowUpRight from 'lucide-svelte/icons/square-arrow-up-right';
	import { Button } from '$lib/components/ui/button/index.js';
	import { currentUserStore, friendsStore, externalUserDataStore } from '$lib/svelte-stores';
	import type { UserData } from '$lib/types/user';
	import { goto } from '$app/navigation';
	import Footer2 from '$lib/components/Footer2.svelte';
	import type { Friend } from '$lib/types/friend';
	import type { ExternalUserData } from '$lib/types/external-user';

	export function delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Subscribe to the user store and get the online friends count
	currentUserStore.subscribe(async (userData: UserData | null) => {
		await delay(1000);
		if (!userData) {
			// If userData is null, redirect to home page
			goto('/');
			console.log('Homepage: userData was null, returning to root.');
		}
	});

	const isJoinable = (friend: Friend, user: ExternalUserData | undefined) =>
		user &&
		user.location !== 'offline' &&
		user.location !== '' &&
		user.status !== 'offline' &&
		user.state !== 'active';

	let onlineFriendsCount = $derived.by(() => {
		const friends = $friendsStore;
		const users = $externalUserDataStore;

		let count = 0;
		for (const friend of friends.values()) {
			const user = users.get(friend.id);
			if (isJoinable(friend, user)) count++;
		}
		return count;
	});
</script>

<div>
	<div class="content flex h-96 items-center justify-end p-10 text-end">
		<div>
			<div class="p-4">
				<p class="font-mono text-5xl">Welcome</p>
				<p class="font-mono text-2xl">Friends Online: <b>{onlineFriendsCount}</b></p>
			</div>
			<div class="p-4">
				<Button href="/dash">Dashboard&nbsp;<ArrowUpRight class="h-4 w-4" /></Button>
			</div>
		</div>
	</div>

	<div class="stars-container">
		<div class="sky">
			<div class="stars"></div>
			<div class="stars1"></div>
			<div class="stars2"></div>
		</div>
	</div>

	<div class="absolute bottom-0 overflow-hidden">
		<Footer2 />
	</div>
</div>

<style>
	.content {
		z-index: 10;
	}
</style>
