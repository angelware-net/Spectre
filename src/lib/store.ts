import { load } from '@tauri-apps/plugin-store';

export async function saveSetting(key: string, value: string) {
	const store = await load('.settings.dat', { autoSave: true });

	await store.set(key, value);
	await store.save();
}

export async function getSetting(key: string): Promise<string | null> {
	const store = await load('.settings.dat', { autoSave: true });

	const value = await store.get<string>(key);
	return value || null;
}
