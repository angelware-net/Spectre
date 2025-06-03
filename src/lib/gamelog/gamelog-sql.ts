import Database from '@tauri-apps/plugin-sql';

const db: Database = await Database.load('sqlite:spectre.db');

