use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub(crate) struct Response {
    pub(crate) data: String,
    pub(crate) status: String,
}
