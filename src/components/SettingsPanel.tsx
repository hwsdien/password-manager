import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/tauri';
import { getTheme, setTheme, Theme } from '@/lib/theme';
import { Lang } from '@/lib/i18n';
import { KeyRound, CheckCircle2, Moon, Sun, Download, Upload } from 'lucide-react';
import PasswordStrength, { getStrength } from './PasswordStrength';

interface Props {
  t: (key: string) => string;
  open: boolean;
  onClose: () => void;
  onLangChange: (l: Lang) => void;
  onImportSuccess: () => void;
}

export default function SettingsPanel({ t, open, onClose, onLangChange, onImportSuccess }: Props) {
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
      await api.exportVault();
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
        onClose();
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
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:max-w-[400px] overflow-y-auto bg-card border-border/60 px-0"
      >
        <SheetHeader className="px-6 pb-5 pt-1 border-b border-border/50">
          <SheetTitle className="text-base font-semibold">
            {t('settings.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 pt-6 pb-8 space-y-6">
          {/* Section 1: Change Password */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <KeyRound className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t('settings.change_password')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.change_password_sub')}</p>
              </div>
            </div>

            <div className="space-y-3 pl-12">
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('settings.placeholder_current')}
              />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.placeholder_new')}
              />
              <PasswordStrength password={newPassword} t={t} />
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('settings.placeholder_confirm')}
                className={mismatch ? 'border-destructive' : ''}
              />
              {mismatch && (
                <p className="text-xs text-destructive">{t('settings.mismatch')}</p>
              )}
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} />
                  <p className="text-xs text-emerald-400">{t('settings.success')}</p>
                </div>
              )}
              <Button
                className="w-full"
                disabled={!oldPassword || isWeak || newPassword !== confirm || loading}
                onClick={handleChange}
              >
                {loading ? t('settings.submitting') : t('settings.submit')}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Section 2: Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                {currentTheme === 'dark'
                  ? <Moon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  : <Sun className="h-4 w-4 text-primary" strokeWidth={1.5} />
                }
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t('settings.appearance')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.appearance_sub')}</p>
              </div>
            </div>

            <div className="pl-12 space-y-2">
              <Label className="text-xs text-muted-foreground">{t('settings.theme')}</Label>
              <div className="flex rounded-lg border border-border/60 overflow-hidden">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    currentTheme === 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  {t('settings.theme_dark')}
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    currentTheme === 'light'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  {t('settings.theme_light')}
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Section 3: Language */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <span className="text-primary font-semibold text-sm">中</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t('settings.language')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.language_sub')}</p>
              </div>
            </div>

            <div className="pl-12 space-y-2">
              <Label className="text-xs text-muted-foreground">{t('settings.lang_label')}</Label>
              <div className="flex rounded-lg border border-border/60 overflow-hidden">
                <button
                  onClick={() => handleLangChange('zh')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    currentLang === 'zh'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  简体中文
                </button>
                <button
                  onClick={() => handleLangChange('en')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
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

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Section 4: Data Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Download className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t('settings.data')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings.data_sub')}</p>
              </div>
            </div>

            <div className="pl-12 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{t('settings.export')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.export_sub')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="shrink-0 border-border/60"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                  {t('settings.export_btn')}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{t('settings.import')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.import_sub')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportConfirmOpen(true)}
                  className="shrink-0 border-border/60"
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

        {/* Import Confirm Dialog */}
        <Dialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.import_confirm_title')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t('settings.import_confirm_msg')}</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setImportConfirmOpen(false)}
              >
                {t('settings.import_confirm_cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleImport}
              >
                {t('settings.import_confirm_ok')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
