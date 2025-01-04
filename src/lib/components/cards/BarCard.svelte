<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import Bars from '$lib/components/content/Bars.svelte';
</script>

<Card.Root class="flex h-64 flex-col items-center justify-center object-center">
	<Card.Content class="flex items-center justify-center object-center p-6">
		<Bars />
	</Card.Content>
</Card.Root>
