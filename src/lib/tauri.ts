import { invoke } from '@tauri-apps/api/core';

export interface Entry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string | null;
  notes?: string | null;
  category?: string | null;
  created_at: number;
  updated_at: number;
}

export const api = {
  checkVaultExists: () =>
    invoke<boolean>('check_vault_exists'),

  setupVault: (masterPassword: string) =>
    invoke<void>('setup_vault', { masterPassword }),

  unlockVault: (masterPassword: string) =>
    invoke<Entry[]>('unlock_vault', { masterPassword }),

  saveVault: (entries: Entry[]) =>
    invoke<void>('save_vault', { entries }),

  changeMasterPassword: (oldPassword: string, newPassword: string) =>
    invoke<void>('change_master_password', { oldPassword, newPassword }),

  generatePassword: (length: number, symbols: boolean) =>
    invoke<string>('generate_password_cmd', { length, symbols }),

  exportVault: () =>
    invoke<boolean>('export_vault'),

  importVault: () =>
    invoke<boolean>('import_vault'),
};
