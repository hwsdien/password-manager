import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Entry } from '@/lib/tauri';
import { fuzzySearch } from '@/lib/utils';
import EntryForm from './EntryForm';
import DeleteConfirm from './DeleteConfirm';
import {
  Eye, EyeOff, Copy, Check, Pencil, Trash2,
  Settings, Plus, Search, ShieldCheck,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 8;

interface Props {
  t: (key: string) => string;
  entries: Entry[];
  onSave: (entries: Entry[]) => Promise<void>;
  onOpenSettings: () => void;
}

export default function VaultList({ t, entries, onSave, onOpenSettings }: Props) {
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = fuzzySearch(entries, query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to first page when search changes
  useEffect(() => { setPage(1); }, [query]);

  const togglePassword = (id: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (visibleId === id) {
      setVisibleId(null);
    } else {
      setVisibleId(id);
      hideTimer.current = setTimeout(() => setVisibleId(null), 8000);
    }
  };

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const handleSaveEntry = async (entry: Entry) => {
    const exists = entries.find((e) => e.id === entry.id);
    const updated = exists
      ? entries.map((e) => (e.id === entry.id ? entry : e))
      : [...entries, entry];
    await onSave(updated);
  };

  const handleDelete = async (entry: Entry) => {
    await onSave(entries.filter((e) => e.id !== entry.id));
    setDeleteTarget(null);
  };

  const copyPassword = (entry: Entry) => {
    navigator.clipboard.writeText(entry.password);
    setCopied(entry.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 px-5 py-3 bg-card/80 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0 mr-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-sm tracking-wide">{t('setup.title')}</span>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('vault.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 bg-input/60 border-border/50 text-sm focus:border-primary/40"
          />
        </div>

        {/* Add */}
        <Button
          size="sm"
          onClick={() => { setEditEntry(undefined); setFormOpen(true); }}
          className="h-9 px-3.5 gap-1.5 shrink-0 font-medium text-xs"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          {t('vault.add')}
        </Button>

        {/* Settings */}
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          className="h-9 w-9 shrink-0 text-muted-foreground border-border/60 hover:text-primary hover:border-primary/40 hover:bg-primary/8"
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </header>

      {/* List */}
      <div className="flex-1 px-5 py-6 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center mb-5">
              <Search className="w-6 h-6 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">
              {query ? t('vault.empty') : t('vault.empty_sub')}
            </p>
          </div>
        )}

        {paged.map((entry) => (
          <div
            key={entry.id}
            className="entry-card group rounded-xl border border-border/50 bg-card overflow-hidden
                       hover:bg-blue-500/8 transition-all duration-150"
          >
            <div className="flex items-center gap-4 px-6 py-4">
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                              bg-primary/8 border border-primary/15 text-primary font-semibold text-sm">
                {entry.title[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                  {entry.username}{entry.notes && <span className="text-muted-foreground/50"> | {entry.notes}</span>}
                </p>
              </div>

              {entry.category && (
                <Badge
                  variant="secondary"
                  className="text-xs border border-primary/12 text-primary/55 bg-primary/5
                             shrink-0 font-normal px-2 py-0.5"
                >
                  {entry.category}
                </Badge>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  title={visibleId === entry.id ? t('vault.hide_password') : t('vault.show_password')}
                  onClick={() => togglePassword(entry.id)}
                  className={`h-8 w-8 border ${
                    visibleId === entry.id
                      ? 'text-amber-400 border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/15'
                      : 'text-blue-400 border-blue-400/30 hover:bg-blue-500/10'
                  }`}
                >
                  {visibleId === entry.id
                    ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                    : <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                  }
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  title={copied === entry.id ? t('vault.copied') : t('vault.copy_password')}
                  onClick={() => copyPassword(entry)}
                  className={`h-8 w-8 border ${
                    copied === entry.id
                      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/15'
                      : 'text-cyan-400 border-cyan-400/30 hover:bg-cyan-500/10'
                  }`}
                >
                  {copied === entry.id
                    ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                  }
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setEditEntry(entry); setFormOpen(true); }}
                  className="h-8 w-8 border text-violet-400 border-violet-400/30 hover:bg-violet-500/10"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteTarget(entry)}
                  className="h-8 w-8 border text-rose-400 border-rose-400/30 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Button>
              </div>
            </div>

            {/* Inline password reveal */}
            {visibleId === entry.id && (
              <div className="px-6 pb-4 animate-fade-in">
                <div className="ml-[60px] flex items-center gap-3 rounded-lg bg-muted/50
                                border border-primary/15 px-4 py-3">
                  <code className="flex-1 text-xs font-mono text-primary tracking-wide break-all">
                    {entry.password}
                  </code>
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap shrink-0">
                    8s
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          <p className="text-xs text-muted-foreground font-mono">
            {entries.length} 条记录{query ? ` · 匹配 ${filtered.length} 条` : ''}
          </p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
            <span className="text-xs font-mono text-muted-foreground px-1 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground font-mono opacity-50 shrink-0">AES-256-GCM</p>
      </footer>

      <EntryForm
        t={t}
        open={formOpen}
        entry={editEntry}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveEntry}
      />
      <DeleteConfirm
        t={t}
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
