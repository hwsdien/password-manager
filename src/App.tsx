import { useEffect, useState } from 'react';
import { api, Entry } from './lib/tauri';
import { getLang, makeT, saveLang, Lang } from './lib/i18n';
import SetupScreen from './components/SetupScreen';
import UnlockScreen from './components/UnlockScreen';
import VaultList from './components/VaultList';
import SettingsPanel from './components/SettingsPanel';

type Screen = 'loading' | 'setup' | 'unlock' | 'vault';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lang, setLang] = useState<Lang>(getLang());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = makeT(lang);

  useEffect(() => {
    api.checkVaultExists().then((exists) => {
      setScreen(exists ? 'unlock' : 'setup');
    });
  }, []);

  const handleSetup = async (password: string) => {
    await api.setupVault(password);
    setEntries([]);
    setScreen('vault');
  };

  const handleUnlock = async (password: string) => {
    const data = await api.unlockVault(password);
    setEntries(data);
    setScreen('vault');
  };

  const handleSave = async (updated: Entry[]) => {
    await api.saveVault(updated);
    setEntries(updated);
  };

  const handleLangChange = (l: Lang) => {
    saveLang(l);
    setLang(l);
  };

  const handleImportSuccess = () => {
    setEntries([]);
    setScreen('unlock');
  };

  if (screen === 'loading') return null;
  if (screen === 'setup') return (
    <SetupScreen t={t} onSetup={handleSetup} />
  );
  if (screen === 'unlock') return (
    <UnlockScreen t={t} onUnlock={handleUnlock} />
  );
  return (
    <>
      <VaultList
        t={t}
        entries={entries}
        onSave={handleSave}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsPanel
        t={t}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLangChange={handleLangChange}
        onImportSuccess={handleImportSuccess}
      />
    </>
  );
}
