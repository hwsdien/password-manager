import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Entry } from '@/lib/tauri';
import { Eye, EyeOff, Dices } from 'lucide-react';
import Generator from './Generator';

interface Props {
  t: (key: string) => string;
  open: boolean;
  entry?: Entry;
  onClose: () => void;
  onSave: (entry: Entry) => void;
}

const CATEGORIES = ['网站', 'APP', '银行', '其他'];

export default function EntryForm({ t, open, entry, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('网站');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setUsername(entry.username);
      setPassword(entry.password);
      setUrl(entry.url ?? '');
      setNotes(entry.notes ?? '');
      setCategory(entry.category ?? '网站');
    } else {
      setTitle(''); setUsername(''); setPassword('');
      setUrl(''); setNotes(''); setCategory('网站');
    }
    setShowGenerator(false);
    setShowPassword(false);
  }, [entry, open]);

  const handleSave = () => {
    if (!title || !username || !password) return;
    const now = Math.floor(Date.now() / 1000);
    onSave({
      id: entry?.id ?? crypto.randomUUID(),
      title, username, password,
      url: url || undefined,
      notes: notes || undefined,
      category: category || undefined,
      created_at: entry?.created_at ?? now,
      updated_at: now,
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:max-w-[400px] overflow-y-auto bg-card border-border/60 px-0"
      >
        <SheetHeader className="px-6 pb-5 pt-1 border-b border-border/50">
          <SheetTitle className="text-base font-semibold">
            {entry ? t('form.edit_title') : t('form.add_title')}
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 pt-6 pb-8 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t('form.site')} <span className="text-destructive text-xs">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="GitHub"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t('form.username')} <span className="text-destructive text-xs">*</span>
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t('form.password')} <span className="text-destructive text-xs">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="h-10 w-10 shrink-0 border-border/60 text-muted-foreground
                           hover:text-primary hover:border-primary/40 hover:bg-primary/5"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                  : <Eye className="h-4 w-4" strokeWidth={1.75} />
                }
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowGenerator(!showGenerator)}
                className={`h-10 w-10 shrink-0 border-border/60 hover:border-primary/40
                  ${showGenerator
                    ? 'text-primary border-primary/40 bg-primary/5'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
              >
                <Dices className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
            {showGenerator && (
              <div className="mt-2">
                <Generator t={t} onUse={(pwd) => { setPassword(pwd); setShowGenerator(false); }} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('form.url')}</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('form.category')}</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm
                         text-foreground focus:outline-none focus:ring-1 focus:ring-ring
                         focus:border-ring transition-colors"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('form.notes')}</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="..."
              className="w-full rounded-md border border-input bg-background px-3 py-2.5
                         text-sm text-foreground resize-none focus:outline-none focus:ring-1
                         focus:ring-ring focus:border-ring transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1 font-medium"
              disabled={!title || !username || !password}
              onClick={handleSave}
            >
              {t('form.save')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-border/60"
              onClick={onClose}
            >
              {t('form.cancel')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
