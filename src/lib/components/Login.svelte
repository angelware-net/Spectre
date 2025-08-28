<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import type { UserData } from '$lib/types/user';
	import { currentUserStore } from '$lib/svelte-stores';

	let email = $state('');
	let password = $state('');
	let twoFactorCode = $state('');
	let requiresTwoFactorAuth = $state(false);

	async function verifyTwoFactor() {
		try {
			let twofa = await invoke('get_totp', {
				totp: twoFactorCode
			});

			console.log(twofa);

			// This is so stupid, for some reason, when we get login totp we do not ever get the user data from the endpoint,
			// therefore we have to run the login AGAIN to get the user's data.
			const login = await invoke('get_login', {
				username: '',
				password: ''
			});

			const response = typeof login === 'string' ? JSON.parse(login) : login;

			const userData = response as UserData;
			currentUserStore.set(userData);
			console.log(userData.displayName + ' has logged in!');

			toast('Login Success!');

			await goto('/home');
		} catch (e) {
			console.error('Error verifying 2fa: ', e);
		}
	}

	async function login() {
		try {
			console.log('Logging in...');
			let login = await invoke('get_login', {
				username: email,
				password: password
			});

			console.log('Got login, processing...');
			console.log(login);

			const response = typeof login === 'string' ? JSON.parse(login) : login;

			if (response.requiresTwoFactorAuth) {
				console.log('2fa required');
				if (response.requiresTwoFactorAuth.includes('totp')) {
					console.log('totp required');

					requiresTwoFactorAuth = true;
				} else {
					console.log('otp required');
				}
			} else {
				const userData = response as UserData;
				currentUserStore.set(userData);
				console.log(userData.displayName + ' has logged in!');

				toast('Login Success!');
				await goto('/home');
				goto('/home');
			}
		} catch (error) {
			console.error('Error during login:', error);
			toast('Login Error!');
		}
	}
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email and password below to login to your account.</Card.Description>
	</Card.Header>
	<Card.Content class="grid gap-4">
		<div class="grid gap-2">
			<Label for="email">Email / Username</Label>
			<Input id="email" type="email" bind:value={email} placeholder="m@example.com" required />
		</div>
		<div class="grid gap-2">
			<Label for="password">Password</Label>
			<Input id="password" type="password" bind:value={password} required />
		</div>
		{#if requiresTwoFactorAuth}
			<div class="grid gap-2">
				<Label for="twoFactorCode">2FA Code</Label>
				<Input id="twoFactorCode" type="text" bind:value={twoFactorCode} required />
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		{#if requiresTwoFactorAuth}
			<Button class="w-full" onclick={verifyTwoFactor}>Verify 2FA</Button>
		{:else}
			<Button class="w-full" onclick={login}>Sign in</Button>
		{/if}
	</Card.Footer>
	<!--	<p>{responseMessage}</p>-->
</Card.Root>
