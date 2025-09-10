<script lang="ts">
	import '../app.css';

	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import { loadSettings } from '$lib/utils/theme-switcher';
	import { onMount, tick } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { goto } from '$app/navigation';
	import { Toaster } from '$lib/components/ui/sonner';
	import Websocket from '$lib/components/Websocket.svelte';
	import { updateApp } from '$lib/utils/updater';
	import { platform } from '@tauri-apps/plugin-os';

	import {
		currentUserStore,
		loadingStore,
		onlineUsersStore,
		loginStatusStore
	} from '$lib/svelte-stores';
	import type { UserData } from '$lib/types/user';
	import { manageCacheSize } from '$lib/utils/cache-manager';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { browser } from '$app/environment';
	import { redirectConsoleToTauriLog } from '$lib/log-redirect';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(async () => {
		if (browser) {
			redirectConsoleToTauriLog();
		}

		// Set loading state
		loadingStore.set(true);

		const currentPlatform = platform();

		if (currentPlatform == 'linux' || currentPlatform == 'windows' || currentPlatform == 'macos')
			await updateApp();

		await loadSettings();

		console.log('Welcome to Spectre!');

		// Check and manage cache size
		manageCacheSize().catch(console.error);

		// Check api status by getting users online
		try {
			const users = await invoke('get_vrc_users');

			if (typeof users === 'number') {
				console.log('API is online! ' + users + ' users online!');
				onlineUsersStore.set(users);
			} else {
				console.log(users);
				onlineUsersStore.set(-1);
			}
		} catch (e) {
			console.error('Error fetching API status: ', e);
			onlineUsersStore.set(0);
		}

		// Try and check login token status, then send the user to the correct location. Also sets the loading state.
		try {
			const login = await invoke('get_login', {
				username: '',
				password: ''
			});

			const response = typeof login === 'string' ? JSON.parse(login) : login;

			// If response requires 2fa for whatever reason, send to login, otherwise send home.
			if (response.requiresTwoFactorAuth) {
				loginStatusStore.set(false);
				await goto('/login');
				loadingStore.set(false);
			} else {
				// Try to save the response to the currentUserStore
				const userData = response as UserData;
				currentUserStore.set(userData);
				console.log(userData.displayName + ' has logged in!');

				loginStatusStore.set(true);
				loadingStore.set(false);
				await tick();
				console.log('Going to homepage...');
				await goto('/home');
			}
			await goto('/home');

			// If there is an error (such as 401) login must have failed, send to login page.
		} catch (e) {
			loginStatusStore.set(false);
			console.error('Login failed! Returning to login page!', e);
			await goto('/login');
			loadingStore.set(false);
		}
	});
</script>

<ThemeSwitcher />
<ModeWatcher />
<Toaster />
<Websocket />

{@render children?.()}
