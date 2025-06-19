<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { instanceDataStore } from '$lib/svelte-stores';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { InstanceData } from '$lib/types/instance';
	import type { ExternalUserData } from '$lib/types/external-user';
	import type { Friend } from '$lib/types/friend';
	import type { GroupData } from '$lib/types/group';
	import { invoke } from '@tauri-apps/api/core';
	import { getFriendsByInstanceId } from '$lib/utils/get-friend-by-instance';
	import { toast } from 'svelte-sonner';
	import { loadImage } from '$lib/utils/load-image';
	import { getFriendImage } from '$lib/utils/get-friend-image';

	interface Props {
		userId: string;
	}

	let { userId }: Props = $props();
	let instance: InstanceData | undefined = $state();
	let instanceOwnerUser: ExternalUserData | undefined = $state();
	let instanceOwnerGroup: GroupData | undefined = $state();
	let friendsInInstance: Friend[] = $state([]);

	let instanceImage: string = $state();
	let instanceOwnerImage: string = $state();
	let instanceGroupOwnerImage: string = $state();

	const openUrl = (link: string) => {
		open(link);
		toast('Opening instance in browser...');
	};

	const joinUrl = (link: string) => {
		open(link);
		toast('Joining instance through weblink...');
	};

	const inviteMyself = (worldId: string, instanceId: string) => {
		// sendInviteToMyself(worldId, instanceId);
		toast('Invite sent!');
	};

	onMount(async () => {
		const userMap = get(instanceDataStore);
		instance = userMap.get(userId);

		if (instance != undefined) instanceImage = instance.world.thumbnailImageUrl;

		if (instance?.ownerId.startsWith('usr')) {
			let instanceOwnerUserJson = await invoke<string>('get_vrc_user', {
				userId: instance?.ownerId
			});
			instanceOwnerUser = JSON.parse(instanceOwnerUserJson);

			if (instanceOwnerUser != undefined && instanceOwnerUser.userIcon != '') {
				instanceOwnerImage = await loadImage(instanceOwnerUser.userIcon);
			} else if (instanceOwnerUser != undefined) {
				instanceOwnerImage = await loadImage(instanceOwnerUser.currentAvatarImageUrl);
			}
		} else if (instance?.ownerId.startsWith('grp')) {
			let instanceOwnerGroupJson = await invoke<string>('get_vrc_group', {
				groupId: instance?.ownerId
			});
			instanceOwnerGroup = JSON.parse(instanceOwnerGroupJson);

			if (instanceOwnerGroup != undefined && instanceOwnerGroup.iconUrl != '') {
				instanceGroupOwnerImage = await loadImage(instanceOwnerGroup.iconUrl);
			}
		}

		if (instance?.instanceId) {
			friendsInInstance = getFriendsByInstanceId(instance.instanceId);
		}
	});
</script>

<div class="mt-5">
	<div class="grid gap-8">
		<!--Section-->
		<div class="flex items-center gap-4">
			<Avatar.Root class="hidden h-11 w-11 sm:flex">
				<Avatar.Image src={instanceImage} alt="World Thumbnail" />
				<Avatar.Fallback>{instance?.world?.name?.charAt(0).toUpperCase() || 'NA'}</Avatar.Fallback>
			</Avatar.Root>
			<div class="grid gap-1">
				<p class="text-sm font-medium leading-none">
					{instance?.world.name || 'World Name'}
				</p>
				<p class="text-sm text-muted-foreground">
					({instance?.userCount} / {instance?.recommendedCapacity}) [{instance?.capacity}]
				</p>
				<p class="text-sm text-muted-foreground">
					{#if instance?.type === 'hidden'}
						Friends+
					{:else if instance?.type === 'friends'}
						Friends
					{:else if instance?.type === 'group'}
						{#if instance?.groupAccessType === 'plus'}
							Group+
						{:else if instance?.groupAccessType === 'public'}
							Group Public
						{:else}
							Group
						{/if}
					{:else if instance?.type === 'public'}
						Public
					{:else}
						Public
					{/if}
				</p>
			</div>
			<div class="ml-auto">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button class="ml-auto font-medium" variant="outline" size="icon">...</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Label>Options</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								on:click={joinUrl(
									`vrchat://launch?ref=vrchat.com&id=${instance?.worldId}:${instance?.instanceId}`
								)}
							>
								Join Instance
							</DropdownMenu.Item>
							<DropdownMenu.Item on:click={inviteMyself(instance?.worldId, instance?.instanceId)}
								>Invite Me
							</DropdownMenu.Item>
							<DropdownMenu.Item
								on:click={openUrl(
									`https://vrchat.com/home/launch?worldId=${instance?.worldId}&instanceId=${instance?.instanceId}`
								)}
							>
								Open Instance
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		<!--Section-->
		<div class="flex flex-col space-y-2">
			<ScrollArea class="h-20 rounded-md border p-2 " orientation="both">
				<p class="text-sm text-muted-foreground">{instance?.world.description}</p>
			</ScrollArea>
		</div>
		<Separator />

		<!--Section-->
		<div class="flex flex-col space-y-2">
			<h1>Users:</h1>
			<div class="grid grid-cols-2 gap-4">
				{#if instanceOwnerUser !== undefined}
					<div class="flex items-center gap-4">
						<Avatar.Root class="hidden h-9 w-9 sm:flex">
							<Avatar.Image src={instanceOwnerImage} alt="Avatar" />
							<Avatar.Fallback
								>{instanceOwnerUser?.displayName?.charAt(0).toUpperCase() || 'NA'}</Avatar.Fallback
							>
						</Avatar.Root>
						<div class="grid gap-1">
							<p class="text-sm font-medium leading-none">
								{instanceOwnerUser?.displayName || 'Username'}
							</p>
							<p class="text-sm text-muted-foreground">
								{instanceOwnerUser?.statusDescription || instanceOwnerUser?.status}
							</p>
						</div>
					</div>
				{/if}
				{#if instanceOwnerGroup !== undefined}
					<div class="flex items-center gap-4">
						<Avatar.Root class="hidden h-9 w-9 sm:flex">
							<Avatar.Image src={instanceGroupOwnerImage} alt="Group Icon" />
							<Avatar.Fallback
								>{instanceOwnerGroup?.name?.charAt(0).toUpperCase() || 'NA'}</Avatar.Fallback
							>
						</Avatar.Root>
						<div class="grid gap-1">
							<p class="text-sm font-medium leading-none">
								{instanceOwnerGroup?.name || 'Group Name'}
							</p>
							<p class="text-sm text-muted-foreground">Group Owned World</p>
						</div>
					</div>
				{/if}
				{#each friendsInInstance as friend}
					<div class="flex items-center gap-4">
						<Avatar.Root class="hidden h-9 w-9 sm:flex">
							{#await getFriendImage(friend)}
								<Avatar.Fallback>{friend.displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
							{:then url}
								<Avatar.Image src={url} alt="Avatar" />
							{:catch error}
								<Avatar.Fallback>{friend.displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
							{/await}
						</Avatar.Root>
						<div class="grid gap-1">
							<p class="text-sm font-medium leading-none">
								{friend.displayName}
							</p>
							<p class="text-sm text-muted-foreground">
								{friend.statusDescription || friend.status}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
