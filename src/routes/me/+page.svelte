<script lang="ts">
	import { currentUserStore } from '$lib/svelte-stores';
	import type { UserData } from '$lib/types/user';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let currentUser: UserData | null;

	onMount(async () => {
		currentUser = get(currentUserStore);

		if (currentUser == null) {
			await goto('/');
		}
	});
</script>

<main class="p-4">
	<div class="p-4">
		<div class="grid grid-cols-2">
			<div class="text-3xl">{currentUser?.displayName}</div>
			<div class="flex flex-row items-end justify-end text-end">
			</div>
		</div>
	</div>
</main>