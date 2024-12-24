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

	function cleanDateTimeString(dateTime: string): string {
		return dateTime.replace(/(^")|("$)/g, '').trim();
	}

	function updateCurrentTime(initialDateTime: string) {
		try {
			const cleanedDateTime = cleanDateTimeString(initialDateTime);
			const date = new Date(cleanedDateTime);
			if (isNaN(date.getTime())) {
				console.error('Invalid Date');
			}
			const now = new Date();
			const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
			date.setSeconds(date.getSeconds() + diffInSeconds);
			currentTime = date.toLocaleTimeString();
		} catch (error) {
			console.error('Error updating current time:', error);
			currentTime = 'Invalid Date';
		}
	}

	const openAw = () => {
		open('https://angelware.net');
	};

	onMount(async () => {
		try {
			onlineUsersStore.subscribe((value) => {
				onlineUsers = value;
			});

			await reloadData(false);
			// currentlyOnline = await checkUserStatus();
			onlineFriendsCount = await getOnlineUsers();
			onlineUsers = await getGlobalUserCount();
			// dateTime = await getApiTime();

			dateTime = await invoke('get_vrc_time');

			if (!dateTime) {
				console.error('Invalid dateTime fetched from API');
			}
			updateCurrentTime(dateTime);
			setInterval(() => updateCurrentTime(dateTime), 1000);
		} catch (error) {
			console.error('Error on mount:', error);
		}
	});

	$: tickerClass = currentlyOnline ? 'bg-green' : 'bg-background';
</script>

<footer class="flex h-10 w-screen items-center justify-center border-t bg-background">
	<div class="ticker-container {tickerClass}">
		<div class="ticker-wrapper font-mono">
			<div class="hwrap">
				<div class="hmove">
					<a class="hitem" on:click={openAw} href="/">Made with ❤️ by ANGELWARE</a>
					<div class="hitem">Online Friends: {onlineFriendsCount}</div>
					<div class="hitem">Online Users: {onlineUsers}</div>
					<div class="hitem">VRChat Time: {currentTime}</div>
				</div>
			</div>
		</div>
	</div>
</footer>

<style>
	:root {
		--ticker-bg-color: hsl(var(--background));
	}

	.ticker-container.bg-green {
		--ticker-bg-color: green;
	}

	.ticker-container {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ticker-wrapper {
		position: relative;
		width: 30%;
		overflow: hidden;
	}

	.ticker-wrapper::before,
	.ticker-wrapper::after {
		content: '';
		position: absolute;
		top: 0;
		width: 15%;
		height: 100%;
		pointer-events: none;
	}

	.ticker-wrapper::before {
		left: 0;
		background: linear-gradient(to right, var(--ticker-bg-color), transparent);
		z-index: 1;
	}

	.ticker-wrapper::after {
		right: 0;
		background: linear-gradient(to left, var(--ticker-bg-color), transparent);
	}

	/* ticker https://code-boxx.com/html-css-news-ticker-horizontal-vertical/*/
  .hmove {
      display: flex;
      align-items: center; /* Vertically align text */
      gap: 20rem; /* Add spacing between items */
      animation: tickerh linear 20s infinite;
      will-change: transform; /* Optimize for animations */
  }

  .hitem {
      white-space: nowrap; /* Prevent wrapping */
      text-overflow: ellipsis; /* Hide overflowing text */
      overflow: hidden; /* Prevent overflow */
      line-height: 2.5rem; /* Match the height of the footer */
      flex-shrink: 0; /* Prevent shrinking */
  }

  .hwrap {
      overflow: hidden; /* Hide content outside bounds */
      width: 100%; /* Ensure full-width container */
      display: flex;
      align-items: center; /* Vertically align items */
      position: relative; /* Contain child elements */
      box-sizing: border-box; /* Ensure no additional width from padding */
  }

  @keyframes tickerh {
      0% {
          transform: translateX(100%);
      }
      100% {
          transform: translateX(-100%);
      }
  }
	.hmove {
		animation: tickerh linear 20s infinite;
	}
	.hmove:hover {
		animation-play-state: paused;
	}
	/* end ticker */
</style>
