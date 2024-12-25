use tauri_plugin_http::reqwest::header::USER_AGENT;
use tauri_plugin_http::reqwest::Client;

#[tauri::command]
pub async fn get_vrc_time() -> Result<String, String> {
    let client = Client::new();
    let url = "https://vrchat.com/api/1/time";

    match client
        .get(url)
        .header(USER_AGENT, "Spectre/2.0")
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.text().await {
                    Ok(body) => Ok(body.trim().to_string()),
                    Err(e) => Err(format!("Failed to get time: {}", e)),
                }
            } else {
                Err(format!("Datetime request failed with status: {}", res.status()))
            }
        }
        Err(_) => Err("Datetime request failed".to_string()),
    }
}
