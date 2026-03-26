use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use zeroize::Zeroize;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub id: String,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub category: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Wraps DEK bytes so they are zeroed when dropped.
struct DekBytes([u8; 32]);

impl Drop for DekBytes {
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

/// Tauri managed state: holds the DEK (32 bytes) in memory after unlock.
/// The DEK is zeroed when this state is dropped.
pub struct VaultState {
    dek: Mutex<Option<DekBytes>>,
}

impl VaultState {
    pub fn new() -> Self {
        Self {
            dek: Mutex::new(None),
        }
    }

    /// Store a new DEK (replaces any existing one).
    pub fn set_dek(&self, key: [u8; 32]) {
        let mut guard = self.dek.lock().unwrap();
        *guard = Some(DekBytes(key));
    }

    /// Run `f` with a copy of the DEK, returning `Err` if no DEK is loaded.
    pub fn with_dek<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce([u8; 32]) -> T,
    {
        let guard = self.dek.lock().unwrap();
        match guard.as_ref() {
            Some(bytes) => Ok(f(bytes.0)),
            None => Err("vault is locked".to_string()),
        }
    }

    /// Clear the DEK from memory (e.g., after import).
    pub fn clear_dek(&self) {
        let mut guard = self.dek.lock().unwrap();
        *guard = None;
    }
}

impl Default for VaultState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_state_starts_locked() {
        let state = VaultState::new();
        assert!(state.with_dek(|_| ()).is_err());
    }

    #[test]
    fn test_set_and_retrieve_dek() {
        let state = VaultState::new();
        let key = [42u8; 32];
        state.set_dek(key);
        let result = state.with_dek(|k| k);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), key);
    }

    #[test]
    fn test_default_is_locked() {
        let state = VaultState::default();
        assert!(state.with_dek(|_| ()).is_err());
    }

    #[test]
    fn test_replace_dek() {
        let state = VaultState::new();
        state.set_dek([1u8; 32]);
        state.set_dek([2u8; 32]);
        let result = state.with_dek(|k| k).unwrap();
        assert_eq!(result, [2u8; 32]);
    }
}
