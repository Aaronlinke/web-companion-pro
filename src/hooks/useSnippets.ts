import { useState, useEffect } from 'react';

export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  description?: string;
  createdAt: Date;
}

const STORAGE_KEY = 'elite_snippets';

// Local storage for now - can be migrated to Supabase later
export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSnippets(parsed.map((s: Snippet) => ({ ...s, createdAt: new Date(s.createdAt) })));
      } catch {
        setSnippets([]);
      }
    }
  }, []);

  const saveSnippet = (snippet: Omit<Snippet, 'id' | 'createdAt'>) => {
    const newSnippet: Snippet = {
      ...snippet,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    const updated = [...snippets, newSnippet];
    setSnippets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newSnippet;
  };

  const deleteSnippet = (id: string) => {
    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const updateSnippet = (id: string, updates: Partial<Snippet>) => {
    const updated = snippets.map(s => s.id === id ? { ...s, ...updates } : s);
    setSnippets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { snippets, saveSnippet, deleteSnippet, updateSnippet };
}
