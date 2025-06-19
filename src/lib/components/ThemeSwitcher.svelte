<script lang="ts">
	import { mode } from 'mode-watcher';
	import { handleModeChange } from '$lib/utils/theme-switcher';
	import { onMount } from 'svelte';

	$effect(() => {
		if (mode.current) {
			void handleModeChange(mode.current === 'dark');
		}
	});
</script>
