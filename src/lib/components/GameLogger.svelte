<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { killProcess, spawnProcess } from '$lib/gamelog/gamelog-reader';

	onMount(async () => {
		await spawnProcess();
	});

	onDestroy(async () => {
		await killProcess();
	});
</script>