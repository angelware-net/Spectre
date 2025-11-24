use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Serialize, Deserialize, Debug)]
pub(crate) struct Response {
    pub(crate) data: String,
    pub(crate) status: String,
}
