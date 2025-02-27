use crate::types::request::Request;
use crate::web::vrc_request::vrc_get_request;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_vrc_notifications(app: AppHandle) -> Result<String, String> {
    let url = "https://api.vrchat.cloud/api/1/notifications?type=all".to_string();

    let req = Request {
        url: url.to_string(),
        method: "GET".to_string(),
        headers: None,
        body: None,
    };

    match vrc_get_request(app, req).await {
        Ok(response) => Ok(response),
        Err(e) => Err(format!("Error getting instance!: {}", e.to_string())),
    }
}

#[tauri::command]
pub async fn put_vrc_see_notification(app: AppHandle, notification_id: String) -> Result<String, String> {
    let url = format!("https://api.vrchat.cloud/api/1/auth/user/notifications/{}/see", notification_id).to_string();

    let req = Request {
        url: url.to_string(),
        method: "PUT".to_string(),
        headers: None,
        body: None,
    };

    match vrc_get_request(app, req).await {
        Ok(response) => Ok(response),
        Err(e) => Err(format!("Error setting notification to read!: {}", e.to_string())),
    }
}