<script lang="ts">
	import { onMount } from 'svelte';
	import type { OwnAvatarData } from '$lib/types/avatar-own';
	import { invoke } from '@tauri-apps/api/core';
	import type { UserData } from '$lib/types/user';
	import { Separator } from '$lib/components/ui/separator';
	import { loadImage } from '$lib/utils/load-image';

	export let userId: string;

	let loading: boolean = true;
	let ownAvatar: OwnAvatarData;

	async function fetchCurrentAvatar() {
		try {
			console.log(userId);
			let ownAvatarString = await invoke<string>('get_vrc_current_avatar', { userId: userId })
			ownAvatar = JSON.parse(ownAvatarString);
		} catch (error) {
			console.error('Failed to load avatar data:', error);
		}
	}

	onMount(async () => {
		loading = true;
		await fetchCurrentAvatar();
		loading = false;
	});

</script>

<main>
	{#if !loading}
		<div>
			<div>
				<h1 class="text-xl text">
					Current Avatar
				</h1>
				<div class="p-4 pl-0 flex flex-row">
					<div class="flex w-full rounded-lg overflow-hidden">
						{#await loadImage(ownAvatar.imageUrl)}
							Loading Avatar Thumbnail...
						{:then url}
							<img src="{url}" alt="Avatar Thumbnail"/>
						{:catch error}
							Error Loading Avatar Thumbnail ({error})
						{/await}
					</div>
					<div class="flex flex-col w-full p-6">
						<h1 class="text-3xl">
							{ownAvatar.name}
						</h1>
						<h1 class="text-lg">
							{ownAvatar.authorName}
						</h1>
					</div>
				</div>
			</div>
			<Separator />
			<div>
				<h1 class="pt-2 text-xl text">
					Uploaded Avatars
				</h1>
				<div class="flex w-full text-center justify-center p-6">
					Coming soon!
				</div>
			</div>
		</div>
	{:else}
		<div>
			Loading...
		</div>
	{/if}
</main>