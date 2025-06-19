<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onDestroy, onMount } from 'svelte';
	import { onlineUsersStore } from '$lib/svelte-stores';
	import { invoke } from '@tauri-apps/api/core';
	import { getOnlineUsers } from '$lib/utils/get-online-users';
	import { getGlobalUserCount } from '$lib/utils/get-global-count';
	import { reloadData } from '$lib/load-data';

	let onlineFriendsCount = $state(0);
	let onlineUsers = $state(0);
	let dateTime: string = '';
	let currentTime: string = $state('Loading...');

	let tickerItems: string[] = $state(['Made with ❤️ by ANGELWARE']);

	$effect(() => {
		tickerItems = [
			'Made with ❤️ by ANGELWARE',
			`Online Friends: ${onlineFriendsCount}`,
			`Online Users: ${onlineUsers}`,
			`VRChat Time: ${currentTime}`
		];
	});

	let currentTickerIndex = 0;
	let tickerText: string = $state(tickerItems[currentTickerIndex]);
	let tickerInterval: ReturnType<typeof setInterval>;
	let timeInterval: ReturnType<typeof setInterval>;
	let tickerElement: HTMLDivElement | null = $state(null);

	const totalCycleDuration = 5000;
	const fadeDuration = 500;

	function cleanDateTimeString(dateTime: string): string {
		return dateTime.replace(/(^")|("$)/g, '').trim();
	}

	const startRealTimeClock = (initialDateTime: string) => {
		const cleanedDateTime = cleanDateTimeString(initialDateTime);
		const startDate = new Date(cleanedDateTime);

		if (isNaN(startDate.getTime())) {
			console.error('Invalid Date');
			currentTime = 'Invalid Date';
			return;
		}

		timeInterval = setInterval(() => {
			const now = new Date();
			const elapsed = Math.floor((now.getTime() - startDate.getTime()) / 1000);
			const updatedTime = new Date(startDate.getTime() + elapsed * 1000);
			currentTime = updatedTime.toLocaleTimeString();
		}, 1000);
	};

	const updateTicker = () => {
		if (tickerElement) {
			// phase 1: fade out
			const fadeOut = tickerElement.animate(
				[
					{ opacity: 1, transform: 'translateX(0)' },
					{ opacity: 0, transform: 'translateX(10%)' }
				],
				{ duration: fadeDuration, easing: 'ease-in' }
			);

			fadeOut.onfinish = () => {
				// phase 2: update text
				currentTickerIndex = (currentTickerIndex + 1) % tickerItems.length;
				tickerText = tickerItems[currentTickerIndex];

				// phase 3: fade in
				tickerElement!.animate(
					[
						{ opacity: 0, transform: 'translateX(-10%)' },
						{ opacity: 1, transform: 'translateX(0)' }
					],
					{ duration: fadeDuration, easing: 'ease-out' }
				);
			};
		}
	};

	onMount(async () => {
		try {
			onlineUsersStore.subscribe((value) => {
				onlineUsers = value;
			});

			await reloadData(false);
			onlineFriendsCount = await getOnlineUsers();
			onlineUsers = await getGlobalUserCount();
			dateTime = await invoke('get_vrc_time');

			if (!dateTime) {
				console.error('Invalid dateTime fetched from API');
			} else {
				startRealTimeClock(dateTime);
			}
		} catch (error) {
			console.error('Error on mount:', error);
		}

		tickerInterval = setInterval(() => {
			updateTicker();
		}, totalCycleDuration);
	});

	onDestroy(() => {
		clearInterval(tickerInterval);
		clearInterval(timeInterval);
	});
</script>

<footer class="flex h-10 w-screen items-center justify-center border-t bg-background">
	<div class="ticker-container font-mono">
		<div bind:this={tickerElement} class="ticker-text">
			{tickerText}
		</div>
	</div>
</footer>

<style>
	.ticker-container {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.ticker-text {
		white-space: nowrap;
	}
</style>
