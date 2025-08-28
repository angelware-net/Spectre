use crate::web::cookies;
use crate::web::cookies::clear_login_cookies;
use base64::{engine::general_purpose, Engine as _};
use std::sync::Arc;
use tauri::http::header::CONTENT_TYPE;
use tauri::AppHandle;
use tauri_plugin_http::reqwest::cookie::Jar;
use tauri_plugin_http::reqwest::header::{AUTHORIZATION, SET_COOKIE, USER_AGENT};
use tauri_plugin_http::reqwest::{Client, Url};

// Authentication handlers

#[tauri::command]
pub async fn get_login(
    app: AppHandle,
    username: String,
    password: String,
) -> Result<String, String> {
    let url = "https://api.vrchat.cloud/api/1/auth/user";

    let cookie_store = Arc::new(Jar::default());

    if let Ok(Some(cookies)) = cookies::load_login_cookies(app.clone()) {
        // println!("Loading Cookies");
        cookie_store.add_cookie_str(cookies.trim(), &url.parse().unwrap());
    }

    if let Ok(Some(otp_cookies)) = cookies::load_otp_cookies(app.clone()) {
        for cookie_str in otp_cookies.split(";") {
            cookie_store.add_cookie_str(cookie_str.trim(), &url.parse().unwrap());
        }
    }

    let client = Client::builder()
        .cookie_provider(cookie_store.clone())
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    match client
        .get(url)
        .header(USER_AGENT, "Spectre/2.0")
        .header(
            AUTHORIZATION,
            format!(
                "Basic {}",
                general_purpose::STANDARD.encode(format!("{}:{}", username, password))
            ),
        )
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                // Capture cookies from headers before consuming `res`
                let auth_cookie = res
                    .headers()
                    .get_all(SET_COOKIE)
                    .iter()
                    .filter_map(|header_value| header_value.to_str().ok())
                    .filter(|cookie| cookie.contains("auth="))
                    .collect::<Vec<&str>>()
                    .join("; ");

                let totp_cookie = res
                    .headers()
                    .get_all(SET_COOKIE)
                    .iter()
                    .filter_map(|header_value| header_value.to_str().ok())
                    .filter(|cookie| cookie.contains("twoFactorAuth="))
                    .collect::<Vec<&str>>()
                    .join("; ");

                // Now, consume `res` by calling `text`
                match res.text().await {
                    Ok(text) => {
                        if !auth_cookie.is_empty() {
                            // Save the auth cookie if it exists
                            // println!("Saved cookie");
                            // println!("{}", text);
                            cookies::save_login_cookies(app.clone(), auth_cookie.clone()).unwrap();
                            // println!("{}", auth_cookie);
                        }

                        if !totp_cookie.is_empty() {
                            // Save the auth cookie if it exists
                            // println!("Saved totp cookie");
                            // println!("{}", text);
                            cookies::save_otp_cookies(app.clone(), totp_cookie.clone()).unwrap();
                            // println!("{}", auth_cookie);
                        }

                        Ok(text) // Return the response body
                    }
                    Err(_) => Err("Failed to get login text!".to_string()),
                }
            } else {
                Err(format!("Request failed with status: {}", res.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[tauri::command]
pub async fn get_totp(app: AppHandle, totp: String) -> Result<String, String> {
    let url = "https://api.vrchat.cloud/api/1/auth/twofactorauth/totp/verify";
    let cookie_store = Arc::new(Jar::default());

    if let Ok(Some(cookies)) = cookies::load_login_cookies(app.clone()) {
        // println!("Loading Cookies: {}", cookies); // Log the raw cookies
        cookie_store.add_cookie_str(cookies.trim(), &url.parse().unwrap());

        let _parsed_url = Url::parse(url).unwrap();
        /*
        if let Some(cookie_header) = cookie_store.cookies(&parsed_url) {
            println!("Jar thinks these cookies belong on {}:\n→ {:?}", parsed_url, cookie_header);
        } else {
            println!("Jar has no cookies for {}", parsed_url);
        }
         */
    }

    let body = serde_json::json!({ "code": totp });
    let body_text = serde_json::to_string_pretty(&body).unwrap();
    // println!("JSON body will be: {}", body_text);

    let client = Client::builder()
        .cookie_provider(cookie_store.clone())
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let builder = client
        .post(url)
        .header(USER_AGENT, "Spectre/2.0")
        .header(CONTENT_TYPE, "application/json")
        .body(body_text.clone());

    let request = builder
        .build()
        .map_err(|e| format!("Failed to build request: {}", e))?;

    /*
    println!("===== OUTGOING REQUEST =====");
    println!("{:#?}", request);
    if let Some(cookie_hdr) = request.headers().get(COOKIE) {
        println!("→ Cookie header: {}", cookie_hdr.to_str().unwrap_or("<invalid utf8>"));
    }
    println!("→ Body: {}", body_text);
    println!("=============================");
     */

    match client.execute(request).await {
        Ok(res) => {
            if res.status().is_success() {
                let cookie = res
                    .headers()
                    .get_all(SET_COOKIE)
                    .iter()
                    .filter_map(|header_value| header_value.to_str().ok())
                    .filter(|cookie| cookie.contains("auth="))
                    .collect::<Vec<&str>>()
                    .join("; ");

                let totp_cookie = res
                    .headers()
                    .get_all(SET_COOKIE)
                    .iter()
                    .filter_map(|header_value| header_value.to_str().ok())
                    .filter(|cookie| cookie.contains("twoFactorAuth="))
                    .collect::<Vec<&str>>()
                    .join("; ");

                match res.text().await {
                    Ok(text) => {
                        if !cookie.is_empty() {
                            // println!("Totp: {}", totp_cookie);
                            cookies::save_login_cookies(app.clone(), cookie).unwrap();
                        }

                        if !totp_cookie.is_empty() {
                            // Save the auth cookie if it exists
                            // println!("Saved totp cookie");
                            // println!("{}", text);
                            cookies::save_otp_cookies(app.clone(), totp_cookie.clone()).unwrap();
                            // println!("{}", auth_cookie);
                        }

                        Ok(text)
                    }
                    Err(e) => Err(format!("Failed to get login: {}", e)),
                }
            } else {
                Err(format!(
                    "Request failed with status: {:?}",
                    res.text().await
                ))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[tauri::command]
pub async fn get_otp(app: AppHandle, totp: String) -> Result<String, String> {
    let url = "https://api.vrchat.cloud/api/1/auth/twofactorauth/emailotp/verify";
    let cookie_store = Arc::new(Jar::default());

    if let Ok(Some(cookies)) = cookies::load_login_cookies(app.clone()) {
        // println!("Loading Cookies: {}", cookies); // Log the raw cookies
        cookie_store.add_cookie_str(cookies.trim(), &url.parse().unwrap());

        let _parsed_url = Url::parse(url).unwrap();
        /*
        if let Some(cookie_header) = cookie_store.cookies(&parsed_url) {
            println!("Jar thinks these cookies belong on {}:\n→ {:?}", parsed_url, cookie_header);
        } else {
            println!("Jar has no cookies for {}", parsed_url);
        }
         */
    }

    let body = serde_json::json!({ "code": totp });
    let body_text = serde_json::to_string_pretty(&body).unwrap();
    // println!("JSON body will be: {}", body_text);

    let client = Client::builder()
        .cookie_provider(cookie_store.clone())
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let builder = client
        .post(url)
        .header(USER_AGENT, "Spectre/2.0")
        .header(CONTENT_TYPE, "application/json")
        .body(body_text.clone());

    let request = builder
        .build()
        .map_err(|e| format!("Failed to build request: {}", e))?;

    /*
    println!("===== OUTGOING REQUEST =====");
    println!("{:#?}", request);
    if let Some(cookie_hdr) = request.headers().get(COOKIE) {
        println!("→ Cookie header: {}", cookie_hdr.to_str().unwrap_or("<invalid utf8>"));
    }
    println!("→ Body: {}", body_text);
    println!("=============================");
     */

    match client.execute(request).await {
        Ok(res) => {
            if res.status().is_success() {
                let cookie = res
                    .headers()
                    .get_all(SET_COOKIE)
                    .iter()
                    .filter_map(|header_value| header_value.to_str().ok())
                    .filter(|cookie| cookie.contains("auth="))
                    .collect::<Vec<&str>>()
                    .join("; ");

                let totp_cookie = res
                    .headers()
                    .get_all(SET_COOKIE)
                    .iter()
                    .filter_map(|header_value| header_value.to_str().ok())
                    .filter(|cookie| cookie.contains("twoFactorAuth="))
                    .collect::<Vec<&str>>()
                    .join("; ");

                match res.text().await {
                    Ok(text) => {
                        if !cookie.is_empty() {
                            // println!("Totp: {}", totp_cookie);
                            cookies::save_login_cookies(app.clone(), cookie).unwrap();
                        }

                        if !totp_cookie.is_empty() {
                            // Save the auth cookie if it exists
                            // println!("Saved totp cookie");
                            // println!("{}", text);
                            cookies::save_otp_cookies(app.clone(), totp_cookie.clone()).unwrap();
                            // println!("{}", auth_cookie);
                        }

                        Ok(text)
                    }
                    Err(e) => Err(format!("Failed to get login: {}", e)),
                }
            } else {
                Err(format!(
                    "Request failed with status: {:?}",
                    res.text().await
                ))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[tauri::command]
pub async fn get_logout(app: AppHandle) -> Result<String, String> {
    let url = "https://api.vrchat.cloud/api/1/logout";
    let cookie_store = Arc::new(Jar::default());

    // Load login cookies and log them
    if let Ok(Some(cookies)) = cookies::load_login_cookies(app.clone()) {
        println!("Loading Cookies");
        cookie_store.add_cookie_str(cookies.trim(), &url.parse().unwrap());
    }

    let client = Client::builder()
        .cookie_provider(cookie_store.clone())
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let req = client.put(url).header(USER_AGENT, "Spectre/2.0");

    // Log the cookies just before sending the request
    // if let Some(cookies) = cookie_store.cookies(&url.parse().unwrap()) {
    //     println!("Cookies being sent"); // Log all cookies being sent with the request
    // }

    match req.send().await {
        Ok(res) => {
            if res.status().is_success() {
                clear_login_cookies(app.clone()).unwrap();

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
