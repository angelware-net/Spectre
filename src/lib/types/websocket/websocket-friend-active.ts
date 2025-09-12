import type { WebsocketUser } from '$lib/types/websocket/websocket-user';

export interface WebsocketFriendActive {
	userId: string;
	platform: string;
	user: WebsocketUser;
}


