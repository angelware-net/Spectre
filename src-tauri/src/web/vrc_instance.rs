use crate::types::request::Request;
use crate::web::vrc_request::vrc_get_request;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_vrc_instance(app: AppHandle, instance_id: String) -> Result<String, String> {
    let url = format!("https://api.vrchat.cloud/api/1/instances/{}", instance_id);

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
