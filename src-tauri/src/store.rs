use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub model_id: String,
    pub max_tokens: u32,
    pub model_list: Option<Vec<String>>,
    pub api_style: Option<String>,
    pub reasoning_level: Option<String>,
    pub temperature: Option<f64>,
}

fn providers_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("providers.json")
}

pub fn load_providers(app: &AppHandle) -> Vec<ProviderConfig> {
    let path = providers_path(app);
    if !path.exists() {
        return default_providers();
    }
    let data = fs::read_to_string(&path).unwrap_or_default();
    serde_json::from_str(&data).unwrap_or_else(|_| default_providers())
}

pub fn save_providers(app: &AppHandle, providers: &[ProviderConfig]) -> Result<(), String> {
    let path = providers_path(app);
    let json = serde_json::to_string_pretty(providers).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

pub fn get_provider(app: &AppHandle, id: &str) -> Option<ProviderConfig> {
    load_providers(app).into_iter().find(|p| p.id == id)
}

fn default_providers() -> Vec<ProviderConfig> {
    vec![]
}
