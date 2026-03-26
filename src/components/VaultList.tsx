import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Entry } from '@/lib/tauri';
import { fuzzySearch } from '@/lib/utils';
import EntryForm from './EntryForm';
import DeleteConfirm from './DeleteConfirm';
import {
  Eye, EyeOff, Copy, Check, Pencil, Trash2,
  Settings, Plus, Search, ShieldCheck,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// Estimated height per card (px): py-3.5*2 + avatar h-10 + border + space-y-2 gap
const CARD_H = 78;

interface Props {
  t: (key: string) => string;
  entries: Entry[];
  onSave: (entries: Entry[]) => Promise<void>;
  onOpenSettings: () => void;
}

/** Collapsed page numbers with ellipsis for long ranges */
function pageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export default function VaultList({ t, entries, onSave, onOpenSettings }: Props) {
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ── Dynamic page size via ResizeObserver ── */
  const updatePageSize = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    setPageSize(Math.max(3, Math.floor((h - 32) / CARD_H)));
  }, []);

  useEffect(() => {
    updatePageSize();
    const obs = new ResizeObserver(updatePageSize);
    if (listRef.current) obs.observe(listRef.current);
    return () => obs.disconnect();
  }, [updatePageSize]);

  const filtered = fuzzySearch(entries, query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const btn = (key: string) => t(key).replace(/密码| password/gi, '').trim();

  const copyPassword = (entry: Entry) => {
    navigator.clipboard.writeText(entry.password);
    setCopied(entry.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex h-screen flex-col bg-background">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 border-b border-border/60 px-5 py-3 bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center border border-primary/40 bg-primary/12 text-primary">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className="text-[15px] font-bold tracking-[0.05em] text-foreground">
            {t('setup.title')}
          </span>
        </div>

        <div className="h-4 w-px bg-border mx-0.5" />

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('vault.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 bg-input/40 border-border/50 text-sm focus:border-primary/40"
          />
        </div>

        <Button
          size="sm"
          onClick={() => { setEditEntry(undefined); setFormOpen(true); }}
          className="h-9 px-4 gap-2 shrink-0 text-sm font-semibold tracking-[0.04em]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {t('vault.add')}
        </Button>

        <Button
          variant="outline"
          onClick={onOpenSettings}
          className="h-9 px-3.5 gap-2 shrink-0 text-sm text-muted-foreground border-border/50 hover:text-primary hover:border-primary/40 hover:bg-primary/5"
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
          {t('settings.title')}
        </Button>
      </header>

      {/* ── List (fills remaining height) ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 border border-border/35 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground/35" strokeWidth={1.25} />
            </div>
            <p className="text-xs font-mono text-muted-foreground/45 tracking-[0.3em] uppercase">
              {query ? t('vault.empty') : t('vault.empty_sub')}
            </p>
          </div>
        )}

        {paged.map((entry) => (
          <div
            key={entry.id}
            className="entry-card group border border-border/50 bg-card hover:bg-primary/[0.03] hover:border-primary/25"
          >
            <div className="flex items-center gap-4 px-4 py-3.5">
              {/* Angular avatar */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary font-bold text-sm"
                style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
              >
                {entry.title[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] tracking-[0.02em] truncate text-foreground">
                  {entry.title}
                </p>
                <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                  {entry.username}
                  {entry.notes && <span className="text-muted-foreground/40"> · {entry.notes}</span>}
                </p>
              </div>

              {/* Category */}
              {entry.category && (
                <span className="text-[10px] font-mono tracking-widest text-primary/60 border border-primary/20 px-2.5 py-0.5 shrink-0 uppercase">
                  {entry.category}
                </span>
              )}

              {/* ── Colour-coded action buttons ── */}
              <div className="flex items-center gap-1 shrink-0">

                {/* 🔵 显示/隐藏 — cyan */}
                <button
                  onClick={() => togglePassword(entry.id)}
                  className={`flex items-center gap-1.5 h-8 px-3 text-xs font-mono border transition-all duration-150 ${
                    visibleId === entry.id
                      ? 'text-cyan-100 border-cyan-400/70 bg-cyan-400/30 hover:bg-cyan-400/38'
                      : 'text-cyan-400 border-cyan-400/50 bg-cyan-400/12 hover:text-cyan-100 hover:border-cyan-300/70 hover:bg-cyan-400/25'
                  }`}
                >
                  {visibleId === entry.id
                    ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                    : <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  <span>{visibleId === entry.id ? btn('vault.hide_password') : btn('vault.show_password')}</span>
                </button>

                {/* 🟢 复制 — emerald */}
                <button
                  onClick={() => copyPassword(entry)}
                  className={`flex items-center gap-1.5 h-8 px-3 text-xs font-mono border transition-all duration-150 ${
                    copied === entry.id
                      ? 'text-emerald-100 border-emerald-400/70 bg-emerald-400/30 hover:bg-emerald-400/38'
                      : 'text-emerald-400 border-emerald-400/50 bg-emerald-400/12 hover:text-emerald-100 hover:border-emerald-300/70 hover:bg-emerald-400/25'
                  }`}
                >
                  {copied === entry.id
                    ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  <span>{copied === entry.id ? t('vault.copied') : btn('vault.copy_password')}</span>
                </button>

                {/* 🟣 编辑 — violet */}
                <button
                  onClick={() => { setEditEntry(entry); setFormOpen(true); }}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-mono border border-violet-400/50 bg-violet-400/12 text-violet-400 hover:text-violet-100 hover:border-violet-300/70 hover:bg-violet-400/25 transition-all duration-150"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>{btn('form.edit_title')}</span>
                </button>

                {/* 🔴 删除 — rose */}
                <button
                  onClick={() => setDeleteTarget(entry)}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-mono border border-rose-400/50 bg-rose-400/12 text-rose-400 hover:text-rose-100 hover:border-rose-300/70 hover:bg-rose-400/25 transition-all duration-150"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>{t('vault.delete')}</span>
                </button>

              </div>
            </div>

            {/* Inline password reveal */}
            {visibleId === entry.id && (
              <div className="px-4 pb-4 animate-fade-in">
                <div className="ml-[56px] flex items-center gap-3 border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
                  <code className="flex-1 text-xs font-mono text-cyan-300 tracking-wider break-all">
                    {entry.password}
                  </code>
                  <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0">8s</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Footer / Pagination ── */}
      <footer className="shrink-0 border-t border-border/50 px-5 py-2.5 flex items-center justify-between gap-4 bg-card/60">

        {/* Record count */}
        <div className="flex items-center gap-2 shrink-0 min-w-[100px]">
          <div className="w-1.5 h-1.5 bg-primary/50" />
          <p className="text-xs font-mono text-muted-foreground">
            {entries.length} 条记录{query ? ` · ${filtered.length} 条` : ''}
          </p>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">

            {/* Prev — bordered, directional */}
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-mono border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
              {t('vault.prev_page')}
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-border/60" />

            {/* Page number blocks */}
            {pageNums(currentPage, totalPages).map((n, i) =>
              n === '…' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="h-7 w-5 flex items-center justify-center text-[11px] font-mono text-muted-foreground/35 select-none"
                >
                  ···
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  className={`h-7 min-w-[28px] px-1 text-xs font-mono border transition-all duration-150 ${
                    n === currentPage
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]'
                      : 'bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10'
                  }`}
                >
                  {n}
                </button>
              )
            )}

            {/* Divider */}
            <div className="h-4 w-px bg-border/60" />

            {/* Next */}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-mono border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              {t('vault.next_page')}
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
            </button>

          </div>
        )}

        {/* Crypto tag */}
        <p className="text-[10px] font-mono text-muted-foreground/30 tracking-widest shrink-0 min-w-[80px] text-right">
          AES-256-GCM
        </p>
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
