<script lang="ts">
    import { onMount } from "svelte";
    import {invoke} from "@tauri-apps/api/core";
    import type { Notification } from "$lib/types/notification";
    import * as Card from "$lib/components/ui/card"
    import {Button} from "$lib/components/ui/button";
    import {CheckCheck, EyeOff} from "lucide-svelte";

    let notifs: string;
    let notifications: Notification[] = [];

    onMount(async () => {
        notifs = await invoke<string>('get_vrc_notifications');
        console.log(notifs);
        notifications = JSON.parse(notifs);
        console.log(notifications);
    });
</script>

<main>
    {#if notifications.length > 0}
        {#each notifications as notification}
            <Card.Root>
                <Card.Title>
                    <div class="flex flex-row">
                        <div class="flex flex-row p-4 w-20 h-20">
                            <img src="{notification.imageUrl}">
                        </div>
                        <div>
                            <div class="flex flex-row text-sm p-4 w-64">
                                {notification.title}
                            </div>
                            <div class="flex flex-row justify-end items-end pb-4">
                                <Button variant="outline" size="icon" class="w-8 h-8 mr-2">
                                    <EyeOff class="w-4 h-4"/>
                                </Button>
                                <Button variant="outline" size="icon" class="w-8 h-8">
                                    <CheckCheck class="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    </div>

                </Card.Title>
            </Card.Root>
        {/each}
    {/if}
</main>