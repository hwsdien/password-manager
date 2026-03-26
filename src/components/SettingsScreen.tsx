import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/tauri';
import { getTheme, setTheme, Theme } from '@/lib/theme';
import { Lang } from '@/lib/i18n';
import { ArrowLeft, KeyRound, CheckCircle2, ShieldCheck, Moon, Sun, Download, Upload } from 'lucide-react';
import PasswordStrength, { getStrength } from './PasswordStrength';

interface Props {
  t: (key: string) => string;
  onBack: () => void;
  onLangChange: (l: Lang) => void;
  onImportSuccess: () => void;
}

export default function SettingsScreen({ t, onBack, onLangChange, onImportSuccess }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());
  const [currentLang, setCurrentLang] = useState<Lang>('zh');
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importError, setImportError] = useState('');

  const strength = getStrength(newPassword);
  const isWeak = strength === 'weak';
  const mismatch = confirm.length > 0 && newPassword !== confirm;

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
  };

  const handleLangChange = (lang: Lang) => {
    setCurrentLang(lang);
    onLangChange(lang);
  };

  const handleChange = async () => {
    if (!oldPassword || isWeak || newPassword !== confirm) return;
    setLoading(true);
    setError('');
    try {
      await api.changeMasterPassword(oldPassword, newPassword);
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
    } catch {
      setError(t('settings.error_wrong_password'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await api.exportVault();
      if (result) {
        // show success feedback
      }
    } catch {
      // silent fail
    }
  };

  const handleImport = async () => {
    setImportConfirmOpen(false);
    setImportError('');
    try {
      const result = await api.importVault();
      if (result) {
        onImportSuccess();
      }
    } catch (e: unknown) {
      const err = String(e);
      if (err.includes('invalid_format')) {
        setImportError(t('settings.import_invalid'));
      } else if (err.includes('io_error')) {
        setImportError(t('settings.import_io_error'));
      } else {
        setImportError(t('settings.import_error'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-sm tracking-wide">{t('setup.title')}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground px-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          {t('settings.back')}
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-5 pt-10 pb-10 animate-fade-up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Change Password Card */}
          <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3.5 px-6 pt-6 pb-5 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <KeyRound className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t('settings.change_password')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t('settings.change_password_sub')}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('settings.current_password')}</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={t('settings.placeholder_current')}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('settings.new_password')}</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.placeholder_new')}
                />
                <PasswordStrength password={newPassword} t={t} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('settings.confirm_new_password')}</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('settings.placeholder_confirm')}
                  className={mismatch ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                />
                {mismatch && (
                  <p className="text-xs text-destructive">{t('settings.mismatch')}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {success && (
                <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
                  <p className="text-sm text-emerald-400">{t('settings.success')}</p>
                </div>
              )}

              <Button
                className="w-full font-medium"
                disabled={!oldPassword || isWeak || newPassword !== confirm || loading}
                onClick={handleChange}
              >
                {loading ? t('settings.submitting') : t('settings.submit')}
              </Button>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3.5 px-6 pt-6 pb-5 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                {currentTheme === 'dark'
                  ? <Moon className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
                  : <Sun className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
                }
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t('settings.appearance')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t('settings.appearance_sub')}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('settings.theme')}</Label>
                <div className="flex rounded-lg border border-border/60 overflow-hidden">
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      currentTheme === 'dark'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted'
                    }`}
                  >
                    {t('settings.theme_dark')}
                  </button>
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      currentTheme === 'light'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted'
                    }`}
                  >
                    {t('settings.theme_light')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Language Card */}
          <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3.5 px-6 pt-6 pb-5 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <span className="text-primary font-semibold text-sm">中</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t('settings.language')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t('settings.language_sub')}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('settings.lang_label')}</Label>
                <div className="flex rounded-lg border border-border/60 overflow-hidden">
                  <button
                    onClick={() => handleLangChange('zh')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      currentLang === 'zh'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted'
                    }`}
                  >
                    简体中文
                  </button>
                  <button
                    onClick={() => handleLangChange('en')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      currentLang === 'en'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Card */}
          <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-3.5 px-6 pt-6 pb-5 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <Download className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t('settings.data')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t('settings.data_sub')}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t('settings.export')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.export_sub')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="ml-4 shrink-0 border-border/60"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                    {t('settings.export_btn')}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t('settings.import')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.import_sub')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportConfirmOpen(true)}
                    className="ml-4 shrink-0 border-border/60"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                    {t('settings.import_btn')}
                  </Button>
                </div>

                {importError && (
                  <p className="text-xs text-destructive">{importError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Confirm Dialog */}
      {importConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-base font-semibold">{t('settings.import_confirm_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.import_confirm_msg')}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border/60"
                onClick={() => setImportConfirmOpen(false)}
              >
                {t('settings.import_confirm_cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleImport}
              >
                {t('settings.import_confirm_ok')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
