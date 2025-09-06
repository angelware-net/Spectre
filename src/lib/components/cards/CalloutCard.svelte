<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import { onMount } from 'svelte';
</script>

<Card.Root class="flex min-h-64 h-full flex-col items-center justify-center">
	<Card.Content class="flex items-center justify-center">
		<div class="flex text-2xl">Get out there and explore!</div>
	</Card.Content>
	<Card.Footer class="flex items-center justify-center">
		<Button href="/instances">View Instances</Button>
	</Card.Footer>
</Card.Root>
