import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Entry } from './tauri';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fuzzySearch(entries: Entry[], query: string): Entry[] {
  if (!query.trim()) return entries;
  const q = query.toLowerCase();
  return entries.filter((e) =>
    [e.title, e.username, e.url ?? '', e.notes ?? '']
      .some((field) => field.toLowerCase().includes(q))
  );
}
