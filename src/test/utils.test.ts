import { describe, it, expect } from 'vitest';
import { fuzzySearch } from '../lib/utils';

const entries = [
  { id: '1', title: 'GitHub', username: 'user@example.com', password: 'p', url: 'https://github.com', notes: null, category: null, created_at: 0, updated_at: 0 },
  { id: '2', title: 'Gmail', username: 'user@gmail.com', password: 'p', url: null, notes: '工作邮箱', category: null, created_at: 0, updated_at: 0 },
  { id: '3', title: '微信', username: '138xxxxxxxx', password: 'p', url: null, notes: null, category: 'APP', created_at: 0, updated_at: 0 },
];

describe('fuzzySearch', () => {
  it('returns all entries for empty query', () => {
    expect(fuzzySearch(entries, '')).toHaveLength(3);
  });

  it('matches title case-insensitively', () => {
    expect(fuzzySearch(entries, 'git')).toHaveLength(1);
    expect(fuzzySearch(entries, 'GIT')).toHaveLength(1);
  });

  it('matches username', () => {
    expect(fuzzySearch(entries, 'gmail.com')).toHaveLength(1);
  });

  it('matches url', () => {
    expect(fuzzySearch(entries, 'github.com')).toHaveLength(1);
  });

  it('matches notes', () => {
    expect(fuzzySearch(entries, '工作')).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    expect(fuzzySearch(entries, 'zzznomatch')).toHaveLength(0);
  });
});
