use crate::store::{self, ProviderConfig};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri::ipc::Channel;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio_util::io::StreamReader;

// ── Types ──

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderInput {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub api_key: String,
    pub model_id: String,
    pub max_tokens: u32,
    pub model_list: Option<Vec<String>>,
    pub api_style: Option<String>,
    pub reasoning_level: Option<String>,
    pub temperature: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderView {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub model_id: String,
    pub max_tokens: u32,
    pub has_api_key: bool,
    pub api_key_masked: Option<String>,
    pub model_list: Option<Vec<String>>,
    pub api_style: Option<String>,
    pub reasoning_level: Option<String>,
    pub temperature: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenPayload {
    pub token: String,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub ok: bool,
    pub error: String,
}

// ── API Key storage (HKDF-SHA256 + AES-256-GCM) ──

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;
use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit};
use aes_gcm::aead::Aead;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use hkdf::Hkdf;
use sha2::Sha256;

/// Read macOS hardware UUID via IOPlatformExpertDevice (no root required)
#[cfg(target_os = "macos")]
fn get_machine_uuid() -> Option<String> {
    let output = std::process::Command::new("ioreg")
        .args(["-rd1", "-c", "IOPlatformExpertDevice"])
        .output()
        .ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        if line.contains("IOPlatformUUID") {
            // Format:   "IOPlatformUUID" = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
            return line.split('=').nth(1)?.trim().trim_matches('"').to_string().into();
        }
    }
    None
}

#[cfg(not(target_os = "macos"))]
fn get_machine_uuid() -> Option<String> {
    // Fallback for non-macOS: use hostname
    hostname::get().ok().map(|h| h.to_string_lossy().to_string())
}

static CACHED_KEY: OnceLock<[u8; 32]> = OnceLock::new();

/// Derive AES-256 key via HKDF-SHA256 using hardware UUID as IKM.
/// Runs ~1ms vs PBKDF2's ~300ms. Cached after first call.
fn derive_key(_app: &AppHandle) -> [u8; 32] {
    *CACHED_KEY.get_or_init(|| {
        let uuid = get_machine_uuid().expect("failed to read machine UUID");
        let ikm = uuid.as_bytes();
        let hk = Hkdf::<Sha256>::new(Some(b"eduvision-ai-v1"), ikm);
        let mut key = [0u8; 32];
        hk.expand(b"aes-256-gcm-key", &mut key).expect("HKDF expand failed");
        key
    })
}

fn encrypt_value(app: &AppHandle, plaintext: &str) -> Result<String, String> {
    let key_bytes = derive_key(app);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
    let mut nonce_bytes = [0u8; 12];
    getrandom::getrandom(&mut nonce_bytes).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes()).map_err(|e| e.to_string())?;
    // Format: base64(nonce + ciphertext)
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(BASE64.encode(&combined))
}

fn decrypt_value(app: &AppHandle, encrypted: &str) -> Result<String, String> {
    let combined = BASE64.decode(encrypted).map_err(|e| e.to_string())?;
    if combined.len() < 12 {
        return Err("invalid encrypted data".to_string());
    }
    let key_bytes = derive_key(app);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
    let nonce = Nonce::from_slice(&combined[..12]);
    let plaintext = cipher.decrypt(nonce, &combined[12..]).map_err(|e| e.to_string())?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

fn keys_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("keys.enc.json")
}

/// Migrate from old plaintext keys.json if it exists
fn migrate_plaintext_keys(app: &AppHandle) {
    let dir = app.path().app_data_dir().expect("failed to get app data dir");
    let old_path = dir.join("keys.json");
    let new_path = dir.join("keys.enc.json");
    if old_path.exists() && !new_path.exists() {
        if let Ok(data) = fs::read_to_string(&old_path) {
            if let Ok(old_keys) = serde_json::from_str::<HashMap<String, String>>(&data) {
                let mut new_keys = HashMap::new();
                for (id, key) in &old_keys {
                    if let Ok(enc) = encrypt_value(app, key) {
                        new_keys.insert(id.clone(), enc);
                    }
                }
                let json = serde_json::to_string_pretty(&new_keys).unwrap_or_default();
                let _ = fs::write(&new_path, json);
                let _ = fs::remove_file(&old_path);
            }
        }
    }
}

