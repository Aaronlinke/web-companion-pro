import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown, Replace } from 'lucide-react';

interface SearchBarProps {
  code: string;
  onChange: (newCode: string) => void;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ code, onChange, onClose }) => {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [query]);

  const matches = React.useMemo(() => {
    if (!query) return [];
    const result: number[] = [];
    let idx = 0;
    const lower = code.toLowerCase();
    const q = query.toLowerCase();
    while ((idx = lower.indexOf(q, idx)) !== -1) {
      result.push(idx);
      idx += q.length;
    }
    return result;
  }, [code, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      navigate(1);
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const navigate = useCallback((dir: 1 | -1) => {
    if (matches.length === 0) return;
    setCurrentIndex(prev => (prev + dir + matches.length) % matches.length);
  }, [matches]);

  const handleReplace = () => {
    if (!query || matches.length === 0) return;
    const pos = matches[currentIndex];
    const newCode = code.slice(0, pos) + replaceText + code.slice(pos + query.length);
    onChange(newCode);
  };

  const handleReplaceAll = () => {
    if (!query) return;
    const newCode = code.split(query).join(replaceText);
    onChange(newCode);
    onClose();
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-card border-b border-border shrink-0 flex-wrap">
      {/* Search */}
      <div className="flex items-center gap-1 bg-secondary rounded px-2 py-1 min-w-0 flex-1 max-w-xs">
        <Search size={10} className="text-muted-foreground shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Suchen…"
          className="bg-transparent text-xs text-foreground outline-none w-full min-w-0 placeholder:text-muted-foreground"
        />
        {query && matches.length > 0 && (
          <span className="text-[9px] text-muted-foreground font-mono shrink-0">
            {currentIndex + 1}/{matches.length}
          </span>
        )}
        {query && matches.length === 0 && (
          <span className="text-[9px] text-destructive shrink-0">0</span>
        )}
      </div>

      {/* Nav */}
      <button onClick={() => navigate(-1)} disabled={!query || matches.length === 0}
        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-secondary">
        <ChevronUp size={12} />
      </button>
      <button onClick={() => navigate(1)} disabled={!query || matches.length === 0}
        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-secondary">
        <ChevronDown size={12} />
      </button>

      {/* Replace toggle */}
      <button
        onClick={() => setShowReplace(p => !p)}
        className={`p-1 rounded transition-colors ${showReplace ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
        title="Ersetzen"
      >
        <Replace size={12} />
      </button>

      {/* Replace field */}
      {showReplace && (
        <>
          <div className="flex items-center gap-1 bg-secondary rounded px-2 py-1 min-w-0 flex-1 max-w-xs">
            <input
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
              placeholder="Ersetzen durch…"
              className="bg-transparent text-xs text-foreground outline-none w-full min-w-0 placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleReplace}
            disabled={!query || matches.length === 0}
            className="text-[9px] px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground rounded disabled:opacity-30"
          >
            Ersetzen
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={!query || matches.length === 0}
            className="text-[9px] px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded disabled:opacity-30"
          >
            Alle
          </button>
        </>
      )}

      <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary ml-auto">
        <X size={12} />
      </button>
    </div>
  );
};
