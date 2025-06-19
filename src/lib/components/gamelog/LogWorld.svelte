<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { type World } from '$lib/types/world';
	import { type GameLogMessage } from '$lib/gamelog/gamelog-sql';
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { LoaderCircle } from 'lucide-svelte';
	import { loadImage } from '$lib/utils/load-image';
	import ArrowUpRight from 'lucide-svelte/icons/square-arrow-up-right';
	import { open } from '@tauri-apps/plugin-shell';

	// TODO: Add world favorite functions

	export let logData: GameLogMessage;
	let world: World;
	let loading: boolean = true;

	function viewWorldOnWeb() {
		open(`https://vrchat.com/home/world/${world.id}/info`);
	}

	onMount(async () => {
		if (logData.location) {
			let worldData = await invoke<string>('get_vrc_world', { worldId: logData.location });
			world = JSON.parse(worldData);
			loading = false;
		}
	});
</script>

{#if loading}
	<LoaderCircle class="h-7 motion-rotate-loop-[1turn]/reset" />
{:else}
	<div class="motion-preset-blur-up">
		<div class="">
			{#await loadImage(world.imageUrl)}
				<LoaderCircle class="h-7 motion-rotate-loop-[1turn]/reset" />
			{:then url}
				<div class="header-background" style="background-image: url({url});" />
			{:catch error}
				<LoaderCircle class="h-7 motion-rotate-loop-[1turn]/reset" />
			{/await}
		</div>
		<div class="mt-5">
			<div class="flex flex-col gap-4">
				<div class="flex flex-row justify-between">
					<div class="text-2xl">
						{world.name}
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="outline">...</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Label>World Actions</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item on:click={() => viewWorldOnWeb()} class="flex justify-between">
									<div>
										View on Web&nbsp;&nbsp;
									</div>
									<ArrowUpRight class="h-4 w-4" />
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<Separator />
				<div class="text-muted-foreground text-sm">
					{world.description}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
    .header-background {
        background-size: cover;
        background-position: center;
        height: 200px; /* Adjust height as needed */
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden; /* Ensure the image is contained within the div */
        border-top-left-radius: 0.5rem; /* Match the card's border radius */
        border-top-right-radius: 0.5rem; /* Match the card's border radius */
    }

    .sheet-header {
        background-size: cover;
        background-position: center;
        height: 200px; /* Adjust height as needed */
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden; /* Ensure the image is contained within the div */
    }

    .header-text {
        background-color: rgba(0, 0, 0, 0.5); /* Optional: Add background to make text readable */
        color: white; /* Text color */
        padding: 0.5rem; /* Add some padding */
        border-radius: 0.25rem; /* Optional: Add border radius */
        width: 100%;
        height: 100%;
    }
</style>
