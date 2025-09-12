import type { WebsocketUser } from '$lib/types/websocket/websocket-user';
import type { WebsocketWorld } from '$lib/types/websocket/websocket-world';

export interface WebsocketFriendLocation {
	userId: string;
	platform: string;
	location: string;
	travelingToLocation: string;
	worldId: string;
	canRequestInvite: boolean;
	user: WebsocketUser;
	world: WebsocketWorld;
}


