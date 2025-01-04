import { invoke } from '@tauri-apps/api/core';

export const getGlobalUserCount = async (): Promise<number> => {
	try {
		const response = await invoke<number>('get_vrc_users');
		console.log(`Users Online: ${response}`);
		return response;
	} catch (error) {
		console.error(`Error fetching online users:`, error);
		throw error;
	}
};
