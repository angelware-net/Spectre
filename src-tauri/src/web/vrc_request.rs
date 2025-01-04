use std::sync::Arc;
use tauri::AppHandle;
use tauri_plugin_http::reqwest::cookie::Jar;
use tauri_plugin_http::reqwest::header::USER_AGENT;
use tauri_plugin_http::reqwest::Client;

use crate::types::request::Request;
use crate::web::cookies;

/// Makes a get request using VRChat authentication cookies
#[tauri::command]
pub async fn vrc_get_request(app: AppHandle, req: Request) -> Result<String, String> {
    let url = &req.url;

    if !url.starts_with("http://") && !url.starts_with("https://") {
        Err("URL must start with https://")?;
    }

    let cookie_store = Arc::new(Jar::default());

    if let Ok(Some(cookies)) = cookies::load_login_cookies(app.clone()) {
        cookie_store.add_cookie_str(cookies.trim(), &url.parse().unwrap());
    }

    let client = Client::builder()
        .cookie_provider(cookie_store.clone())
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let request = client.get(url.clone()).header(USER_AGENT, "Spectre/2.0");

    match request.send().await {
        Ok(res) => {
            if res.status().is_success() {
                match res.text().await {
                    Ok(text) => Ok(text),
                    Err(e) => Err(format!("Failed to read response text: {}", e)),
                }
            } else {
                Err(format!("Request failed with status: {}", res.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}
