mod types;
mod web;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
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
            // Cookies handling
            web::cookies::load_login_cookies,
            web::cookies::save_login_cookies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}