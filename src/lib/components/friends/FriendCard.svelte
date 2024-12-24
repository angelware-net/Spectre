<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Dialog from '$lib/components/ui/dialog';

	import { onMount } from 'svelte';
	import type { ExtendedFriend } from '$lib/types/extended-friend';
	import { Button } from '$lib/components/ui/button';
	import UserInfo from '$lib/components/friends/UserInfo.svelte';
	import { loadImage } from '$lib/utils/load-image';

	export let friend: ExtendedFriend;
	let avatarImage: string;

	onMount(async () => {
		avatarImage = await loadImage(getUrl());
	});

	const getStatusClass = (state: string, status: string) => {
		switch (state?.toLowerCase()) {
			case 'online':
				switch (status?.toLowerCase()) {
					case 'join me':
						return 'status-circle status-join-me';
					case 'active':
						return 'status-circle status-active';
					case 'ask me':
						return 'status-circle status-ask-me';
					case 'busy':
						return 'status-circle status-busy';
					default:
						return '';
				}
			case 'active':
				return 'status-circle status-website';
			default:
				return '';
		}
	};

	function getUrl() {
		if (friend.profilePicOverride === '' && friend.userIcon === '') {
			return friend.currentAvatarImageUrl;
		} else if (friend.userIcon === '') {
			return friend.profilePicOverride;
		} else {
			return friend.userIcon;
		}
	}
</script>

<Card.Root>
	<Card.Header class="h-24 w-full overflow-hidden p-0">
		<div class="header-background h-64" style="background-image: url({avatarImage});"></div>
	</Card.Header>
	<Card.Title class="p-4 pb-0">
		<Tooltip.Root>
			<Tooltip.Trigger>
				<span class={getStatusClass(friend.state, friend.status)}></span>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>{friend.status}</p>
			</Tooltip.Content>
		</Tooltip.Root>
		{friend.displayName}
	</Card.Title>
	<Card.Content class="p-4 pt-2">
		<div class="text-sm text-muted-foreground truncate">
			{#if friend.statusDescription !== ""}
				{friend.statusDescription}
			{:else}
				{friend.status}
			{/if}
		</div>
		<div class="truncate">
			{#if friend.locationData !== undefined}
				{friend.locationData.name}
			{:else}
				Private
			{/if}
		</div>
	</Card.Content>
	<Card.Footer class="w-full p-4 pt-0">
		<Dialog.Root>
			<Dialog.Trigger>
				<Button class="w-full">Details</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<UserInfo userId={friend.id} />
			</Dialog.Content>
		</Dialog.Root>
	</Card.Footer>
</Card.Root>

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
		background-color: gray;
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
