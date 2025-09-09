import type { Friend } from '$lib/types/friend';
import type { World } from '$lib/types/instance';

export type ExtendedFriend = Friend & {
	status: string;
	locationName: string;
	locationCount?: number;
	locationCapacity?: number;
	locationData?: World;
};
