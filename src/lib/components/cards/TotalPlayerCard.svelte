<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import { onMount } from 'svelte';

	interface Props {
		totalOnline?: number;
	}

	let { totalOnline = 0 }: Props = $props();
</script>

<Card.Root class="flex min-h-64 h-full flex-col justify-between">
	<Card.Header>
		<Card.Title>Total Online Players</Card.Title>
		<Card.Description>Current amount of players exploring VRChat</Card.Description>
	</Card.Header>
	<Card.Content class="flex h-32 justify-center text-center">
		<div class="text-6xl">
			{totalOnline}
		</div>
	</Card.Content>
	<Card.Footer></Card.Footer>
</Card.Root>