fn load_keys(app: &AppHandle) -> HashMap<String, String> {
    migrate_plaintext_keys(app);
    let path = keys_path(app);
    if !path.exists() {
        return HashMap::new();
    }
    let data = fs::read_to_string(&path).unwrap_or_default();
    serde_json::from_str(&data).unwrap_or_default()
}

fn save_keys(app: &AppHandle, keys: &HashMap<String, String>) -> Result<(), String> {
    let path = keys_path(app);
    let json = serde_json::to_string_pretty(keys).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

fn get_api_key(app: &AppHandle, provider_id: &str) -> Option<String> {
    let keys = load_keys(app);
    keys.get(provider_id)
        .filter(|s| !s.is_empty())
        .and_then(|enc| decrypt_value(app, enc).ok())
}

/// Returns the decrypted API key for display
fn get_api_key_display(app: &AppHandle, provider_id: &str) -> Option<String> {
    let keys = load_keys(app);
    keys.get(provider_id)
        .filter(|s| !s.is_empty())
        .and_then(|enc| decrypt_value(app, enc).ok())
}

fn set_api_key(app: &AppHandle, provider_id: &str, key: &str) -> Result<(), String> {
    let mut keys = load_keys(app);
    let encrypted = encrypt_value(app, key)?;
    keys.insert(provider_id.to_string(), encrypted);
    save_keys(app, &keys)
}

fn delete_api_key(app: &AppHandle, provider_id: &str) {
    let mut keys = load_keys(app);
    keys.remove(provider_id);
    let _ = save_keys(app, &keys);
}

/// Use the provided key if non-empty, otherwise fall back to stored key.
fn resolve_api_key(app: &AppHandle, provider_id: &str, provided: &str) -> String {
    if !provided.is_empty() {
        return provided.to_string();
    }
    get_api_key(app, provider_id).unwrap_or_default()
}

fn build_endpoint(base: &str, api_style: &str) -> String {
    let base = base.trim_end_matches('/');
    // Don't append if the endpoint already contains the full path
    if base.contains("/v1/") {
        return base.to_string();
    }
    match api_style {
        "responses" => format!("{base}/v1/responses"),
        _ => format!("{base}/v1/chat/completions"),
    }
}

fn is_responses_api(api_style: &Option<String>) -> bool {
    api_style.as_deref() == Some("responses")
}

// ── Tauri commands ──

#[tauri::command]
pub fn get_providers(app: AppHandle) -> Vec<ProviderView> {
    store::load_providers(&app)
        .into_iter()
        .map(|p| {
            let has_api_key = get_api_key(&app, &p.id).is_some();
            ProviderView {
                api_key_masked: if has_api_key { get_api_key_display(&app, &p.id) } else { None },
                has_api_key,
                id: p.id,
                name: p.name,
                endpoint: p.endpoint,
                model_id: p.model_id,
                max_tokens: p.max_tokens,
                model_list: p.model_list,
                api_style: p.api_style,
                reasoning_level: p.reasoning_level,
                temperature: p.temperature,
            }
        })
        .collect()
}

#[tauri::command]
pub fn save_provider(app: AppHandle, provider: ProviderInput) -> Result<(), String> {
    // Save API key to file
    if !provider.api_key.is_empty() {
        set_api_key(&app, &provider.id, &provider.api_key)?;
    }

    // Save config to file
    let mut providers = store::load_providers(&app);
    let config = ProviderConfig {
        id: provider.id.clone(),
        name: provider.name,
        endpoint: provider.endpoint,
        model_id: provider.model_id,
        max_tokens: provider.max_tokens,
        model_list: provider.model_list,
        api_style: provider.api_style,
        reasoning_level: provider.reasoning_level,
        temperature: provider.temperature,
    };

    if let Some(existing) = providers.iter_mut().find(|p| p.id == config.id) {
        *existing = config;
    } else {
        providers.push(config);
    }

    store::save_providers(&app, &providers)
}

#[tauri::command]
pub fn remove_provider(app: AppHandle, id: String) -> Result<(), String> {
    delete_api_key(&app, &id);
    let providers: Vec<_> = store::load_providers(&app)
        .into_iter()
        .filter(|p| p.id != id)
        .collect();
    store::save_providers(&app, &providers)
}

#[tauri::command]
pub async fn test_connection(app: AppHandle, provider: ProviderInput) -> TestResult {
    let client = reqwest::Client::new();
    let is_claude =
        provider.endpoint.contains("anthropic") || provider.name.eq_ignore_ascii_case("claude");
    let is_resp = is_responses_api(&provider.api_style);
    let url = if is_claude {
        let base = provider.endpoint.trim_end_matches('/');
        if base.contains("/v1/") {
            base.to_string()
        } else {
            format!("{base}/v1/messages")
        }
    } else {
        build_endpoint(&provider.endpoint, provider.api_style.as_deref().unwrap_or("chat-completions"))
    };
    let api_key = resolve_api_key(&app, &provider.id, &provider.api_key);

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Content-Type", "application/json".parse().unwrap());

    if is_claude {
        headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
        if !api_key.is_empty() {
            headers.insert("x-api-key", api_key.parse().unwrap());
        }
    } else if !api_key.is_empty() {
        headers.insert(
            "Authorization",
            format!("Bearer {}", api_key).parse().unwrap(),
        );
    }

    // Require model_id for testing — no fallback guesses
    if provider.model_id.is_empty() {
        return TestResult {
            ok: false,
            error: "请先填写模型 ID 再测试连接".to_string(),
        };
    }
    let test_model = &provider.model_id;

    let body = if is_resp {
        serde_json::json!({
            "model": test_model,
            "input": [{"role": "user", "content": "hi"}],
            "max_output_tokens": 1
        })
    } else {
        serde_json::json!({
            "model": test_model,
            "max_tokens": 1,
            "messages": [{"role": "user", "content": "hi"}]
        })
    };

    match client
        .post(&url)
        .headers(headers)
        .json(&body)
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                TestResult {
                    ok: true,
                    error: String::new(),
                }
            } else {
                let status = res.status().as_u16();
                let text = res.text().await.unwrap_or_default();
                TestResult {
                    ok: false,
                    error: format!("HTTP {status} [{url}]: {}", &text[..text.len().min(300)]),
                }
            }
        }
        Err(e) => TestResult {
            ok: false,
            error: format!("{} [{url}]", e),
        },
    }
}

