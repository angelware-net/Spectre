<script lang="ts">
	import { LoaderCircle } from 'lucide-svelte';
	import { onlineUsersStore } from '$lib/svelte-stores';

	// Online users count (verifies vrc is online)
	let onlineUsersCount: number = $state(0);
	onlineUsersStore.subscribe((value) => {
		onlineUsersCount = value;
	});
</script>

<main>
	<div class="flex h-96 flex-col items-center justify-center">
		<LoaderCircle class="h-7 animate-spin transition-all" />
		<h2>Loading...</h2>
		{#if onlineUsersCount === 0}
			<p>Checking VRChat status...</p>
		{:else if onlineUsersCount === -1}
			<p>VRChat appears to be down! Spectre cannot run if VRChat is not available!</p>
		{/if}
	</div>
</main>
