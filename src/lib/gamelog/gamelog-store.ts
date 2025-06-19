import { writable } from 'svelte/store';
import type { GameLogMessage } from '$lib/gamelog/gamelog-sql';

export const gamelogStore = writable<GameLogMessage[]>([]);