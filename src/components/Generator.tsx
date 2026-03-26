import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/tauri';
import { RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  t: (key: string) => string;
  onUse: (password: string) => void;
}

export default function Generator({ t, onUse }: Props) {
  const [length, setLength] = useState(16);
  const [symbols, setSymbols] = useState(true);
  const [generated, setGenerated] = useState('');

  const handleGenerate = async () => {
    const pwd = await api.generatePassword(length, symbols);
    setGenerated(pwd);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-6 shrink-0">{t('gen.length')}</span>
          <input
            type="range"
            min={8}
            max={32}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="flex-1 accent-primary cursor-pointer"
          />
          <span className="text-xs font-mono text-foreground w-5 text-right shrink-0">{length}</span>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            id="symbols"
            type="checkbox"
            checked={symbols}
            onChange={(e) => setSymbols(e.target.checked)}
            className="w-3.5 h-3.5 accent-primary"
          />
          <span className="text-xs text-muted-foreground">{t('gen.symbols')}</span>
        </label>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        className="w-full h-8 border-primary/25 text-primary/80 hover:bg-primary/8
                   hover:text-primary hover:border-primary/40 gap-2 font-medium"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
        {t('gen.generate')}
      </Button>

      {generated && (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted/60 border border-primary/15 px-3 py-2
                           text-xs font-mono text-primary break-all">
            {generated}
          </code>
          <Button
            size="sm"
            onClick={() => onUse(generated)}
            className="h-8 w-8 p-0 shrink-0"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </div>
      )}
    </div>
  );
}
