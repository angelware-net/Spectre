<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		friendsOnline?: number;
	}

	let { friendsOnline = 0 }: Props = $props();
</script>

<Card.Root class="flex h-64 flex-col justify-between">
	<Card.Header>
		<Card.Title>Friends Online</Card.Title>
		<!--		<Card.Description>Current online friends count</Card.Description>-->
	</Card.Header>
	<Card.Content class="flex items-center justify-center">
		<div class="text-6xl">
			{friendsOnline}
		</div>
	</Card.Content>
	<Card.Footer class="flex items-center justify-center">
		<Button href="/friends">Friends List</Button>
	</Card.Footer>
</Card.Root>
