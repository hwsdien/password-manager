import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

interface Props {
  t: (key: string) => string;
  onUnlock: (password: string) => Promise<void>;
}

export default function UnlockScreen({ t, onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      await onUnlock(password);
    } catch {
      setError(t('unlock.error'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-cipher-grid px-6">
      <div className="w-full max-w-[340px] animate-fade-up">

        {/* Top cipher label */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-[9px] tracking-[0.5em] text-primary/40 uppercase select-none">
            Cipher Vault
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        {/* Icon with rings */}
        <div className="flex justify-center mb-8">
          <div className="relative h-24 w-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-glow-breathe" />
            <div className="absolute inset-0 rounded-full border border-dashed border-primary/15 animate-ring-rotate" />
            <div className="absolute inset-[7px] rounded-full border border-primary/22" />
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/10">
              <Lock className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-[0.06em] text-foreground">
            {t('setup.title')}
          </h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground/70 tracking-wider">
            {t('unlock.subtitle')}
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
              {t('unlock.master_password')}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              placeholder={t('unlock.placeholder')}
              className={`font-mono bg-input/60 border-border/70 focus:border-primary/50 ${
                error ? 'border-destructive focus-visible:ring-destructive/30' : ''
              }`}
            />
            {error && (
              <p className="text-[11px] font-mono text-destructive">{error}</p>
            )}
          </div>

          <Button
            className="w-full tracking-[0.14em] font-semibold"
            disabled={!password || loading}
            onClick={handleSubmit}
          >
            {loading ? t('settings.submitting') : t('unlock.submit')}
          </Button>
        </div>

        {/* Bottom crypto tag */}
        <p className="mt-5 text-center text-[9px] font-mono text-muted-foreground/30 tracking-[0.35em]">
          AES-256-GCM · ARGON2ID
        </p>
      </div>
    </div>
  );
}
