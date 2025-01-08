<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import ArrowUpRight from 'lucide-svelte/icons/square-arrow-up-right';

	import { onMount } from 'svelte';
	import { ArrowUp } from 'lucide-svelte';
	import { open } from '@tauri-apps/plugin-shell';

	const openTl = () => {
		open('https://vrchat.com/home/group/grp_e6233081-9aca-489a-8610-31af2b6cd438');
	};
</script>

<Card.Root class="flex h-64 flex-col justify-between">
	<Card.Header>
		<Card.Title>Join the Group</Card.Title>
		<Card.Description>Find other players using Spectre!</Card.Description>
	</Card.Header>
	<Card.Content class="flex items-center justify-center">
		<Button on:click={openTl}>Join&nbsp;<ArrowUpRight class="h-4 w-4" /></Button>
	</Card.Content>
	<Card.Footer class="flex items-center justify-center"></Card.Footer>
</Card.Root>
