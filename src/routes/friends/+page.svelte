<script lang="ts">
	import { onMount } from 'svelte';
	import { loadData, reloadData } from '$lib/load-data';
	import { getFriendImage } from '$lib/utils/get-friend-image';
	import { loadImage } from '$lib/utils/load-image';

	// Types
	import type { ExtendedFriend } from '$lib/types/extended-friend';

	// Stores
	import { friendsStore } from '$lib/svelte-stores';
	import { externalUserDataStore } from '$lib/svelte-stores';
	import { instanceDataStore } from '$lib/svelte-stores';
	import { getSetting, saveSetting } from '$lib/store';

	// UI
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { Card } from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	// Icons
	import { Grid2X2, List, LucideRefreshCw } from 'lucide-svelte';
	import { get } from 'svelte/store';
	import FriendCard from '$lib/components/friends/FriendCard.svelte';
	import UserInfo from '$lib/components/friends/UserInfo.svelte';
	import Instance from '$lib/components/Instance.svelte';

	let loading: boolean = true;
	let viewMode: string = 'cards';
	let sortMode: string = 'Status';
	let friendsWithImages: Array<ExtendedFriend & { avatarUrl: string }> = [];

	async function getViewMode() {
		let viewModeSetting = await getSetting('friendsViewMode');

		if (viewModeSetting != null) {
			viewMode = viewModeSetting;
		}
	}

	async function setViewMode(viewModeSetting: string | undefined) {
		console.log('setting view mode');
		if (viewModeSetting != undefined) viewMode = viewModeSetting;
		else viewMode = 'cards';

		await saveSetting('friendsViewMode', viewMode);
	}

	async function handleRefresh() {
		loading = true;
		await reloadData(true);
		loading = false;
	}

	function handleSortChange(value: { value: string; label: string } | undefined) {
		if (value) {
			sortMode = value.value;
			console.log('Sort mode changed');
		}
	}

	const getStatusClass = (state: string, status: string) => {
		switch (state?.toLowerCase()) {
			case 'online':
				switch (status?.toLowerCase()) {
					case 'join me':
						return 'status-circle status-join-me';
					case 'active':
						return 'status-circle status-active';
					case 'ask me':
						return 'status-circle status-ask-me';
					case 'busy':
						return 'status-circle status-busy';
					default:
						return '';
				}
			case 'active':
				return 'status-circle status-website';
			case 'offline':
				return 'status-circle status-offline';
			default:
				return '';
		}
	};

	let sortedFriends: Array<ExtendedFriend & { avatarUrl: string }> = [];

	async function loadFriendsWithImages() {
		const friends = Array.from($friendsStore.values()).map((friend) => {
			const userData = $externalUserDataStore.get(friend.id);
			const instanceData = $instanceDataStore.get(friend.id);
			const state = userData?.state || 'offline';
			const status =
				state === 'online'
					? (userData?.status ?? 'Offline')
					: state === 'active'
						? 'On Website'
						: 'Offline';
			const locationName =
				state === 'offline'
					? 'Offline'
					: state === 'active'
						? 'On Website'
						: instanceData?.world?.name ||
							(friend.location === 'private' ? 'Private' : 'Loading...');

			return {
				...friend,
				state,
				status,
				locationName,
				locationCount: instanceData?.userCount,
				locationCapacity: instanceData?.capacity,
				locationData: instanceData?.world
			};
		});

		friendsWithImages = await Promise.all(
			friends.map(async (friend) => {
				const avatarUrl = await getFriendImage(friend);
				return { ...friend, avatarUrl };
			})
		);
	}

	$: sortedFriends = [...friendsWithImages].sort((a, b) => {
		const locationOrder = (location) => {
			if (location === 'On Website') return 1;
			if (location === 'Offline') return 2;
			return 0;
		};

		if (sortMode === 'Status') {
			const stateOrder = {
				'online:join me': 1,
				'online:active': 2,
				'online:ask me': 3,
				'online:busy': 4,
				active: 5,
				offline: 6
			};
			const aKey = `${a.state}:${a.status}`.toLowerCase();
			const bKey = `${b.state}:${b.status}`.toLowerCase();
			const statusComparison =
				(stateOrder[aKey] || stateOrder[a.state]) - (stateOrder[bKey] || stateOrder[b.state]);
			if (statusComparison !== 0) return statusComparison;
			return a.displayName.localeCompare(b.displayName);
		} else if (sortMode === 'Username') {
			const locationComparison = locationOrder(a.locationName) - locationOrder(b.locationName);
			if (locationComparison !== 0) return locationComparison;
			return a.displayName.localeCompare(b.displayName);
		} else if (sortMode === 'Location') {
			const locationComparison = locationOrder(a.locationName) - locationOrder(b.locationName);
			if (locationComparison !== 0) return locationComparison;
			return a.locationName.localeCompare(b.locationName);
		}
		return 0;
	});

	onMount(async () => {
		loading = true;
		await getViewMode();
		try {
			// load friends data, friends user data, and location data
			const friendsStoreData = get(friendsStore);
			const externalUserDataStoreData = get(externalUserDataStore);
			const instanceStoreData = get(instanceDataStore);

			if (
				friendsStoreData.size === 0 ||
				externalUserDataStoreData.size === 0 ||
				instanceStoreData.size === 0
			) {
				await loadData();
			} else {
				console.log('Data exists, skipping reload!');
			}
			await loadFriendsWithImages();
			loading = false;
		} catch (error) {
			console.error('Failed to load friends:', error);
		}
	});
