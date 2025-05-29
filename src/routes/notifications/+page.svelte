<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';

	let notifs: string;

	onMount(async () => {
		notifs = await invoke<string>('get_vrc_notifications');
		console.log(notifs);
	});
</script>

<main>
	{notifs}
</main>
