<script lang="ts">
	import { externalUserDataStore } from '$lib/svelte-stores';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { ExternalUserData } from '$lib/types/external-user';
	import { open } from '@tauri-apps/plugin-shell';

	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import Link from 'lucide-svelte/icons/link';
	import ArrowUpRight from 'lucide-svelte/icons/square-arrow-up-right';
	import Twitter from 'lucide-svelte/icons/twitter';
	import Twitch from 'lucide-svelte/icons/twitch';
	import YouTube from 'lucide-svelte/icons/youtube';
	import Github from 'lucide-svelte/icons/github';
	import Facebook from 'lucide-svelte/icons/facebook';
	import Instagram from 'lucide-svelte/icons/instagram';

	export let userId: string;
	let user: ExternalUserData | undefined;

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

	const linkIconMap: { [key: string]: any } = {
		'twitter.com': Twitter,
		'twitch.com': Twitch,
		'youtube.com': YouTube,
		'github.com': Github,
		'facebook.com': Facebook,
		'instagram.com': Instagram
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

	function getIconForLink(link: string) {
		for (const domain in linkIconMap) {
			if (link.includes(domain)) {
				return linkIconMap[domain];
			}
		}
		return Link;
	}

	function openUrl(link: string) {
		open(link);
		return null;
	}

	function openUserProfile() {
		open(`https://vrchat.com/home/user/${userId}`);
	}

	onMount(() => {
		const userMap = get(externalUserDataStore);
		user = userMap.get(userId);
	});
</script>

<div class="mt-5">
	<div class="grid gap-8">
		<div class="flex items-center gap-4">
			<Avatar.Root class="hidden h-9 w-9 sm:flex">
				<Avatar.Image src={user?.userIcon || user?.currentAvatarImageUrl} alt="Avatar" />
				<Avatar.Fallback>{user?.displayName?.charAt(0).toUpperCase() || 'NA'}</Avatar.Fallback>
			</Avatar.Root>
			<div class="grid gap-1">
				<p class="text-sm font-medium leading-none">
					{user?.displayName || 'Username'}
				</p>
				<p class="text-sm text-muted-foreground">{user?.statusDescription || user?.status}</p>
			</div>
			<div class="ml-auto">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button disabled class="ml-auto" variant="outline" size="icon">...</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-36">
						<DropdownMenu.Group>
							<DropdownMenu.Label>User Actions</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item on:click={openUserProfile} class="flex justify-between"
								><div>View on Web&nbsp;&nbsp;</div>
								<ArrowUpRight class="h-4 w-4" /></DropdownMenu.Item
							>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
		<div class="flex gap-2">
			{#each getFilteredTags(user?.tags) as tag}
				{#if tagToBadgeMap[tag]}
					<Badge variant="outline" style="border-color: {tagToColorMap[tag]}; color: white;">
						{tagToBadgeMap[tag]}
					</Badge>
				{/if}
			{/each}
		</div>
		<Separator class="" />
		<div class="flex flex-col space-y-2">
			<h1>Bio:</h1>
			<ScrollArea class="h-40 rounded-md border p-4" orientation="both">
				<p class="text-sm" style="white-space: pre-line">{user?.bio}</p>
			</ScrollArea>
		</div>
		<div class="flex flex-col space-y-2">
			<h1>Links:</h1>
			<div class="flex gap-4">
				{#each user?.bioLinks ?? [] as link}
					<Button variant="ghost" size="icon" on:click={openUrl(link)}>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<svelte:component this={getIconForLink(link)} />
							</Tooltip.Trigger>
							<Tooltip.Content>
								{link}
							</Tooltip.Content>
						</Tooltip.Root>
					</Button>
				{/each}
			</div>
		</div>
	</div>
</div>
