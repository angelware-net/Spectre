<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let twoFactorCode = '';
	let requiresTwoFactorAuth = false;

	// async function verifyTwoFactor() {
	// 	try {
	// 		const result = await invoke('verify_two_factor', {
	// 			params: {
	// 				code: twoFactorCode,
	// 				use_email: useEmailOtp
	// 			}
	// 		});
	// 		responseMessage = result;
	// 		requiresTwoFactorAuth = false;
	// 		useEmailOtp = false;
	// 		console.log(result);
	// 		toast("Successfully logged in!");
	// 		goto("/home")
	// 	}
	// 	catch (error) {
	// 		responseMessage = error;
	// 		toast("An error occured!");
	// 		console.error(error);
	// 	}
	// }

	async function verifyTwoFactor() {
		try {
			let twofa = await invoke('get_totp', {
				totp: twoFactorCode
			});

			console.log(twofa);
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
				console.log(login);
				toast('Login Success!');
				await goto('/home');
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
		<Card.Description
			>Enter your email and password below to login to your account.</Card.Description
		>
	</Card.Header>
	<Card.Content class="grid gap-4">
		<div class="grid gap-2">
			<Label for="email">Email</Label>
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
			<Button class="w-full" on:click={verifyTwoFactor}>Verify 2FA</Button>
		{:else}
			<Button class="w-full" on:click={login}>Sign in</Button>
		{/if}
	</Card.Footer>
	<!--	<p>{responseMessage}</p>-->
</Card.Root>
