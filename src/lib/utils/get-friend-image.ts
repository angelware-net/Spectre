import type { Friend } from '$lib/types/friend';
import { loadImage } from '$lib/utils/load-image';

export async function getFriendImage(friend: Friend) {
	if (friend.userIcon != '') {
		return loadImage(friend.userIcon);
	} else if (friend.currentAvatarImageUrl != '') {
		return loadImage(friend.currentAvatarImageUrl);
	} else return '';
}
