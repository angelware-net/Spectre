<script lang="ts">
	import { currentUserStore } from '$lib/svelte-stores';
	import type { UserData } from '$lib/types/user';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { open } from '@tauri-apps/plugin-shell';

	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs';

	import Bio from '$lib/components/me/Bio.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import OwnAvatar from '$lib/components/me/OwnAvatar.svelte';

	let currentUser: UserData | null;

	onMount(() => {
		currentUser = get(currentUserStore);

		if (currentUser == null) {
			goto('/');
		}
	});

	const tagToBadgeMap: { [key: string]: string } = {
		system_supporter: 'VRC+',
		system_trust_basic: 'User',
		system_trust_known: 'Known User',
		system_trust_trusted: 'Trusted User',
		language_eng: 'English',
		language_tur: 'Turkish',
		language_deu: 'Deutch',
		language_jp: 'Japanese',
		language_kor: 'Korean',
		language_por: 'Portuguese'
	};

	const tagToColorMap: { [key: string]: string } = {
		system_trust_basic: 'blue',
		system_trust_known: 'orange',
		system_trust_trusted: 'purple',
		system_supporter: 'gold',
		language_eng: 'white',
		language_tur: 'white',
		language_deu: 'white',
		language_jp: 'white',
		language_kor: 'white',
		language_por: 'white'
	};

	const tagPriority = {
		system_trust_trusted: 3,
		system_trust_known: 2,
		system_trust_basic: 1
	};

	function getFilteredTags(tags) {
		if (!tags) return [];

		const prioritizedTag = tags.reduce((highest, tag) => {
			if (tagPriority[tag] > (tagPriority[highest] || 0)) {
				return tag;
			}
			return highest;
		}, null);

		const nonPrioritizedTags = tags.filter((tag) => !tagPriority[tag] || tag === prioritizedTag);
		return [prioritizedTag, ...nonPrioritizedTags.filter((tag) => tag !== prioritizedTag)];
	}

	function openProfile() {
		if (currentUser != null) open(`https://vrchat.com/home/user/${currentUser.id}`);
	}

	function formatUserData(userData: UserData | null): string {
		return JSON.stringify(userData, null, 2);
	}
</script>

<main class="p-4">
	<!-- Header -->
	<div class="p-8 pb-6 pt-4">
		<div class="grid grid-cols-2">
			<div class="flex items-center">
				<Avatar.Root class="mr-4 hidden h-16 w-16 sm:flex">
					<Avatar.Image
						src={currentUser?.userIcon || currentUser?.currentAvatarImageUrl}
						alt="Avatar"
					/>
					<Avatar.Fallback
						>{currentUser?.displayName?.charAt(0).toUpperCase() || 'NA'}</Avatar.Fallback
					>
				</Avatar.Root>
				<div class="grid gap-1">
					<div class="flex flex-row">
						<p class="text-xl font-medium leading-none">
							{currentUser?.displayName || 'Username'}
						</p>
						<p class="p-2 pb-0 pt-0">
							{#each getFilteredTags(currentUser?.tags) as tag}
								{#if tagToBadgeMap[tag]}
									<Badge
										class="mr-1"
										variant="outline"
										style="border-color: {tagToColorMap[tag]}; color: white;"
									>
										{tagToBadgeMap[tag]}
									</Badge>
								{/if}
							{/each}
						</p>
					</div>
					<p class="text-sm text-muted-foreground">
						{currentUser?.statusDescription || currentUser?.status}
					</p>
				</div>
			</div>
			<div class="flex flex-grow items-center justify-end">
				<Button on:click={openProfile} class="ml-auto font-medium">View Website</Button>
			</div>
			<div class="flex flex-row items-end justify-end text-end"></div>
		</div>
	</div>
	<Separator />

	<!-- Tabs -->
	<div class="flex items-center justify-center pt-4">
		<Tabs.Root value="bio" class="w-[620px]">
			<Tabs.List class="grid w-full grid-cols-4">
				<Tabs.Trigger value="bio">Bio</Tabs.Trigger>
				<Tabs.Trigger value="avatar">Avatars</Tabs.Trigger>
				<Tabs.Trigger value="worlds">Worlds</Tabs.Trigger>
				<Tabs.Trigger value="json">JSON</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="bio">
				<div class="pt-2">
					<Bio {currentUser} />
				</div>
			</Tabs.Content>
			<Tabs.Content value="avatar">
				<div class="pt-2">
					{#if currentUser !== null}
						{#if currentUser?.id}
							<OwnAvatar userId={currentUser.id} />
						{:else}
							<p>Avatar data is not available.</p>
						{/if}
					{:else}
						Avatar couldn't be loaded!
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="worlds">
				{#if currentUser !== null}
					<div class="flex h-full w-full items-center justify-center">Coming Soon!</div>
				{:else}
					Avatar couldn't be loaded!
				{/if}
			</Tabs.Content>
			<Tabs.Content value="json">
				<div class="flex h-full">
					<ScrollArea class="flex w-full overflow-auto rounded-md border p-4" orientation="both">
						<pre class="text-sm" style="white-space: pre-line">{formatUserData(currentUser)}</pre>
					</ScrollArea>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</main>
