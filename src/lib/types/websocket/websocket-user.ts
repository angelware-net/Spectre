export interface WebsocketUser {
	id: string;
	displayName: string;
	userIcon: string;
	bio: string;
	bioLinks: string[];
	profilePicOverride: string;
	profilePicOverrideThumbnail: string;
	statusDescription: string;
	pronouns: string;
	ageVerificationStatus: string;
	ageVerified: boolean;
	currentAvatarImageUrl: string;
	currentAvatarThumbnailImageUrl: string;
	currentAvatarTags: string[];
	state: string;
	last_mobile: string | null;
	tags: string[];
	developerType: string;
	last_login: string;
	last_platform: string;
	allowAvatarCopying: boolean;
	status: 'join me' | 'active' | 'ask me' | 'busy';
	date_joined: string;
	isFriend: boolean;
	friendKey: string;
	last_activity: string;
}