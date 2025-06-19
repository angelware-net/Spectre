<script lang="ts">
	import LoginHeader from '$lib/components/LoginHeader.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<LoginHeader />
{@render children?.()}