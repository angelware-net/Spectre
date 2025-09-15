<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onDestroy, onMount } from 'svelte';
	import { onlineUsersStore, friendsStore, currentUserStore, currentInstanceStore } from '$lib/svelte-stores';
	import { invoke } from '@tauri-apps/api/core';
	import { getOnlineUsers } from '$lib/utils/get-online-users';
	import { getGlobalUserCount } from '$lib/utils/get-global-count';
	import { reloadData } from '$lib/load-data';
	import type { Friend } from '$lib/types/friend';
	import type { InstanceData } from '$lib/types/instance';

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

	const isJoinable = (friend: Friend) => friend.platform != 'web' && friend.location != 'offline';

	let onlineFriendsCount = $derived.by(() => {
		const friends = $friendsStore;

		let count = 0;
		for (const friend of friends.values()) {
			if (isJoinable(friend)) count++;
		}
		return count;
	});

	let currentlyOnline = $state(false);

	onMount(async () => {
		try {
			onlineUsersStore.subscribe((value) => {
				onlineUsers = value;
			});

			await reloadData(false);
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

		currentInstanceStore.subscribe((v) => {
			if (v != null) {
				let data: InstanceData = JSON.parse(v);
				if (data.location !== 'offline') {
					currentlyOnline = true;
				}
			}
		});
	});

	onDestroy(() => {
		clearInterval(tickerInterval);
		clearInterval(timeInterval);
	});

	let tickerClass = $derived(currentlyOnline ? 'online-pulse' : 'bg-background');
</script>

<footer class="relative overflow-hidden flex h-10 w-screen items-center justify-center border-t {tickerClass}">
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

  .online-pulse {
      background-color: var(--background);
  }

  .online-pulse::before {
      content: "";
      position: absolute;
      inset: -25%;
      background: radial-gradient(
              circle at 50% 50%,
              rgba(22, 163, 74, 0.8) 0%,
              rgba(22, 163, 74, 0.28) 35%,
              transparent 55%,
              transparent 70%
      );
      transform: scale(1);
      opacity: 0.95;
      animation: ticker-pulse 2.8s ease-in-out infinite;
      pointer-events: none;
  }

  .ticker-container,
  .ticker-text {
      position: relative;
      z-index: 1;
  }

  @keyframes ticker-pulse {
      0%,
      100% { transform: scale(1);   opacity: 0.95; }
      50%   { transform: scale(1.12); opacity: 1;    }
  }

</style>
