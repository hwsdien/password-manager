import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import PasswordStrength, { getStrength } from './PasswordStrength';

interface Props {
  t: (key: string) => string;
  onSetup: (password: string) => Promise<void>;
}

export default function SetupScreen({ t, onSetup }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);
  const isWeak = strength === 'weak';
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async () => {
    if (isWeak || password !== confirm) return;
    setLoading(true);
    setError('');
    try {
      await onSetup(password);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-dot-grid px-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <ShieldCheck className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('setup.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('setup.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-8 py-8 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('setup.master_password')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('setup.placeholder_password')}
            />
            <PasswordStrength password={password} t={t} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('setup.confirm_password')}</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('setup.placeholder_confirm')}
              className={mismatch ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {mismatch && (
              <p className="text-xs text-destructive">{t('setup.mismatch')}</p>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            className="w-full font-medium"
            disabled={isWeak || password !== confirm || loading}
            onClick={handleSubmit}
          >
            {loading ? t('settings.submitting') : t('setup.submit')}
          </Button>

          <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 border border-border/60 px-4 py-3">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('setup.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
