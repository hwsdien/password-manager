use crate::crypto::{derive_kek, generate_password as gen_pwd, random_bytes};
use crate::models::{Entry, VaultState};
use crate::vault::{read_kek_header, read_vault, vault_exists, write_vault};
use std::io::Read;
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;

fn vault_path(app: &tauri::AppHandle) -> String {
    let data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    std::fs::create_dir_all(&data_dir).ok();
    data_dir
        .join("passwords.vault")
        .to_string_lossy()
        .into_owned()
}

#[tauri::command]
pub fn check_vault_exists(app: tauri::AppHandle) -> bool {
    vault_exists(&vault_path(&app))
}

#[tauri::command]
pub fn setup_vault(
    master_password: String,
    app: tauri::AppHandle,
    state: State<VaultState>,
) -> Result<(), String> {
    let dek: [u8; 32] = random_bytes();
    let empty_entries: Vec<Entry> = vec![];
    let plaintext = serde_json::to_vec(&empty_entries).map_err(|e| e.to_string())?;
    write_vault(&vault_path(&app), &master_password, &dek, &plaintext)?;
    state.set_dek(dek);
    Ok(())
}

#[tauri::command]
pub fn unlock_vault(
    master_password: String,
    app: tauri::AppHandle,
    state: State<VaultState>,
) -> Result<Vec<Entry>, String> {
    let path = vault_path(&app);
    let (dek, plaintext) = read_vault(&path, &master_password)?;
    let entries: Vec<Entry> = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;
    state.set_dek(dek);
    Ok(entries)
}

#[tauri::command]
pub fn save_vault(
    entries: Vec<Entry>,
    app: tauri::AppHandle,
    state: State<VaultState>,
) -> Result<(), String> {
    let path = vault_path(&app);
    let kek_header = read_kek_header(&path)?;
    let plaintext = serde_json::to_vec(&entries).map_err(|e| e.to_string())?;
    let dek = state.with_dek(|k| k)?;
    let (nonce_dek, ciphertext) = crate::crypto::encrypt(&dek, &plaintext)?;
    let mut new_data = kek_header;
    new_data.extend_from_slice(&nonce_dek);
    new_data.extend_from_slice(&ciphertext);
    std::fs::write(&path, &new_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn change_master_password(
    old_password: String,
    new_password: String,
    app: tauri::AppHandle,
    state: State<VaultState>,
) -> Result<(), String> {
    let path = vault_path(&app);
    let (dek, _plaintext) = read_vault(&path, &old_password)?;

    let original = std::fs::read(&path).map_err(|e| e.to_string())?;
    let content_part = &original[crate::vault::OFFSET_NONCE_DEK..];

    let new_salt_kek: [u8; 32] = random_bytes();
    let new_kek = derive_kek(&new_password, &new_salt_kek)?;
    let (new_nonce_kek, new_encrypted_dek) = crate::crypto::encrypt(&new_kek, &dek)?;

    let mut new_data = Vec::new();
    new_data.extend_from_slice(b"PSMV");
    new_data.push(1u8);
    new_data.extend_from_slice(&new_salt_kek);
    new_data.extend_from_slice(&new_nonce_kek);
    new_data.extend_from_slice(&new_encrypted_dek);
    new_data.extend_from_slice(content_part);
    std::fs::write(&path, &new_data).map_err(|e| e.to_string())?;

    state.set_dek(dek);
    Ok(())
}

#[tauri::command]
pub fn generate_password_cmd(length: u8, symbols: bool) -> String {
    gen_pwd(length, symbols)
}

const MIN_VAULT_SIZE: u64 = 109;

#[tauri::command]
pub async fn export_vault(app: tauri::AppHandle) -> Result<bool, String> {
    let src = vault_path(&app);
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .set_file_name("vault-backup.psmv")
        .save_file(move |result| {
            let _ = tx.send(result);
        });
    let dest = rx.await.map_err(|_| "cancelled".to_string())?;
    let Some(dest) = dest else {
        return Ok(false);
    };
    let dest_path: std::path::PathBuf = dest.into_path().map_err(|e| e.to_string())?;
    std::fs::copy(&src, &dest_path).map_err(|_| "io_error".to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn import_vault(
    app: tauri::AppHandle,
    state: State<'_, VaultState>,
) -> Result<bool, String> {
    let dest = vault_path(&app);
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter("Vault", &["psmv"])
        .pick_file(move |result| {
            let _ = tx.send(result);
        });
    let src_fp = rx.await.map_err(|_| "cancelled".to_string())?;
    let Some(src_fp) = src_fp else {
        return Ok(false);
    };
    let src: std::path::PathBuf = src_fp.into_path().map_err(|e| e.to_string())?;
    let meta = std::fs::metadata(&src).map_err(|_| "io_error".to_string())?;
    if meta.len() < MIN_VAULT_SIZE {
        return Err("invalid_format".to_string());
    }
    let mut f = std::fs::File::open(&src).map_err(|_| "io_error".to_string())?;
    let mut header = [0u8; 5];
    f.read_exact(&mut header).map_err(|_| "invalid_format".to_string())?;
    if &header[..4] != b"PSMV" || header[4] != 1 {
        return Err("invalid_format".to_string());
    }
    let dest_path = std::path::PathBuf::from(&dest);
    let tmp = dest_path.with_extension("vault.tmp");
    std::fs::copy(&src, &tmp).map_err(|_| "io_error".to_string())?;
    std::fs::rename(&tmp, &dest_path).map_err(|_| "io_error".to_string())?;
    state.clear_dek();
    Ok(true)
}
