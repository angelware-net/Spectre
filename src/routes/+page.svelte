<script lang="ts">
	import { onMount } from 'svelte';

	import { LoaderCircle } from 'lucide-svelte';

	import { loadingStore, onlineUsersStore } from '$lib/svelte-stores';

	// Loading boolean
	let isLoading = false;
	loadingStore.subscribe((value) => {
		isLoading = value;
	});

	// Online users count (verifies vrc is online)
	let onlineUsersCount: number = 0;
	onlineUsersStore.subscribe((value) => {
		onlineUsersCount = value;
	});

	// Mount function
	onMount(async () => {});
</script>

<main>
	<div class="flex h-96 flex-col items-center justify-center">
		{#if isLoading}
			<LoaderCircle class="animate-spin h-7" />
			<h2>Loading...</h2>
			{#if onlineUsersCount === 0}
				<p>Checking VRChat status...</p>
			{:else if onlineUsersCount === -1}
				<p>VRChat appears to be down! Spectre cannot run if VRChat is not available!</p>
			{/if}
		{:else}
			<h2>Finished Loading...</h2>
		{/if}
	</div>
</main>
