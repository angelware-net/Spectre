use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
pub struct Request {
    pub(crate) url: String,
    pub(crate) method: String,
    pub(crate) headers: Option<HashMap<String, String>>,
    pub(crate) body: Option<serde_json::Value>,
}
