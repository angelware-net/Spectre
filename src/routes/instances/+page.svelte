<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';

	import { friendsStore } from '$lib/svelte-stores';
	import { externalUserDataStore } from '$lib/svelte-stores';
	import { instanceDataStore } from '$lib/svelte-stores';

	import { getFriendImage } from '$lib/utils/get-friend-image';
	import { loadImage } from '$lib/utils/load-image';
	import { derived } from 'svelte/store';

	import type { Friend } from '$lib/types/friend';
	import type { ExternalUserData } from '$lib/types/external-user';
	import type { InstanceData } from '$lib/types/instance';
	import type { GroupData } from '$lib/types/group';

	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import UserInfo from '$lib/components/friends/UserInfo.svelte';
	import { LucideRefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { reloadData } from '$lib/load-data';
	import InstanceStatic from '$lib/components/InstanceStatic.svelte';

	let loading: boolean = false;

	async function handleRefresh() {
		loading = true;
		await reloadData(true);
		loading = false;
	}

	async function loadInstanceOwner(instance: InstanceData) {
		if (instance?.ownerId.startsWith('usr')) {
			let instanceOwnerUserJson = await invoke<string>('get_vrc_user', {
				userId: instance?.ownerId
			});
			let instanceOwnerUser: ExternalUserData = JSON.parse(instanceOwnerUserJson);

			let instanceType = await getInstanceType(instance);

			return `[${instanceType}] ${instanceOwnerUser.displayName}`;
		} else if (instance?.ownerId.startsWith('grp')) {
			let instanceOwnerGroupJson = await invoke<string>('get_vrc_group', {
				groupId: instance?.ownerId
			});
			let instanceOwnerGroup: GroupData = JSON.parse(instanceOwnerGroupJson);

			let instanceType = await getInstanceType(instance);

			return `[${instanceType}] ${instanceOwnerGroup.name}`;
		}
	}

	async function getInstanceType (instance: InstanceData) {
		switch (instance.type) {
			case 'group':
				switch (instance.groupAccessType) {
					case 'public':
						return 'Group Public';
					case 'plus':
						return 'Group+';
					default:
						return 'Group';
				}
			case 'hidden':
				return 'Friends+';
			case 'friends':
				return 'Friends';
			case 'private':
				return 'Private';
			case 'public':
				return 'Public';
			default:
				return 'Error';
		}
	}

	function getStatusType (status: string) {
		switch (status) {
			case 'active':
				return 'Online';
			case 'ask me':
				return 'Ask Me';
			case 'join me':
				return 'Join Me';
			case 'busy':
				return 'Busy';
			default:
				return 'Error';
		}
	}

	// wacky sorting, i had to get help with this one cuz its a bit complex
	const groupedFriendsStore = derived(
		[friendsStore, instanceDataStore, externalUserDataStore],
		([$friendsStore, $instanceDataStore, $externalUserDataStore]) => {
			const grouped = new Map<
				InstanceData | null,
				Array<{ friend: Friend; externalData: ExternalUserData | null }>
			>();

			// attach instance and external data
			for (const [key, friend] of $friendsStore.entries()) {
				const instance = $instanceDataStore.get(friend.id) || null;
				const externalData = $externalUserDataStore.get(key) || null;

				if (!grouped.has(instance)) {
					grouped.set(instance, []);
				}

				grouped.get(instance)!.push({ friend, externalData });
			}

			return grouped;
		}
	);
</script>

<main class="p-4">
	<div class="p-4">
		<div class="grid grid-cols-2 pb-6">
			<div class="text-3xl">Instances</div>
			<div class="flex flex-row justify-end">
				<Button variant="outline" on:click={handleRefresh} size="icon">
					{#if loading}
						<LucideRefreshCw class="animate-spin h-[1.2rem] w-[1.2rem] transition-all" />
					{:else}
						<LucideRefreshCw class="h-[1.2rem] w-[1.2rem] transition-all" />
					{/if}
				</Button>
			</div>
		</div>
		{#each Array.from($groupedFriendsStore.entries()) as [instance, friends]}
			{#if instance}
				<div class="pt-2">
					<Card.Root>
						<div class="flex flex-row p-4">
							<div class="flex max-w-64 justify-center items-center mr-4 overflow-hidden rounded">
								{#await loadImage(instance.world.imageUrl)}
									Loading Image...
								{:then imageBlob}
									<Dialog.Root>
										<Dialog.Trigger>
											<img class="transform transition-transform duration-200 hover:scale-105" src="{imageBlob}" alt="World Thumbnail" />
										</Dialog.Trigger>
										<Dialog.Content>
											<InstanceStatic instance="{instance}" />
										</Dialog.Content>
									</Dialog.Root>
								{/await}
							</div>
							<div>
								<div class="flex flex-row">
									<h2 class="text-xl ">{instance ? instance.world.name : 'Unknown Instance'}</h2>
									<h2 class="text-xl pl-1 text-muted-foreground">- {instance ? instance.userCount : '0'} / {instance ? instance.recommendedCapacity : '0'} [{instance ? instance.capacity : '0'}]</h2>
								</div>
								{#await loadInstanceOwner(instance)}
									<div class="text-xs text-muted-foreground text-ellipsis text-nowrap pb-2">Loading Owner...</div>
								{:then instanceOwner}
									<div class="text-xs text-muted-foreground text-ellipsis text-nowrap pb-2">{instanceOwner}</div>
								{/await}
								<ul>
									{#each friends as { friend, externalData }}
										<div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
											<Dialog.Root>
												<Dialog.Trigger>
													<Card.Root class="w-64 h-16 text-ellipsis overflow-hidden transform transition-transform duration-200 hover:scale-105">
														<div class="flex flex-row">
															<div class="flex w-24 items-center justify-center">
																{#await getFriendImage(friend)}
																	Loading Image...
																{:then imageBlob}
																	<img src="{imageBlob}" alt="Friend Thumbnail" />
																{/await}
															</div>
															<div class="flex flex-col p-2">
																<div class="text-lg text-left">{friend.displayName}</div>
																<div class="text-xs text-left">{friend.statusDescription || getStatusType(friend.status)}</div>
															</div>
														</div>
													</Card.Root>
												</Dialog.Trigger>
												<Dialog.Content>
													<UserInfo userId="{friend.id}" />
												</Dialog.Content>
											</Dialog.Root>
										</div>
									{/each}
								</ul>
							</div>
						</div>
					</Card.Root>
				</div>
			{/if}
		{/each}
	</div>
</main>