use serde_json::{json, Value};
use std::path::PathBuf;
use tauri_plugin_store::StoreExt;

// Cookies manager for login and otp

/*
    Updated 20/12/24 to use the new TauriV2 store, there was a lot of changes in how the store was
    accessed, etc. I've done my best to update everything and it seems to work, although for some
    reason we cannot release the store after the operation is complete, it causes the function to
    hang or exit without returning the proper value to Tauri, which causes things like Login to
    never complete.
*/

#[tauri::command]
pub fn load_login_cookies(app: tauri::AppHandle) -> tauri_plugin_store::Result<Option<String>> {
    // let app_clone = app.clone();
    let store_path = PathBuf::from(".cookies.dat");

    // Get the store state, return an error if the store is not found
    // let stores = app_clone
    //     .try_state::<StoreCollection<Wry>>()
    //     .ok_or(tauri_plugin_store::Error::NotFound(store_path.clone()))?;
    //
    // with_store(app_clone.clone(), stores, store_path, |store| {
    //     // Parse the cookie string from JSON
    //     if let Some(cookie_data) = store.get("cookies") {
    //         if let Ok(parsed_json) = serde_json::from_str::<Value>(&cookie_data.to_string()) {
    //             if let Some(cookie_str) = parsed_json.get("value").and_then(|v| v.as_str()) {
    //                 return Ok(Some(cookie_str.to_string()));
    //             }
    //         }
    //     }
    //     Ok(None) // Return None if the cookie isn't found or if JSON parsing fails
    // })

    let store = app.store(store_path)?;
    let cookies_string = match store.get("cookies") {
        Some(value) => value,
        None => {
            store.close_resource();
            return Ok(None);
        }
    };

    // store.close_resource();
    println!("{}", cookies_string);

    if let Ok(parsed_json) = serde_json::from_str::<Value>(&cookies_string.to_string()) {
        if let Some(cookie_str) = parsed_json.get("value").and_then(|v| v.as_str()) {
            return Ok(Some(cookie_str.to_string()));
        }
    }
    Ok(None)
}

#[tauri::command]
pub fn save_login_cookies(
    app: tauri::AppHandle,
    cookies: String,
) -> tauri_plugin_store::Result<String> {
    let store_path = PathBuf::from(".cookies.dat");

    // let stores = app
    //     .try_state::<StoreCollection<Wry>>()
    //     .ok_or(tauri_plugin_store::Error::NotFound(store_path.clone()))?;
    //
    // with_store(app.clone(), stores, store_path, |store| {
    //     store.insert(
    //         "cookies".to_string(),
    //         json!({"value": format!("{}", cookies)}),
    //     )?;
    //
    //     store.save()?;
    //
    //     Ok("Okay".to_string())
    // })

    let store = app.store(store_path)?;

    store.set(
        "cookies".to_string(),
        json!({"value": format!("{}", cookies)}),
    );

    println!("Saved login cookie");
    // store.close_resource();
    Ok("Okay".to_string())
}

#[tauri::command]
pub fn clear_login_cookies(app: tauri::AppHandle) -> tauri_plugin_store::Result<String> {
    let store_path = PathBuf::from(".cookies.dat");

    // let stores = app
    //     .try_state::<StoreCollection<Wry>>()
    //     .ok_or(tauri_plugin_store::Error::NotFound(store_path.clone()))?;
    //
    // with_store(app.clone(), stores, store_path, |store| {
    //     store.delete("cookies")?;
    //     store.save()?;
    //     Ok("Okay".to_string())
    // })

    let store = app.store(store_path)?;
    store.delete("cookies");
    // store.close_resource();
    Ok("Okay".to_string())
}

#[tauri::command]
pub fn save_otp_cookies(
    app: tauri::AppHandle,
    cookies: String,
) -> tauri_plugin_store::Result<String> {
    let store_path = PathBuf::from(".cookies.dat");
    // let stores = app
    //     .try_state::<StoreCollection<Wry>>()
    //     .ok_or(tauri_plugin_store::Error::NotFound(store_path.clone()))?;
    //
    // with_store(app.clone(), stores, store_path, |store| {
    //     store.insert(
    //         "otp_cookies".to_string(),
    //         json!({"value": format!("{}", cookies)}),
    //     )?;
    //
    //     store.save()?;
    //
    //     Ok("Okay".to_string())
    // })

    let store = app.store(store_path)?;

    store.set(
        "otp_cookies".to_string(),
        json!({"otp": format!("{}", cookies)}),
    );

    // store.close_resource();
    Ok("Okay".to_string())
}

#[tauri::command]
pub fn load_otp_cookies(app: tauri::AppHandle) -> tauri_plugin_store::Result<Option<String>> {
    // let app_clone = app.clone();
    let store_path = PathBuf::from(".cookies.dat");

    // Get the store state, return an error if the store is not found
    // let stores = app_clone
    //     .try_state::<StoreCollection<Wry>>()
    //     .ok_or(tauri_plugin_store::Error::NotFound(store_path.clone()))?;
    //
    // with_store(app_clone.clone(), stores, store_path, |store| {
    //     // If the `otp_cookie` is not found, return `Ok(None)`
    //     match store.get("otp_cookie") {
    //         Some(cookies) => Ok(Some(cookies.to_string())),
    //         None => Ok(None), // No panic, return None
    //     }
    // })

    let store = app.store(store_path)?;
    let cookies_string = match store.get("otp_cookies") {
        Some(value) => value,
        None => {
            store.close_resource();
            return Ok(None);
        }
    };

    // store.close_resource();

    if let Ok(parsed_json) = serde_json::from_str::<Value>(&cookies_string.to_string()) {
        if let Some(cookie_str) = parsed_json.get("otp").and_then(|v| v.as_str()) {
            return Ok(Some(cookie_str.to_string()));
        }
    }
    Ok(None)
}
