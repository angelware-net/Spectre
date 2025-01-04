use tauri_plugin_http::reqwest::header::USER_AGENT;
use tauri_plugin_http::reqwest::Client;

#[tauri::command]
pub async fn get_vrc_users() -> Result<u32, String> {
    let client = Client::new();
    let url = "https://vrchat.com/api/1/visits";

    match client
        .get(url)
        .header(USER_AGENT, "Spectre/2.0")
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.text().await {
                    Ok(body) => match body.trim().parse::<u32>() {
                        Ok(visits) => Ok(visits),
                        Err(e) => Err(format!("Failed to parse visits: {}", e)),
                    },
                    Err(e) => Err(format!("Failed to get users: {}", e)),
                }
            } else {
                Err(format!("Request failed with status: {}", res.status()))
            }
        }
        Err(_) => Err("Request failed".to_string()),
    }
}