#[tauri::command]
pub async fn fetch_models(app: AppHandle, provider: ProviderInput) -> Vec<String> {
    let api_key = resolve_api_key(&app, &provider.id, &provider.api_key);

    // Build candidate model endpoint URLs, stripping known provider suffixes
    // (e.g. /anthropic, /api/coding) to try the root domain — same approach as cc-switch
    let base = provider.endpoint.trim_end_matches('/');
    let base = if let Some(pos) = base.find("/v1/") {
        &base[..pos]
    } else {
        base
    };

    let known_suffixes = &[
        "/api/claudecode", "/api/anthropic", "/apps/anthropic", "/api/coding",
        "/claudecode", "/anthropic", "/step_plan", "/coding", "/claude",
    ];

    let mut roots: Vec<&str> = vec![base];
    // Try stripping the longest matching suffix first
    for suffix in known_suffixes {
        if base.ends_with(suffix) {
            let stripped = &base[..base.len() - suffix.len()];
            if !stripped.is_empty() && !roots.contains(&stripped) {
                roots.push(stripped);
            }
        }
    }

    let mut candidate_urls: Vec<String> = Vec::new();
    for root in &roots {
        let url = format!("{root}/v1/models");
        if !candidate_urls.contains(&url) { candidate_urls.push(url); }
        let url = format!("{root}/models");
        if !candidate_urls.contains(&url) { candidate_urls.push(url); }
    }

    let mut headers = reqwest::header::HeaderMap::new();
    if !api_key.is_empty() {
        headers.insert("x-api-key", api_key.parse().unwrap());
        headers.insert(
            "Authorization",
            format!("Bearer {}", api_key).parse().unwrap(),
        );
    }
    headers.insert("anthropic-version", "2023-06-01".parse().unwrap());

    let client = reqwest::Client::new();
    for models_url in &candidate_urls {
        if let Ok(res) = client
            .get(models_url)
            .headers(headers.clone())
            .timeout(std::time::Duration::from_secs(10))
            .send()
            .await
        {
            let status = res.status();
            if status.is_success() {
                if let Ok(data) = res.json::<serde_json::Value>().await {
                    let arr = data["data"].as_array().or_else(|| data.as_array());
                    if let Some(arr) = arr {
                        let mut models: Vec<String> = arr
                            .iter()
                            .filter_map(|m| m["id"].as_str().map(String::from))
                            .collect();
                        models.sort();
                        if !models.is_empty() {
                            return models;
                        }
                    }
                }
            } else {
            }
        }
    }

    // Fallback only for known built-in providers (by name).
    // Custom/third-party proxies return empty — user enters model ID manually.
    let name = provider.name.to_lowercase();
    if name.contains("claude") || name.contains("anthropic") {
        return vec![
            "claude-opus-4-20250514",
            "claude-sonnet-4-20250514",
            "claude-3-5-haiku-20241022",
            "claude-3-5-sonnet-20241022",
        ]
        .into_iter()
        .map(String::from)
        .collect();
    }
    if name.contains("openai") {
        return vec![
            "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini",
            "o3", "o3-mini", "o4-mini", "o1", "o1-mini", "o1-pro",
        ]
        .into_iter()
        .map(String::from)
        .collect();
    }
    if name.contains("gemini") {
        return vec![
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
        ]
        .into_iter()
        .map(String::from)
        .collect();
    }
    if name.contains("openrouter") {
        return vec![
            "openai/gpt-4o",
            "openai/gpt-4o-mini",
            "anthropic/claude-sonnet-4",
            "google/gemini-2.0-flash",
            "meta-llama/llama-3.1-70b-instruct",
        ]
        .into_iter()
        .map(String::from)
        .collect();
    }
    if name.contains("ollama") {
        return vec!["llama3.2", "llama3.1", "mistral", "codellama", "qwen2.5", "phi3"]
            .into_iter()
            .map(String::from)
            .collect();
    }
    if name.contains("copilot") {
        return vec!["gpt-4o", "gpt-4o-mini", "gpt-4", "o1-mini"]
            .into_iter()
            .map(String::from)
            .collect();
    }

    // Unknown provider — no hardcoded fallback
    vec![]
}

