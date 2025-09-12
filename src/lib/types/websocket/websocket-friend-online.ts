import type { WebsocketUser } from '$lib/types/websocket/websocket-user';

export interface WebsocketFriendOnline {
	userId: string,
	platform: string,
	location: string,
	travelingToLocation: string,
	worldId: string,
	canRequestInvite: boolean,
	user: WebsocketUser
}