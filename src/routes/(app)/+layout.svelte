<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import GameLogger from '$lib/components/GameLogger.svelte';
	import { OverlayScrollbarsComponent } from 'overlayscrollbars-svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<Header />
<GameLogger />
<OverlayScrollbarsComponent
	class="h-[calc(100dvh-4rem)]"
	options={{ scrollbars: { theme: 'os-theme-thin-dark', autoHide: 'move' } }}
	defer
>
	{@render children?.()}
</OverlayScrollbarsComponent>