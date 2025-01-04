export interface Notification {
	created_at: Date | null;
	details: string | null;
	id: string | null;
	message: string;
	seen: boolean;
	receiverUserId: string;
	senderUserId: string | null;
	type: string;
}

export interface InviteNotification {
	worldId: string;
	worldName: string;
}
