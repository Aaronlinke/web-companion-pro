import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Code2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSnippets, Snippet } from '@/hooks/useSnippets';
import { toast } from 'sonner';

interface SnippetManagerProps {
  currentCode: string;
  onLoadSnippet: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SnippetManager: React.FC<SnippetManagerProps> = ({
  currentCode,
  onLoadSnippet,
  isOpen,
  onClose,
}) => {
  const { snippets, saveSnippet, deleteSnippet } = useSnippets();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLang, setNewLang] = useState('html');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newName.trim()) {
      toast.error('Name eingeben');
      return;
    }
    saveSnippet({
      name: newName.trim(),
      language: newLang,
      code: currentCode,
    });
    toast.success('Snippet gespeichert');
    setNewName('');
    setIsAdding(false);
  };

  const handleLoad = (snippet: Snippet) => {
    onLoadSnippet(snippet.code);
    toast.success(`${snippet.name} geladen`);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSnippet(id);
    toast.success('Snippet gelöscht');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-primary" />
            <span className="font-medium text-sm">Snippets</span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Add new snippet */}
          {isAdding ? (
            <div className="p-3 bg-secondary/50 rounded border border-border space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Snippet Name..."
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none"
                >
                  <option value="html">HTML</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                  <option value="sql">SQL</option>
                </select>
                <Button size="sm" onClick={handleSave} className="h-8">
                  <Check size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8">
                  <X size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary text-sm"
            >
              <Plus size={16} />
              Aktuellen Code speichern
            </button>
          )}

          {/* Snippet list */}
          {snippets.length === 0 && !isAdding && (
            <div className="text-center py-8 text-muted-foreground">
              <Code2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Noch keine Snippets</p>
            </div>
          )}

          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => handleLoad(snippet)}
              className="w-full flex items-center justify-between p-3 bg-secondary/30 rounded border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Code2 size={14} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{snippet.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{snippet.language}</div>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(snippet.id, e)}
                className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
