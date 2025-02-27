<script lang="ts">
	import { page } from '$app/stores';
	import { toggleMode } from 'mode-watcher';
	import { invoke } from '@tauri-apps/api/core';
	import { goto } from '$app/navigation';
	import { currentUserStore } from '$lib/svelte-stores';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Popover from "$lib/components/ui/popover";

	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Menu from 'lucide-svelte/icons/menu';
	import Globe from 'lucide-svelte/icons/globe';
	import type { UserData } from '$lib/types/user';
	import Favicon from '$lib/components/Favicon.svelte';
	import { loadImage } from '$lib/utils/load-image';
	import { onDestroy } from 'svelte';
	import disconnectSocket from '$lib/components/Websocket.svelte';
	import Bell from "lucide-svelte/icons/bell";
	import NotificationPopover from "$lib/components/notifications/NotificationPopover.svelte";

	let currentUser: UserData | null;
	let avatarImageUrl: string | null = null;

	currentUserStore.subscribe(async (userData: UserData | null) => {
		if (userData) {
			currentUser = userData;

			if (currentUser?.userIcon || currentUser?.currentAvatarImageUrl) {
				try {
					avatarImageUrl = await loadImage(
						currentUser.userIcon || currentUser.currentAvatarImageUrl
					);
				} catch (error) {
					console.error('Failed to load avatar image:', error);
					avatarImageUrl = '/path-to-fallback-avatar.png'; // Optional fallback
				}
			}
		} else {
			// If userData is null, redirect to home page, this is because if there is no userdata we must not be signed in.
			await goto('/');
			goto('/');
		}
	});

	async function logout() {
		try {
			await invoke('get_logout');
			await disconnectSocket();
			await goto('/login');
		} catch (error) {
			console.error(error);
		}
	}

	const openGithub = () => {
		open('https://github.com/angelware-net/spectre');
	};

	onDestroy(() => {
		if (avatarImageUrl) {
			URL.revokeObjectURL(avatarImageUrl);
		}
	});
</script>

<header
	class="header sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"
>
	<nav
		class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
	>
		<a href="/home" class="flex items-center gap-2 text-lg font-semibold md:text-base">
			<Favicon />
			<span class="sr-only">Spectre VRC</span>
		</a>
		<a
			href="/dash"
			class:text-foreground={$page.url.pathname === '/dash'}
			class:text-muted-foreground={$page.url.pathname !== '/dash'}
			class="hover:text-foreground"
		>
			Dashboard
		</a>
		<a
			href="/friends"
			class:text-foreground={$page.url.pathname === '/friends'}
			class:text-muted-foreground={$page.url.pathname !== '/friends'}
			class="hover:text-foreground"
		>
			Friends
		</a>
<!--		<a-->
<!--			href="/notifications"-->
<!--			class:text-foreground={$page.url.pathname === '/feed'}-->
<!--			class:text-muted-foreground={$page.url.pathname !== '/notifications'}-->
<!--			class="hover:text-foreground"-->
<!--		>-->
<!--			Feed-->
<!--		</a>-->
		<a
			href="/instances"
			class:text-foreground={$page.url.pathname === '/instances'}
			class:text-muted-foreground={$page.url.pathname !== '/instances'}
			class="hover:text-foreground"
		>
			Instances
		</a>
	</nav>
	<Sheet.Root>
		<Sheet.Trigger asChild let:builder>
			<Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
				<Menu class="h-5 w-5" />
				<span class="sr-only">Toggle navigation menu</span>
			</Button>
		</Sheet.Trigger>
		<Sheet.Content side="left">
			<nav class="grid gap-6 text-lg font-medium">
				<a href="/home" class="flex items-center gap-2 text-lg font-semibold">
					<Favicon />
					<span class="sr-only">Spectre</span>
				</a>
				<a
					href="/dash"
					class:text-foreground={$page.url.pathname === '/dash'}
					class:text-muted-foreground={$page.url.pathname !== '/dash'}
					class="hover:text-foreground"
				>
					Dashboard
				</a>
				<a
					href="/friends"
					class:text-foreground={$page.url.pathname === '/friends'}
					class:text-muted-foreground={$page.url.pathname !== '/friends'}
					class="hover:text-foreground"
				>
					Friends
				</a>
				<!--				<a href="/feed" class:text-foreground={$page.url.pathname === '/feed'} class:text-muted-foreground={$page.url.pathname !== '/feed'} class="hover:text-foreground"> Feed </a>-->
				<a
					href="/instances"
					class:text-foreground={$page.url.pathname === '/instances'}
					class:text-muted-foreground={$page.url.pathname !== '/instances'}
					class="hover:text-foreground"
				>
					Instances
				</a>
			</nav>
		</Sheet.Content>
	</Sheet.Root>
	<div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
		<div class="ml-auto flex-1 sm:flex-initial" />
		<Popover.Root>
			<Popover.Trigger>
				<Button variant="outline" size="icon">
					<Bell class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-96">
				<NotificationPopover />
			</Popover.Content>
		</Popover.Root>
		<Button on:click={toggleMode} variant="outline" size="icon">
			<Sun
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<Moon
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
			<span class="sr-only">Toggle theme</span>
		</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" size="icon" class="rounded-full">
					<Avatar.Root class="h-9 w-9">
						<Avatar.Image src={avatarImageUrl} alt="User Avatar" />
						<Avatar.Fallback><CircleUser class="h-5 w-5" /></Avatar.Fallback>
					</Avatar.Root>
					<span class="sr-only">Toggle user menu</span>
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item href="/me">
					{#if currentUser !== null && currentUser.displayName !== null}
						{currentUser.displayName}
					{:else}
						Not Logged In
					{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item href="/settings">Settings</DropdownMenu.Item>
				<DropdownMenu.Item on:click={openGithub}>Github</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item on:click={logout}>Logout</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item disabled>v2.0.2-ALPHA</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>

<!--Forces header to be above everything-->
<style>
	.header {
		z-index: 1;
	}
</style>
