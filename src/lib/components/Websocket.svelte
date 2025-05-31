<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { loginStatusStore } from '$lib/svelte-stores';
	import { invoke } from '@tauri-apps/api/core';
	import { connectSocket, disconnectSocket } from '$lib/websocket';

	onMount(() => {
		loginStatusStore.subscribe(async (isLoggedIn) => {
			if (isLoggedIn) {
				await connectSocket();
			}
		});
	});

	onDestroy(async () => {
		await disconnectSocket();
	});
</script>
