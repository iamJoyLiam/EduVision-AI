use crate::store::{self, ProviderConfig};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

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

// ── Keyring helpers ──

fn keyring_entry(provider_id: &str) -> keyring::Entry {
    keyring::Entry::new("eduvision-ai", &format!("provider_{provider_id}"))
        .expect("failed to create keyring entry")
}

fn get_api_key(provider_id: &str) -> Option<String> {
    keyring_entry(provider_id)
        .get_password()
        .ok()
        .filter(|s| !s.is_empty())
}

fn set_api_key(provider_id: &str, key: &str) -> Result<(), String> {
    keyring_entry(provider_id)
        .set_password(key)
        .map_err(|e| format!("keyring error: {e}"))
}

fn delete_api_key(provider_id: &str) {
    keyring_entry(provider_id).delete_credential().ok();
}

fn build_endpoint(base: &str, api_style: &str) -> String {
    let base = base.trim_end_matches('/');
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
        .map(|p| ProviderView {
            has_api_key: get_api_key(&p.id).is_some(),
            id: p.id,
            name: p.name,
            endpoint: p.endpoint,
            model_id: p.model_id,
            max_tokens: p.max_tokens,
            model_list: p.model_list,
            api_style: p.api_style,
            reasoning_level: p.reasoning_level,
            temperature: p.temperature,
        })
        .collect()
}

#[tauri::command]
pub fn save_provider(app: AppHandle, provider: ProviderInput) -> Result<(), String> {
    // Save API key to keyring
    if !provider.api_key.is_empty() {
        set_api_key(&provider.id, &provider.api_key)?;
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
    delete_api_key(&id);
    let providers: Vec<_> = store::load_providers(&app)
        .into_iter()
        .filter(|p| p.id != id)
        .collect();
    store::save_providers(&app, &providers)
}

#[tauri::command]
pub async fn test_connection(provider: ProviderInput) -> TestResult {
    let client = reqwest::Client::new();
    let is_claude =
        provider.endpoint.contains("anthropic") || provider.name.eq_ignore_ascii_case("claude");
    let is_resp = is_responses_api(&provider.api_style);
    let url = if is_claude {
        format!("{}/v1/messages", provider.endpoint.trim_end_matches('/'))
    } else {
        build_endpoint(&provider.endpoint, provider.api_style.as_deref().unwrap_or("chat-completions"))
    };

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert("Content-Type", "application/json".parse().unwrap());

    if is_claude {
        headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
        if !provider.api_key.is_empty() {
            headers.insert("x-api-key", provider.api_key.parse().unwrap());
        }
    } else if !provider.api_key.is_empty() {
        headers.insert(
            "Authorization",
            format!("Bearer {}", provider.api_key).parse().unwrap(),
        );
    }

    let body = if is_resp {
        serde_json::json!({
            "model": provider.model_id,
            "input": [{"role": "user", "content": "hi"}],
            "max_output_tokens": 1
        })
    } else {
        serde_json::json!({
            "model": provider.model_id,
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
                    error: format!("HTTP {status}: {}", &text[..text.len().min(120)]),
                }
            }
        }
        Err(e) => TestResult {
            ok: false,
            error: e.to_string(),
        },
    }
}

#[tauri::command]
pub async fn fetch_models(provider: ProviderInput) -> Vec<String> {
    let is_claude =
        provider.endpoint.contains("anthropic") || provider.name.eq_ignore_ascii_case("claude");

    // Try live /models endpoint
    let models_url = format!("{}/v1/models", provider.endpoint.trim_end_matches('/'));

    let mut headers = reqwest::header::HeaderMap::new();
    if is_claude {
        headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
        if !provider.api_key.is_empty() {
            headers.insert("x-api-key", provider.api_key.parse().unwrap());
        }
    } else if !provider.api_key.is_empty() {
        headers.insert(
            "Authorization",
            format!("Bearer {}", provider.api_key).parse().unwrap(),
        );
    }

    if let Ok(res) = reqwest::Client::new()
        .get(&models_url)
        .headers(headers)
        .send()
        .await
    {
        if res.status().is_success() {
            if let Ok(data) = res.json::<serde_json::Value>().await {
                if let Some(arr) = data["data"].as_array() {
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
        }
    }

    // Fallback to hardcoded lists
    let name = provider.name.to_lowercase();
    if name.contains("openai") {
        return vec![
            "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini",
            "o3", "o3-mini", "o4-mini", "o1", "o1-mini", "o1-pro",
        ]
        .into_iter()
        .map(String::from)
        .collect();
    }
    if name.contains("claude") {
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

    vec![]
}

#[tauri::command]
pub async fn stream_chat(
    app: AppHandle,
    provider_id: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let config = store::get_provider(&app, &provider_id)
        .ok_or_else(|| format!("provider {provider_id} not found"))?;
    let api_key = get_api_key(&provider_id).unwrap_or_default();

    let is_claude =
        config.endpoint.contains("anthropic") || config.name.eq_ignore_ascii_case("claude");
    let is_resp = is_responses_api(&config.api_style);
    let url = if is_claude {
        format!("{}/v1/messages", config.endpoint.trim_end_matches('/'))
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

    let mut stream = res.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].trim().to_string();
            buffer = buffer[newline_pos + 1..].to_string();

            if !line.starts_with("data: ") {
                continue;
            }
            let data = &line[6..];

            if is_claude {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if json["type"] == "content_block_delta" {
                        if let Some(text) = json["delta"]["text"].as_str() {
                            let _ = app.emit(
                                "ai-token",
                                TokenPayload {
                                    token: text.to_string(),
                                    done: false,
                                },
                            );
                        }
                    }
                }
            } else if is_resp {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    let event_type = json["type"].as_str().unwrap_or("");
                    if event_type == "response.output_text.delta" {
                        if let Some(text) = json["delta"].as_str() {
                            let _ = app.emit(
                                "ai-token",
                                TokenPayload {
                                    token: text.to_string(),
                                    done: false,
                                },
                            );
                        }
                    } else if event_type == "response.completed" {
                        let _ = app.emit(
                            "ai-token",
                            TokenPayload {
                                token: String::new(),
                                done: true,
                            },
                        );
                        return Ok(());
                    }
                }
            } else {
                if data == "[DONE]" {
                    let _ = app.emit(
                        "ai-token",
                        TokenPayload {
                            token: String::new(),
                            done: true,
                        },
                    );
                    return Ok(());
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(delta) = json["choices"][0]["delta"]["content"].as_str() {
                        let _ = app.emit(
                            "ai-token",
                            TokenPayload {
                                token: delta.to_string(),
                                done: false,
                            },
                        );
                    }
                }
            }
        }
    }

    // Stream ended without [DONE] (Claude path)
    let _ = app.emit(
        "ai-token",
        TokenPayload {
            token: String::new(),
            done: true,
        },
    );

    Ok(())
}
