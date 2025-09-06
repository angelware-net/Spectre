<script lang="ts">
	import { LoaderCircle } from 'lucide-svelte';
	import { loadingStore, onlineUsersStore } from '$lib/svelte-stores';

	// Loading boolean
	let isLoading = $state(true);
	loadingStore.subscribe((value) => {
		isLoading = value;
	});

	// Online users count (verifies vrc is online)
	let onlineUsersCount: number = $state(0);
	onlineUsersStore.subscribe((value) => {
		onlineUsersCount = value;
	});
</script>

<main>
	<div class="flex h-96 flex-col items-center justify-center">
		{#if isLoading}
			<LoaderCircle class="h-7 animate-spin transition-all" />
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
