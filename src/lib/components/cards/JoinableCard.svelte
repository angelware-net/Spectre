<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	export let joinableOnline: number = 0;
</script>

<Card.Root class="flex h-64 flex-col justify-between">
	<Card.Header>
		<Card.Title>Joinable Friends</Card.Title>
	</Card.Header>
	<Card.Content class="flex items-center justify-center">
		<div class="text-6xl">
			{joinableOnline}
		</div>
	</Card.Content>
	<Card.Footer class="flex items-center justify-center">
		<Button href="/friends">Friends List</Button>
	</Card.Footer>
</Card.Root>
