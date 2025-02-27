use tauri::{AppHandle, Manager};

mod types;
mod web;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
                    let _ = app
                        .get_webview_window("main")
                        .expect("no main window")
                        .set_focus();
                }));
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Web functions
            web::vrc_users::get_vrc_users,
            web::api_time::get_vrc_time,
            web::login::get_login,
            web::login::get_totp,
            web::login::get_logout,
            // VRC Web Functions
            web::vrc_request::vrc_get_request,
            web::vrc_friends::get_vrc_friends,
            web::vrc_user::get_vrc_user,
            web::vrc_instance::get_vrc_instance,
            web::vrc_group::get_vrc_group,
            web::vrc_avatar_list::get_vrc_avatar_list,
            web::vrc_current_avatar::get_vrc_current_avatar,
            web::vrc_notifications::get_vrc_notifications,
            web::vrc_notifications::put_vrc_see_notification,
            // Cookies handling
            web::cookies::load_login_cookies,
            web::cookies::save_login_cookies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
