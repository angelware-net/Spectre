use log::info;
use crate::types::request::Request;
use crate::web::vrc_request::vrc_get_request;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_vrc_friends(app: AppHandle) -> Result<String, String> {
    let mut all_friends: Vec<serde_json::Value> = Vec::new();
    let mut offset = 0;
    let limit = 100;

    // online friends
    loop {
        info!("Getting online friends at offset  {}", offset);
        let url = format!("https://api.vrchat.cloud/api/1/auth/user/friends?offline=false&offset={offset}&limit=100");

        let req = Request {
            url: url.to_string(),
            method: "GET".to_string(),
            headers: None,
            body: None,
        };

        let response_str = match vrc_get_request(app.clone(), req).await {
            Ok(res) => res,
            Err(e) => return Err(format!("Error getting friends!: {}", e)),
        };

        let page: Vec<serde_json::Value> = serde_json::from_str(&response_str)
            .map_err(|e| format!("Failed to parse friends JSON!: {}", e))?;

        let count = page.len();
        all_friends.extend(page);

        if count < limit {
            break;
        }

        offset += limit;
    }

    // offline friends
    let mut offline_offset = 0;
    loop {
        info!("Getting offline friends at offset  {}", offline_offset);
        let url = format!("https://api.vrchat.cloud/api/1/auth/user/friends?offline=true&offset={offline_offset}&limit=100");

        let req = Request {
            url: url.to_string(),
            method: "GET".to_string(),
            headers: None,
            body: None,
        };

        let response_str = match vrc_get_request(app.clone(), req).await {
            Ok(res) => res,
            Err(e) => return Err(format!("Error getting friends!: {}", e)),
        };

        let page: Vec<serde_json::Value> = serde_json::from_str(&response_str)
            .map_err(|e| format!("Failed to parse friends JSON!: {}", e))?;

        let count = page.len();
        all_friends.extend(page);

        if count < limit {
            break;
        }

        offline_offset += limit;
    }

    serde_json::to_string(&all_friends)
        .map_err(|e| format!("Failed to serialize friends!: {}", e))
}

#[tauri::command]
pub async fn get_vrc_friends_offset(app: AppHandle, offset: i8) -> Result<String, String> {
    let url = format!("https://api.vrchat.cloud/api/1/auth/user/friends?offline=false?offset={offset}?limit=100");

    let req = Request {
        url: url.to_string(),
        method: "GET".to_string(),
        headers: None,
        body: None,
    };

    match vrc_get_request(app, req).await {
        Ok(response) => Ok(response),
        Err(e) => Err(format!("Error getting friends!: {}", e.to_string())),
    }
}