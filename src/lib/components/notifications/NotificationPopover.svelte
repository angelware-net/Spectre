<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import type { Notification } from '$lib/types/notification';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { CheckCheck, EyeOff } from 'lucide-svelte';
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { toast } from 'svelte-sonner';

	let notifs: string;
	let notifications: Notification[] = $state([]);

	onMount(async () => {
		notifs = await invoke<string>('get_vrc_notifications');
		console.log(notifs);
		notifications = JSON.parse(notifs);
		console.log(notifications);
	});

	// TODO: Make this functional
	async function seeNotification(notificationId: string | null) {
		if (notificationId !== null) {
			console.log('Seeing notification...');
			await invoke<string>('put_vrc_see_notification', {
				notificationId: notificationId
			});
		} else {
			toast.error('Failed to mark notification as seen.');
		}
	}
</script>

<main>
	<ScrollArea class="h-[75vh] w-full">
	{#if notifications.length > 0}
		{#each notifications as notification}
			<Card.Root class="mb-4">
				<Card.Title>
					<div class="flex flex-row">
						<div class="flex w-48 flex-row p-4">
							<img class="object-contain" src={notification.imageUrl} alt="" />
						</div>
						<div>
							<div class="flex w-64 flex-row p-4 text-sm">
								{notification.title}
							</div>
							<div class="flex flex-row items-end justify-end pb-4">
								<Button variant="outline" size="icon" class="mr-2 h-8 w-8" onclick={() => seeNotification(notification.id)}>
									<EyeOff class="h-4 w-4" />
								</Button>
								<Button variant="outline" size="icon" class="mr-2 h-8 w-8">
									<CheckCheck class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</Card.Title>
			</Card.Root>
		{/each}
	{:else}
		<div>You're all caught up!</div>
	{/if}
	</ScrollArea>
</main>
