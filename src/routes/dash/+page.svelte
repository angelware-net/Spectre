<script lang="ts">
	import FriendsCard from '$lib/components/cards/FriendsCard.svelte';
	import JoinableCard from '$lib/components/cards/JoinableCard.svelte';
	import TotalPlayerCard from '$lib/components/cards/TotalPlayerCard.svelte';
	import CalloutCard from '$lib/components/cards/CalloutCard.svelte';
	import BarCard from '$lib/components/cards/BarCard.svelte';
	import EventsCard from '$lib/components/cards/EventsCard.svelte';
	import { onMount } from 'svelte';

	import { reloadData } from '$lib/load-data';
	import { getOnlineUsers } from '$lib/utils/get-online-users';
	import { getJoinableUsers } from '$lib/utils/get-joinable-users';
	import { getGlobalUserCount } from '$lib/utils/get-global-count';
	import { get } from 'svelte/store';
	import { instanceDataStore, friendsStore, externalUserDataStore } from '$lib/svelte-stores';

	let onlineFriendsCount = 0;
	let joinableUsersCount = 0;
	let onlineUsers = 0;
	let loading = true;

	onMount(async () => {
		// loading = true;
		await reloadData(false);

		onlineFriendsCount = await getOnlineUsers();

		joinableUsersCount = await getJoinableUsers();
		console.log(joinableUsersCount);

		onlineUsers = await getGlobalUserCount();
		console.log(onlineUsers);

		await initializeData();
		// loading = false;
	});

	const initializeData = async (forceReload = false) => {
		const friends = get(friendsStore);
		const externalUserData = get(externalUserDataStore);
		const instanceStore = get(instanceDataStore);

		if (
			forceReload ||
			friends.size === 0 ||
			externalUserData.size === 0 ||
			instanceStore.size === 0
		) {
			// loading = true;
			console.log(`Reloading Data: ${forceReload}`);
			await reloadData(forceReload);
			// loading = false;
		}
	};
</script>

<!--{#if loading}-->
<!--	<div>loading...</div>-->
<!--{:else}-->
	<div class="grid h-1/2 grid-cols-4 p-4">
		<div class="gap-4 p-4">
			<FriendsCard friendsOnline={onlineFriendsCount} />
		</div>
		<div class="h-1/2 gap-4 p-4">
			<JoinableCard joinableOnline={joinableUsersCount} />
		</div>
		<div class="col-span-2 h-1/2 gap-4 p-4">
			<CalloutCard />
		</div>
		<div class="col-span-2 h-1/2 gap-4 p-4">
			<TotalPlayerCard totalOnline={onlineUsers} />
		</div>
		<div class="gap-4 p-4">
			<BarCard />
		</div>
		<div class="h-1/2 gap-4 p-4">
			<EventsCard />
		</div>
	</div>
<!--{/if}-->
