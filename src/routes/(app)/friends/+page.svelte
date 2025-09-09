<script lang="ts">
	import { onMount } from 'svelte';
	import { loadData, reloadData } from '$lib/load-data';
	import { getFriendImage } from '$lib/utils/get-friend-image';
	import { loadImage } from '$lib/utils/load-image';

	// Types
	import type { ExtendedFriend } from '$lib/types/extended-friend';

	// Stores
	import { friendsStore } from '$lib/svelte-stores';
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
	import { OverlayScrollbarsComponent } from 'overlayscrollbars-svelte';
	import { Input } from '$lib/components/ui/input';

	// Icons
	import { Grid2X2, List, LucideRefreshCw } from 'lucide-svelte';
	import { get } from 'svelte/store';
	import FriendCard from '$lib/components/friends/FriendCard.svelte';
	import UserInfo from '$lib/components/friends/UserInfo.svelte';
	import Instance from '$lib/components/Instance.svelte';

	let loading: boolean = $state(true);
	let viewMode: string = $state('cards');
	let sortMode: string = $state('Status');
	let friendsWithImages: Array<
		ExtendedFriend & {
			avatarUrl: string;
			searchIndex: string;
			presenceStatus: string;
		}
	> = $state([]);

	// Sorting mode change
	let value = $state('');

	const sortingModes = [
		{ value: 'Status', label: 'Status' },
		{ value: 'Username', label: 'Username' },
		{ value: 'Location', label: 'Location' }
	];

	const triggerContent = $derived(sortingModes.find((m) => m.value === value)?.label ?? 'Sort');

	$effect(() => {
		const selectedMode = sortingModes.find((t) => t.value === value);
		handleSortChange(selectedMode);
	});

	let search = $state('');
	let debouncedSearch = $state('');
	const normalize = (s: string) =>
		(s ?? '')
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '');

	// debounce
	$effect(() => {
		const id = setTimeout(() => (debouncedSearch = search), 150);
		return () => clearTimeout(id);
	});

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

	const getStatusClass = (presenceStatus: string) => {
		switch (presenceStatus?.toLowerCase()) {
			case 'join me':    return 'status-circle status-join-me';
			case 'active':     return 'status-circle status-active';
			case 'ask me':     return 'status-circle status-ask-me';
			case 'busy':       return 'status-circle status-busy';
			case 'on website': return 'status-circle status-website';
			case 'offline':    return 'status-circle status-offline';
			default:           return '';
		}
	};

	async function loadFriendsWithImages() {
		const friends = Array.from($friendsStore.values()).map((friend) => {
			const instanceData = $instanceDataStore.get(friend.id);

			const platform = (friend.platform ?? '').toLowerCase().trim();
			const location = (friend.location ?? '').toLowerCase().trim();

			const presenceStatus =
				platform === 'web'
					? 'On Website'
					: location === 'offline'
						? 'Offline'
						: (friend.status ?? 'Online');

			const locationName =
				presenceStatus === 'On Website'
					? 'On Website'
					: presenceStatus === 'Offline'
						? 'Offline'
						: (instanceData?.world?.name ??
							(location === 'private' ? 'Private' : 'Loading...'));

			return {
				...friend,
				presenceStatus,
				locationName,
				locationCount: instanceData?.userCount,
				locationCapacity: instanceData?.capacity,
				locationData: instanceData?.world,
			};
		});

		friendsWithImages = await Promise.all(
			friends.map(async (friend) => {
				const avatarUrl = await getFriendImage(friend as ExtendedFriend);
				const searchIndex = normalize(
					[
						friend.displayName,
						friend.presenceStatus,
						friend.locationName,
						friend.bio,
						friend.statusDescription,
					]
						.filter(Boolean)
						.join(' ')
				);
				return { ...friend, avatarUrl, searchIndex };
			})
		);
	}


	const filteredFriends = $derived.by(() => {
		const q = normalize(search).trim();
		if (!q) return friendsWithImages;
		return friendsWithImages.filter((f: any) => f.searchIndex?.includes(q));
	});

	const sortedFriends = $derived.by(() => {
		const locationOrder = (location: string) => {
			if (location === 'On Website') return 1;
			if (location === 'Offline') return 2;
			return 0;
		};

		return [...filteredFriends].sort((a, b) => {
			if (sortMode === 'Status') {
				const presenceOrder: Record<string, number> = {
					'join me': 1,
					'active': 2,
					'ask me': 3,
					'busy': 4,
					'on website': 5,
					'offline': 6,
				};
				const aKey = a.presenceStatus?.toLowerCase() ?? '';
				const bKey = b.presenceStatus?.toLowerCase() ?? '';
				const cmp = (presenceOrder[aKey] ?? 999) - (presenceOrder[bKey] ?? 999);
				if (cmp !== 0) return cmp;
				return a.displayName.localeCompare(b.displayName);
			} else if (sortMode === 'Username') {
				const lc = locationOrder(a.locationName) - locationOrder(b.locationName);
				if (lc !== 0) return lc;
				return a.displayName.localeCompare(b.displayName);
			} else if (sortMode === 'Location') {
				const lc = locationOrder(a.locationName) - locationOrder(b.locationName);
				if (lc !== 0) return lc;
				return a.locationName.localeCompare(b.locationName);
			}
			return 0;
		});
	});

	onMount(async () => {
		loading = true;
		await getViewMode();
		try {
			// load friends data, friends user data, and location data
			const friendsStoreData = get(friendsStore);
			const instanceStoreData = get(instanceDataStore);

			if (
				friendsStoreData.size === 0 ||
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
				<Input class="mr-4 w-[240px]" bind:value={search} placeholder="Search Friends..." />
				<div class="flex flex-row justify-end pr-4">
					<Select.Root type="single" name="sort" bind:value>
						<Select.Trigger class="w-[180px]">
							{triggerContent}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each sortingModes as mode}
									<Select.Item value={mode.value} label={mode.label}>{mode.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
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
					<Button variant="outline" onclick={() => handleRefresh()} size="icon">
						{#if loading}
							<LucideRefreshCw class="h-[1.2rem] w-[1.2rem] animate-spin transition-all" />
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
								<Tooltip.Provider>
									<Tooltip.Root>
										<Tooltip.Trigger class="flex h-full items-center justify-center p-4">
											<Table.Cell class="">
												<span class={getStatusClass(friend.presenceStatus)}></span>
											</Table.Cell>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>{friend.presenceStatus}</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>

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
															<p class="text-sm whitespace-pre-line">
																{friend.statusDescription}
															</p>
															<div class="text-muted-foreground flex items-center pt-2 text-xs">
																{friend.presenceStatus}
															</div>
															<div class="text-muted-foreground flex items-center pt-2 text-xs">
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
																<p class="text-xs whitespace-pre-line">
																	{friend?.locationData?.description}
																</p>
																<div class="text-muted-foreground flex items-center pt-2 text-xs">
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
