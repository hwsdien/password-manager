// src-tauri/src/crypto/mod.rs
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use argon2::{Argon2, Params, Version};
use rand::{rngs::OsRng, RngCore};
use rand::Rng;

const ARGON2_M_COST: u32 = 65536; // 64 MB
const ARGON2_T_COST: u32 = 3;
const ARGON2_P_COST: u32 = 1;

pub fn derive_kek(password: &str, salt: &[u8; 32]) -> Result<[u8; 32], String> {
    let params = Params::new(ARGON2_M_COST, ARGON2_T_COST, ARGON2_P_COST, Some(32))
        .map_err(|e| e.to_string())?;
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params);
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<([u8; 12], Vec<u8>), String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;
    Ok((nonce_bytes, ciphertext))
}

pub fn decrypt(key: &[u8; 32], nonce: &[u8; 12], ciphertext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(nonce);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "invalid master password or corrupted vault".to_string())
}

pub fn random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    OsRng.fill_bytes(&mut bytes);
    bytes
}

pub fn generate_password(length: u8, symbols: bool) -> String {
    let mut charset: Vec<char> = ('a'..='z')
        .chain('A'..='Z')
        .chain('0'..='9')
        .collect();
    if symbols {
        charset.extend("!@#$%^&*()_+-=[]{}|;:,.<>?".chars());
    }
    let mut rng = OsRng;
    (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset[idx]
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_kek_deterministic() {
        let password = "TestPassword123!";
        let salt = [0u8; 32];
        let kek1 = derive_kek(password, &salt).unwrap();
        let kek2 = derive_kek(password, &salt).unwrap();
        assert_eq!(kek1, kek2);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = [42u8; 32];
        let plaintext = b"hello world secret";
        let (nonce, ciphertext) = encrypt(&key, plaintext).unwrap();
        let decrypted = decrypt(&key, &nonce, &ciphertext).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_decrypt_fails_with_wrong_key() {
        let key = [42u8; 32];
        let wrong_key = [99u8; 32];
        let (nonce, ciphertext) = encrypt(&key, b"secret").unwrap();
        assert!(decrypt(&wrong_key, &nonce, &ciphertext).is_err());
    }

    #[test]
    fn test_generate_password_length() {
        let pwd = generate_password(16, true);
        assert_eq!(pwd.len(), 16);
    }

    #[test]
    fn test_generate_password_no_symbols() {
        let pwd = generate_password(12, false);
        assert!(pwd.chars().all(|c| c.is_alphanumeric()));
    }

    #[test]
    fn test_decrypt_fails_with_tampered_ciphertext() {
        let key = [42u8; 32];
        let (nonce, mut ciphertext) = encrypt(&key, b"secret data").unwrap();
        ciphertext[0] ^= 0xFF;
        assert!(decrypt(&key, &nonce, &ciphertext).is_err());
    }
}
