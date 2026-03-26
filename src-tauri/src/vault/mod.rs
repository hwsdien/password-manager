use crate::crypto::{decrypt, derive_kek, encrypt, random_bytes};
use std::fs;
use std::path::Path;

const MAGIC: &[u8; 4] = b"PSMV";
const VERSION: u8 = 1;
const OFFSET_SALT_KEK: usize = 5;
const OFFSET_NONCE_KEK: usize = 37;
const OFFSET_ENCRYPTED_DEK: usize = 49;
pub const OFFSET_NONCE_DEK: usize = 97;
const MIN_HEADER_LEN: usize = 97 + 12;

pub fn vault_exists(path: &str) -> bool {
    Path::new(path).exists()
}

/// Write vault: generates salt_kek internally, derives kek from master_password + salt_kek.
pub fn write_vault(
    path: &str,
    master_password: &str,
    dek: &[u8; 32],
    plaintext: &[u8],
) -> Result<(), String> {
    let salt_kek: [u8; 32] = random_bytes();
    let kek = derive_kek(master_password, &salt_kek)?;
    let (nonce_kek, encrypted_dek) = encrypt(&kek, dek)?;
    let (nonce_dek, ciphertext) = encrypt(dek, plaintext)?;

    let mut data = Vec::new();
    data.extend_from_slice(MAGIC);
    data.push(VERSION);
    data.extend_from_slice(&salt_kek);
    data.extend_from_slice(&nonce_kek);
    data.extend_from_slice(&encrypted_dek);
    data.extend_from_slice(&nonce_dek);
    data.extend_from_slice(&ciphertext);

    fs::write(path, &data).map_err(|_| "failed to write vault file".to_string())
}

/// Read vault: reads salt_kek from file, re-derives kek from master_password + salt_kek.
pub fn read_vault(path: &str, master_password: &str) -> Result<([u8; 32], Vec<u8>), String> {
    let data = fs::read(path).map_err(|_| "failed to read vault file".to_string())?;

    if data.len() < MIN_HEADER_LEN {
        return Err("invalid master password or corrupted vault".to_string());
    }
    if &data[0..4] != MAGIC {
        return Err("invalid master password or corrupted vault".to_string());
    }

    let salt_kek: [u8; 32] = data[OFFSET_SALT_KEK..OFFSET_NONCE_KEK].try_into().unwrap();
    let nonce_kek: [u8; 12] = data[OFFSET_NONCE_KEK..OFFSET_ENCRYPTED_DEK].try_into().unwrap();
    let encrypted_dek = &data[OFFSET_ENCRYPTED_DEK..OFFSET_NONCE_DEK];
    let nonce_dek: [u8; 12] = data[OFFSET_NONCE_DEK..OFFSET_NONCE_DEK + 12].try_into().unwrap();
    let ciphertext = &data[OFFSET_NONCE_DEK + 12..];

    let kek = derive_kek(master_password, &salt_kek)
        .map_err(|_| "invalid master password or corrupted vault".to_string())?;
    let dek_bytes = decrypt(&kek, &nonce_kek, encrypted_dek)?;
    let dek: [u8; 32] = dek_bytes
        .try_into()
        .map_err(|_| "invalid master password or corrupted vault".to_string())?;
    let plaintext = decrypt(&dek, &nonce_dek, ciphertext)?;
    Ok((dek, plaintext))
}

/// Returns the KEK header portion (magic through encrypted_dek, excluding nonce_dek+ciphertext).
/// Used by save_vault to reuse the KEK part when re-encrypting only the content.
pub fn read_kek_header(path: &str) -> Result<Vec<u8>, String> {
    let data = fs::read(path).map_err(|_| "failed to read vault file".to_string())?;
    if data.len() < MIN_HEADER_LEN {
        return Err("invalid master password or corrupted vault".to_string());
    }
    Ok(data[..OFFSET_NONCE_DEK].to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_write_read_roundtrip() {
        let file = NamedTempFile::new().unwrap();
        let path = file.path().to_str().unwrap();
        let dek = [7u8; 32];
        let master_password = "TestPassword123!";
        let plaintext = b"[{\"id\":\"1\",\"title\":\"test\"}]";

        write_vault(path, master_password, &dek, plaintext).unwrap();
        let (read_dek, read_plain) = read_vault(path, master_password).unwrap();
        assert_eq!(read_dek, dek);
        assert_eq!(read_plain, plaintext);
    }

    #[test]
    fn test_read_fails_wrong_password() {
        let file = NamedTempFile::new().unwrap();
        let path = file.path().to_str().unwrap();
        let dek = [7u8; 32];

        write_vault(path, "CorrectPassword1!", &dek, b"data").unwrap();
        assert!(read_vault(path, "WrongPassword1!").is_err());
    }

    #[test]
    fn test_vault_exists() {
        assert!(!vault_exists("/nonexistent/path.vault"));
    }
}
