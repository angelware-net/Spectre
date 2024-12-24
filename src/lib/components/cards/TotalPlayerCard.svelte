<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import { onMount } from 'svelte';

	export let totalOnline: number = 0; // Define the prop
</script>

<Card.Root class="flex h-64 flex-col justify-between">
	<Card.Header>
		<Card.Title>Total Online Players</Card.Title>
		<Card.Description>Current amount of players exploring VRChat</Card.Description>
	</Card.Header>
	<Card.Content class="flex h-32 justify-center text-center">
		<div class="text-6xl">
			{totalOnline}
		</div>
	</Card.Content>
</Card.Root>
