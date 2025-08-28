<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';

	import { getLogsLast1000 } from '$lib/gamelog/gamelog-sql';
	import { onMount } from 'svelte';
	import { gamelogStore } from '$lib/gamelog/gamelog-store';
	import UserInfo from '$lib/components/friends/UserInfo.svelte';
	import LogUser from '$lib/components/gamelog/LogUser.svelte';
	import LogWorld from '$lib/components/gamelog/LogWorld.svelte';

	onMount(async () => {
		await getLogsLast1000();
	});
</script>

<main class="p-4">
	<div class="p-4">
		<div class="grid grid-cols-2">
			<div class="text-3xl">Game Logs</div>
		</div>
		<div class="text-muted-foreground text-sm pt-2 pb-2">Last 1000 - Updated Automagically 🪄</div>
	</div>

	<div>
		<Card.Root>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[100px]">Time</Table.Head>
						<Table.Head class="w-[120px]">Type</Table.Head>
						<Table.Head class="">Message</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $gamelogStore as log}
						<Table.Row>
							<Table.Cell class="whitespace-nowrap">
								{new Date(log.time).toLocaleTimeString()}
							</Table.Cell>
							<Table.Cell>{log.type}</Table.Cell>
							{#if log.user}
								<Dialog.Root>
									<Dialog.Trigger>
										<Table.Cell>{log.message}</Table.Cell>
									</Dialog.Trigger>
									<Dialog.Content>
										<LogUser logData={log} />
									</Dialog.Content>
								</Dialog.Root>
							{:else if log.location}
								<Dialog.Root>
									<Dialog.Trigger>
										<Table.Cell>{log.message}</Table.Cell>
									</Dialog.Trigger>
									<Dialog.Content>
										<LogWorld logData={log} />
									</Dialog.Content>
								</Dialog.Root>
							{:else}
								<Table.Cell>{log.message}</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Root>
	</div>
</main>