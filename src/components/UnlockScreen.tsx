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
    <div className="flex min-h-screen items-center justify-center bg-background bg-dot-grid px-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <Lock className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('setup.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('unlock.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-8 py-8 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('unlock.master_password')}</Label>
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
              className={error ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <Button
            className="w-full font-medium"
            disabled={!password || loading}
            onClick={handleSubmit}
          >
            {loading ? t('settings.submitting') : t('unlock.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
