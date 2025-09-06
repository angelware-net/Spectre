<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { getCurrentTheme, switchTheme } from '$lib/utils/theme-switcher';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Footer from '$lib/components/Footer2.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { onMount } from 'svelte';
	import { saveNumericSetting, getNumericSetting, getSetting, saveSetting } from '$lib/store';
	import { clearCache } from '$lib/utils/cache-manager';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { createSocket, disableXsOverlay } from '$lib/xsoverlay/xsocket';

	const themes = [
		{ value: 'default', label: 'Default' },
		{ value: 'rose', label: 'Rose' },
		{ value: 'blue', label: 'Sky' },
		{ value: 'green', label: 'Forest' },
		{ value: 'orange', label: 'Autumn' },
		{ value: 'violet', label: 'Violet' }
	];

	let value = $state('');

	const triggerContent = $derived(themes.find((t) => t.value === value)?.label ?? 'Select a theme');

	let cacheSize: number = $state(500);
	let xsPort: number = $state(42070);
	let xsEnabled: boolean = $state(true);

	let friendTravelingNotif = $state(true);
	let videoPlayerErrorNotif = $state(true);

	onMount(async () => {
		let currentTheme = await getCurrentTheme();
		if (currentTheme != null) value = currentTheme;

		let maxSize = await getNumericSetting('maximumCacheSize');
		if (maxSize != null) cacheSize = maxSize;

		let xsEnabledSetting = await getSetting('xsOverlayEnabled');
		if (xsEnabledSetting != null) xsEnabled = xsEnabledSetting.toLowerCase() === 'true';

		let xsPortSetting = await getNumericSetting('xsOverlayPort');
		if (xsPortSetting != null) xsPort = xsPortSetting;

		let friendTravelingNotifSetting = await getSetting('friendTravelingNotif');
		if (friendTravelingNotifSetting != null)
			friendTravelingNotif = friendTravelingNotifSetting.toLowerCase() === 'true';

		let videoPlayerErrorNotifSetting = await getSetting('videoPlayerErrorNotif');
		if (videoPlayerErrorNotifSetting != null)
			videoPlayerErrorNotif = videoPlayerErrorNotifSetting.toLowerCase() === 'true';
	});

	$effect(() => {
		handleThemeChange(themes.find((t) => t.value === value));
	});

	function handleThemeChange(value: { value: string; label: string } | undefined) {
		if (value) {
			console.log(`Theme switched to ${value.value}`);
			switchTheme(value.value);
		}
	}

	async function clearCacheManager() {
		await clearCache();
	}

	async function handleCacheSizeChange() {
		await saveNumericSetting('maximumCacheSize', cacheSize);
	}

	async function handleXsPortChange() {
		await saveNumericSetting('xsOverlayPort', xsPort);
	}

	async function handleFriendTravelingNotifChange() {
		await saveSetting('friendTravelingNotif', friendTravelingNotif ? 'true' : 'false');
	}

	async function handleVideoPlayerErrorNotifChange() {
		await saveSetting('videoPlayerErrorNotif', videoPlayerErrorNotif ? 'true' : 'false');
	}

	async function handleXsOverlayEnabled() {
		await saveSetting('xsOverlayEnabled', xsEnabled ? 'true' : 'false');

		if (xsEnabled) {
			await createSocket();
		} else {
			await disableXsOverlay();
		}
	}
</script>

<main>
	<div class="flex w-full flex-col p-6">
		<h1 class="p-4 pb-1 text-2xl">Settings</h1>
		<p class="text-muted-foreground p-4 pt-0">Changes are updated and saved automagically. 🪄</p>

		<div class="p-4">
			<Tabs.Root value="home" class="w-full">
				<Tabs.List class="w-full">
					<Tabs.Trigger value="home" class="w-full">Main</Tabs.Trigger>
					<Tabs.Trigger value="xso" class="w-full">XSOverlay</Tabs.Trigger>
					<Tabs.Trigger value="notifications" class="w-full">Notifications</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="home">
					<Table.Root>
						<Separator />
						<Table.Row class="flex h-20 flex-row items-center justify-between">
							<Table.Cell>
								<h2 class="">Theme</h2>
							</Table.Cell>
							<Table.Cell>
								<div>
									<Select.Root type="single" name="themeSelector" bind:value disabled>
										<Select.Trigger class="w-[200px]">
											{triggerContent}
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												{#each themes as theme}
													<Select.Item value={theme.value} label={theme.label}
														>{theme.label}</Select.Item
													>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class="flex h-20 flex-row items-center justify-between">
							<Table.Cell>
								<h2 class="">Maximum Cache Size (MB)</h2>
							</Table.Cell>
							<Table.Cell>
								<div>
									<Input
										type="number"
										placeholder="500"
										onchange={() => handleCacheSizeChange()}
										bind:value={cacheSize}
										class="w-[200px]"
									/>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class="flex h-20 flex-row items-center justify-between">
							<Table.Cell>
								<h2 class="">Clear Cache</h2>
							</Table.Cell>
							<Table.Cell>
								<div>
									<Button
										class="w-[200px]"
										variant="destructive"
										onclick={() => clearCacheManager()}>Clear</Button
									>
								</div>
							</Table.Cell>
						</Table.Row>
					</Table.Root>
				</Tabs.Content>
				<Tabs.Content value="xso">
					<Table.Root>
						<Separator />
						<Table.Row class="flex h-20 flex-row content-center items-center justify-between">
							<Table.Cell>
								<h2 class="">Enable XSOverlay Integration</h2>
							</Table.Cell>
							<Table.Cell>
								<div class="pr-6">
									<Checkbox
										id="xsEnabled"
										bind:checked={xsEnabled}
										onCheckedChange={() => handleXsOverlayEnabled()}
									/>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class="flex h-20 flex-row items-center justify-between">
							<Table.Cell>
								<h2 class="">XSOverlay Port</h2>
							</Table.Cell>
							<Table.Cell>
								<div>
									<Input
										type="number"
										placeholder="42070"
										onchange={() => handleXsPortChange()}
										bind:value={xsPort}
									/>
								</div>
							</Table.Cell>
						</Table.Row>
					</Table.Root>
				</Tabs.Content>
				<Tabs.Content value="notifications">
					<Table.Root>
						<Separator />
						<Table.Row class="flex h-20 flex-row content-center items-center justify-between">
							<Table.Cell>
								<h2 class="">Friend Joining Instance</h2>
							</Table.Cell>
							<Table.Cell>
								<div class="pr-6">
									<Checkbox
										id="friendTravelingNotif"
										bind:checked={friendTravelingNotif}
										onCheckedChange={() => handleFriendTravelingNotifChange()}
									/>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class="flex h-20 flex-row content-center items-center justify-between">
							<Table.Cell>
								<h2 class="">Video Player Errors</h2>
							</Table.Cell>
							<Table.Cell>
								<div class="pr-6">
									<Checkbox
										id="videoPlayerErrorNotif"
										bind:checked={videoPlayerErrorNotif}
										onCheckedChange={() => handleVideoPlayerErrorNotifChange()}
									/>
								</div>
							</Table.Cell>
						</Table.Row>
					</Table.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</div>

	<div class="absolute bottom-0">
		<Footer />
	</div>
</main>
