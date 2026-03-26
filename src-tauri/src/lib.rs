pub mod commands;
pub mod crypto;
pub mod models;
pub mod vault;

use commands::{
    change_master_password, check_vault_exists, export_vault, generate_password_cmd, import_vault,
    save_vault, setup_vault, unlock_vault,
};
use models::VaultState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(VaultState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            check_vault_exists,
            setup_vault,
            unlock_vault,
            save_vault,
            change_master_password,
            generate_password_cmd,
            export_vault,
            import_vault,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
