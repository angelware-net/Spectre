use serde::Serialize;

#[derive(Serialize)]
pub struct UserResponse {
    username: Option<String>,
    requires_two_factor_auth: Option<Vec<String>>,
    message: Option<String>,
    response_body: Option<String>,
}