</script>

<main class="p-4">
	<div class="p-4">
		<div class="grid grid-cols-2">
			<div class="text-3xl">Friends</div>
			<div class="flex flex-row items-end justify-end text-end">
				<div class="flex flex-row justify-end pr-4">
					<Select.Root onSelectedChange={handleSortChange}>
						<Select.Trigger class="w-[180px]">
							<Select.Value placeholder="Sort" />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Item value="Status" label="Status">Status</Select.Item>
								<Select.Item value="Username" label="Username">Username</Select.Item>
								<Select.Item value="Location" label="Location">Location</Select.Item>
							</Select.Group>
						</Select.Content>
						<Select.Input name="themeSelector" />
					</Select.Root>
				</div>
				<div class="flex flex-row justify-end">
					<ToggleGroup.Root
						type="single"
						class="pr-4"
						value={viewMode}
						onValueChange={(e) => setViewMode(e)}
					>
						<ToggleGroup.Item value="cards">
							<Grid2X2 />
						</ToggleGroup.Item>
						<ToggleGroup.Item value="list">
							<List />
						</ToggleGroup.Item>
					</ToggleGroup.Root>
					<Button variant="outline" on:click={handleRefresh} size="icon">
						{#if loading}
							<LucideRefreshCw class="animate-spin h-[1.2rem] w-[1.2rem] transition-all" />
						{:else}
							<LucideRefreshCw class="h-[1.2rem] w-[1.2rem] transition-all" />
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</div>

	{#if viewMode === 'cards'}
		<div class="xs:grid-cols-1 grid sm:grid-cols-2 md:grid-cols-3">
			{#each sortedFriends as friend}
				<div class="p-2">
					<FriendCard {friend} avatarUrl={friend.avatarUrl} />
				</div>
			{/each}
		</div>
	{:else if viewMode === 'list'}
		<Card>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[10px] sm:w-[50px] md:w-[100px]">Status</Table.Head>
						<Table.Head class="">Name</Table.Head>
						<Table.Head class="">Location</Table.Head>
						<Table.Head class="hidden text-right sm:table-cell">Join</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if loading}
						{#each Array(5) as _, i}
							<Table.Row class="">
								<Table.Cell class="flex items-center justify-center">
									<Skeleton class="h-6 w-[25px]" />
								</Table.Cell>
								<Table.Cell>
									<Skeleton class="h-6 w-[250px]" />
								</Table.Cell>
								<Table.Cell>
									<Skeleton class="h-6 w-[250px]" />
								</Table.Cell>
								<Table.Cell class="text-right">
									<Skeleton class="h-6 w-[250px]" />
								</Table.Cell>
							</Table.Row>
						{/each}
					{:else}
						{#each sortedFriends as friend, i (i)}
							<Table.Row class="">
								<!--Status-->
								<Tooltip.Root>
									<Tooltip.Trigger class="flex h-full items-center justify-center p-4">
										<Table.Cell class="">
											<span class={getStatusClass(friend.state, friend.status)}></span>
										</Table.Cell>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>{friend.status}</p>
									</Tooltip.Content>
								</Tooltip.Root>

								<!--Name-->
								<Table.Cell>
									<Dialog.Root>
										<Dialog.Trigger>
											<HoverCard.Root>
												<HoverCard.Trigger>
													{friend.displayName}
												</HoverCard.Trigger>
												<HoverCard.Content class="w-80">
													<div class="flex space-x-4">
														<Avatar.Root>
															{#await getFriendImage(friend)}
																<Avatar.Fallback
																	>{friend.displayName.charAt(0).toUpperCase()}</Avatar.Fallback
																>
															{:then url}
																<Avatar.Image src={url} alt="Avatar" />
															{:catch error}
																<Avatar.Fallback
																	>{friend.displayName.charAt(0).toUpperCase()}</Avatar.Fallback
																>
															{/await}
														</Avatar.Root>
														<div class="space-y-1">
															<h4 class="text-sm font-semibold">{friend.displayName}</h4>
															<p class="whitespace-pre-line text-sm">
																{friend.statusDescription}
															</p>
															<div class="flex items-center pt-2 text-xs text-muted-foreground">
																{friend.status}
															</div>
															<div class="flex items-center pt-2 text-xs text-muted-foreground">
																{friend.bio}
															</div>
														</div>
													</div>
												</HoverCard.Content>
											</HoverCard.Root>
										</Dialog.Trigger>
										<Dialog.Content>
											<UserInfo userId={friend.id} />
										</Dialog.Content>
									</Dialog.Root>
								</Table.Cell>

								<!--Location-->
								<Table.Cell class="">
									{#if friend?.locationName !== 'Private' && friend?.locationName !== 'On Website' && friend.locationName !== 'Offline'}
										<Dialog.Root>
											<Dialog.Trigger>
												<HoverCard.Root>
													<HoverCard.Trigger class="">
														{friend?.locationName} ({friend?.locationCount} / {friend?.locationData
															?.recommendedCapacity}) [{friend?.locationCapacity}]
													</HoverCard.Trigger>
													<HoverCard.Content class="w-80">
														<div class="flex space-x-4">
															<Avatar.Root>
																{#if friend !== undefined && friend.locationData !== undefined}
																	{#await loadImage(friend.locationData.imageUrl)}
																		<Avatar.Fallback
																			>{friend.locationData.name
																				.charAt(0)
																				.toUpperCase()}</Avatar.Fallback
																		>
																	{:then url}
																		<Avatar.Image src={url} alt="Avatar" />
																	{:catch error}
																		<Avatar.Fallback
																			>{friend.locationData.name
																				.charAt(0)
																				.toUpperCase()}</Avatar.Fallback
																		>
																	{/await}
																{/if}
																<Avatar.Fallback>SK</Avatar.Fallback>
															</Avatar.Root>
															<div class="space-y-1">
																<h4 class="text-sm font-semibold">{friend?.locationName}</h4>
																<p class="whitespace-pre-line text-xs">
																	{friend?.locationData?.description}
																</p>
																<div class="flex items-center pt-2 text-xs text-muted-foreground">
																	{friend?.locationCount} / {friend?.locationData
																		?.recommendedCapacity} ({friend?.locationCapacity})
																</div>
															</div>
														</div>
													</HoverCard.Content>
												</HoverCard.Root>
											</Dialog.Trigger>
											<Dialog.Content>
												<Instance userId={friend.id} />
											</Dialog.Content>
										</Dialog.Root>
									{:else}
										{friend.locationName}
									{/if}
								</Table.Cell>

								<!--JoinButton-->
								<Table.Cell class="hidden text-right sm:table-cell">
									{#if friend.locationName !== 'Private' && friend.locationName !== 'On Website' && friend.locationName !== 'Offline'}
										<Dialog.Root>
											<Dialog.Trigger>
												<Button>Details</Button>
											</Dialog.Trigger>
											<Dialog.Content>
												<Instance userId={friend.id} />
											</Dialog.Content>
										</Dialog.Root>
									{:else}
										<Button disabled variant="outline" class="text-muted-foreground">Details</Button
										>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</Card>
	{/if}
</main>

<style>
	.header-background {
		background-size: cover;
		background-position: center;
		height: 200px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-top-left-radius: 0.5rem;
		border-top-right-radius: 0.5rem;
	}

	.status-circle {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		justify-content: center;
		align-items: center;
	}

	.status-join-me {
		background-color: deepskyblue;
	}

	.status-active {
		background-color: green;
	}

	.status-ask-me {
		background-color: orange;
	}

	.status-busy {
		background-color: darkred;
	}

	.status-website {
		background-color: lightgray;
	}

	.status-offline {
		background-color: dimgray;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.rotating {
		animation: rotate 1s linear infinite;
	}
</style>
