<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import GameLogger from '$lib/components/GameLogger.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<Header />
<GameLogger />
{@render children?.()}