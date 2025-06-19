<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { killProcess, spawnProcess } from '$lib/gamelog/gamelog-reader';
	import { loadDb } from '$lib/gamelog/gamelog-sql';

	onMount(async () => {
		await loadDb();
		await spawnProcess();
	});

	onDestroy(async () => {
		await killProcess();
	});
</script>