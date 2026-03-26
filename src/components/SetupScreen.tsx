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
    <div className="flex min-h-screen items-center justify-center bg-background bg-cipher-grid px-6">
      <div className="w-full max-w-[360px] animate-fade-up">

        {/* Top cipher label */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-[9px] tracking-[0.5em] text-primary/40 uppercase select-none">
            Cipher Vault
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        {/* Icon with rings */}
        <div className="flex justify-center mb-7">
          <div className="relative h-24 w-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-glow-breathe" />
            <div className="absolute inset-0 rounded-full border border-dashed border-primary/15 animate-ring-rotate" />
            <div className="absolute inset-[7px] rounded-full border border-primary/22" />
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold tracking-[0.06em] text-foreground">
            {t('setup.title')}
          </h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground/70 tracking-wider">
            {t('setup.subtitle')}
          </p>
        </div>

        {/* Form panel with corner brackets */}
        <div className="relative border border-border bg-card/90 backdrop-blur-md px-6 py-6 space-y-4">
          <span className="pointer-events-none absolute -top-px -left-px h-3.5 w-3.5 border-t border-l border-primary/60" />
          <span className="pointer-events-none absolute -top-px -right-px h-3.5 w-3.5 border-t border-r border-primary/60" />
          <span className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b border-l border-primary/60" />
          <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b border-r border-primary/60" />

          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.25em] text-muted-foreground/80 uppercase">
              {t('setup.master_password')}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('setup.placeholder_password')}
              className="font-mono bg-input/60 border-border/70 focus:border-primary/50"
            />
            <PasswordStrength password={password} t={t} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.25em] text-muted-foreground/80 uppercase">
              {t('setup.confirm_password')}
            </Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('setup.placeholder_confirm')}
              className={`font-mono bg-input/60 border-border/70 focus:border-primary/50 ${
                mismatch ? 'border-destructive focus-visible:ring-destructive/30' : ''
              }`}
            />
            {mismatch && (
              <p className="text-[11px] font-mono text-destructive">{t('setup.mismatch')}</p>
            )}
          </div>

          {error && <p className="text-[11px] font-mono text-destructive">{error}</p>}

          <Button
            className="w-full tracking-[0.14em] font-semibold"
            disabled={isWeak || password !== confirm || loading}
            onClick={handleSubmit}
          >
            {loading ? t('settings.submitting') : t('setup.submit')}
          </Button>

          {/* Warning */}
          <div className="flex items-start gap-2.5 border border-border/40 bg-muted/20 px-3.5 py-3">
            <AlertTriangle className="w-3 h-3 text-muted-foreground/50 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[11px] font-mono text-muted-foreground/50 leading-relaxed">
              {t('setup.subtitle')}
            </p>
          </div>
        </div>

        {/* Bottom crypto tag */}
        <p className="mt-5 text-center text-[9px] font-mono text-muted-foreground/30 tracking-[0.35em]">
          AES-256-GCM · ARGON2ID
        </p>
      </div>
    </div>
  );
}