#[tauri::command]
pub async fn stream_chat(
    app: AppHandle,
    provider_id: String,
    messages: Vec<ChatMessage>,
    on_event: Channel<TokenPayload>,
) -> Result<(), String> {
    let config = store::get_provider(&app, &provider_id)
        .ok_or_else(|| format!("provider {provider_id} not found"))?;
    if config.model_id.is_empty() {
        return Err("请先在设置中选择一个模型".to_string());
    }
    let api_key = get_api_key(&app, &provider_id).unwrap_or_default();

    let is_claude =
        config.endpoint.contains("anthropic") || config.name.eq_ignore_ascii_case("claude");
    let is_resp = is_responses_api(&config.api_style);
    let url = if is_claude {
        let base = config.endpoint.trim_end_matches('/');
        if base.contains("/v1/") {
            base.to_string()
        } else {
            format!("{base}/v1/messages")
        }
    } else {
        build_endpoint(&config.endpoint, config.api_style.as_deref().unwrap_or("chat-completions"))
    };
    let client = reqwest::Client::new();

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Content-Type", "application/json".parse().unwrap());

    if is_claude {
        headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
        if !api_key.is_empty() {
            headers.insert("x-api-key", api_key.parse().unwrap());
        }
    } else if !api_key.is_empty() {
        headers.insert(
            "Authorization",
            format!("Bearer {api_key}").parse().unwrap(),
        );
    }

    let reasoning = config.reasoning_level.as_deref().unwrap_or("off");
    let temp = config.temperature.unwrap_or(1.0);

    let body = if is_claude {
        let system_msg = messages.iter().find(|m| m.role == "system");
        let chat_msgs: Vec<_> = messages
            .iter()
            .filter(|m| m.role != "system")
            .map(|m| serde_json::json!({"role": m.role, "content": m.content}))
            .collect();
        let mut b = serde_json::json!({
            "model": config.model_id,
            "max_tokens": config.max_tokens,
            "messages": chat_msgs,
            "stream": true,
            "temperature": temp,
        });
        if let Some(sys) = system_msg {
            b["system"] = serde_json::json!(sys.content);
        }
        match reasoning {
            "low" => { b["thinking"] = serde_json::json!({"type": "enabled", "budget_tokens": 1024}); }
            "medium" => { b["thinking"] = serde_json::json!({"type": "enabled", "budget_tokens": 4096}); }
            "high" => { b["thinking"] = serde_json::json!({"type": "enabled", "budget_tokens": 8192}); }
            _ => {}
        }
        b
    } else if is_resp {
        let system_msg = messages.iter().find(|m| m.role == "system");
        let input_msgs: Vec<_> = messages
            .iter()
            .filter(|m| m.role != "system")
            .map(|m| serde_json::json!({"role": m.role, "content": m.content}))
            .collect();
        let mut b = serde_json::json!({
            "model": config.model_id,
            "input": input_msgs,
            "stream": true,
            "max_output_tokens": config.max_tokens,
            "temperature": temp,
        });
        if let Some(sys) = system_msg {
            b["instructions"] = serde_json::json!(sys.content);
        }
        match reasoning {
            "low" => { b["reasoning"] = serde_json::json!({"effort": "low"}); }
            "medium" => { b["reasoning"] = serde_json::json!({"effort": "medium"}); }
            "high" => { b["reasoning"] = serde_json::json!({"effort": "high"}); }
            _ => {}
        }
        b
    } else {
        let msgs: Vec<_> = messages
            .iter()
            .map(|m| serde_json::json!({"role": m.role, "content": m.content}))
            .collect();
        serde_json::json!({
            "model": config.model_id,
            "messages": msgs,
            "max_tokens": config.max_tokens,
            "stream": true,
            "temperature": temp,
        })
    };

    let res = client
        .post(&url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let status = res.status().as_u16();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("API error {status}: {text}"));
    }

    // Convert reqwest byte stream → tokio AsyncRead → BufReader → line iterator
    let byte_stream = res.bytes_stream().map(|r| r.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e)));
    let reader = StreamReader::new(byte_stream);
    let mut lines = BufReader::new(reader).lines();

    while let Some(line) = lines.next_line().await.map_err(|e| e.to_string())? {
        // Skip empty lines and SSE comment/heartbeat lines (start with ':')
        if line.is_empty() || line.starts_with(':') {
            continue;
        }

        // Extract data payload: handle both "data: {...}" and "data:{...}"
        let data = match line.strip_prefix("data: ") {
            Some(rest) => rest,
            None => match line.strip_prefix("data:") {
                Some(rest) => rest,
                None => continue, // event:, id:, retry: — ignore
            },
        };

        if is_claude {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                if json["type"] == "content_block_delta" {
                    if let Some(text) = json["delta"]["text"].as_str() {
                        let _ = on_event.send(TokenPayload {
                            token: text.to_string(),
                            done: false,
                        });
                    }
                }
            }
        } else if is_resp {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                let event_type = json["type"].as_str().unwrap_or("");
                if event_type == "response.output_text.delta" {
                    if let Some(text) = json["delta"].as_str() {
                        let _ = on_event.send(TokenPayload {
                            token: text.to_string(),
                            done: false,
                        });
                    }
                } else if event_type == "response.completed" {
                    let _ = on_event.send(TokenPayload {
                        token: String::new(),
                        done: true,
                    });
                    return Ok(());
                }
            }
        } else {
            if data == "[DONE]" {
                let _ = on_event.send(TokenPayload {
                    token: String::new(),
                    done: true,
                });
                return Ok(());
            }
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                if let Some(delta) = json["choices"][0]["delta"]["content"].as_str() {
                    let _ = on_event.send(TokenPayload {
                        token: delta.to_string(),
                        done: false,
                    });
                }
            }
        }
    }

    // Stream ended without [DONE] (Claude path)
    let _ = on_event.send(TokenPayload {
        token: String::new(),
        done: true,
    });

    Ok(())
}
