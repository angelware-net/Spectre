<script lang="ts">
	import { onMount } from 'svelte';

	import { onlineUsersStore } from '$lib/svelte-stores';
	import { invoke } from '@tauri-apps/api/core';
	import { getOnlineUsers } from '$lib/utils/get-online-users';
	import { getGlobalUserCount } from '$lib/utils/get-global-count';
	import { reloadData } from '$lib/load-data';

	let onlineFriendsCount = 0;
	let onlineUsers = 0;
	let dateTime: string = '';
	let currentTime: string = 'Loading...';
	let currentlyOnline: boolean = false;

	let tickerItems: string[] =  [
		'Made with ❤️ by ANGELWARE',
	];

	$: tickerItems = [
		'Made with ❤️ by ANGELWARE',
		`Online Friends: ${onlineFriendsCount}`,
		`Online Users: ${onlineUsers}`,
		`VRChat Time:`, // time updates dynamically
	];

	let currentTickerIndex = 0;
	let tickerText: string = tickerItems[currentTickerIndex];
	let tickerInterval: any | null = null; // i dont care eslint shut up

	function cleanDateTimeString(dateTime: string): string {
		return dateTime.replace(/(^")|("$)/g, '').trim();
	}

	const updateCurrentTime = (initialDateTime: string) => {
		const cleanedDateTime = cleanDateTimeString(initialDateTime);
		const startDate = new Date(cleanedDateTime);

		if (isNaN(startDate.getTime())) {
			console.error('Invalid Date');
			currentTime = 'Invalid Date';
			return;
		}

		setInterval(() => {
			const now = new Date();
			const elapsed = Math.floor((now.getTime() - startDate.getTime()) / 1000);
			startDate.setSeconds(startDate.getSeconds() + elapsed);
			currentTime = startDate.toLocaleTimeString();
		}, 1000);
	};

	const updateTicker = () => {
		currentTickerIndex = (currentTickerIndex + 1) % tickerItems.length;

		if (tickerItems[currentTickerIndex] === 'VRChat Time:') {
			tickerText = `VRChat Time: ${currentTime}`;
			if (!tickerInterval) {
				tickerInterval = setInterval(() => {
					tickerText = `VRChat Time: ${currentTime}`;
				}, 1000);
			}
		} else {
			tickerText = tickerItems[currentTickerIndex];
			if (tickerInterval) {
				clearInterval(tickerInterval);
				tickerInterval = null;
			}
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
				updateCurrentTime(dateTime);
			}
		} catch (error) {
			console.error('Error on mount:', error);
		}

		const interval = setInterval(updateTicker, 3000);
		return () => {
			clearInterval(interval);
			if (tickerInterval) clearInterval(tickerInterval);
		};
	});
</script>

<footer class="flex h-10 w-screen items-center justify-center border-t bg-background">
	<div class="ticker-container font-mono">
		<div class="ticker-text">{tickerText}</div>
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
        animation: fadeInOut 3s linear infinite;
    }

    @keyframes fadeInOut {
        0%, 10% {
            opacity: 0;
            transform: translateX(10%);
        }
        20%, 80% {
            opacity: 1;
            transform: translateX(0);
        }
        90%, 100% {
            opacity: 0;
            transform: translateX(-10%);
        }
    }
</style>
