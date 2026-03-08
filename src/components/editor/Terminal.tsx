import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Terminal as TerminalIcon, X, ChevronRight, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RUNNER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-runner`;

interface RunResult {
  output: string;
  exitCode: number;
  language: string;
  version: string;
  detected: boolean;
  hasError: boolean;
  error?: string;
  durationMs?: number;
}

interface TerminalEntry {
  id: number;
  code: string;
  language?: string;
  result: RunResult | null;
  running: boolean;
  startedAt: number;
}

interface TerminalProps {
  code: string;
  fileName: string;
  onClose: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ code, fileName, onClose }) => {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [stdinInput, setStdinInput] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [nextId, setNextId] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  // Detect language hint from filename extension
  const detectHintFromFileName = (name: string): string | undefined => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ext;
  };

  const runCode = async () => {
    if (!code.trim()) {
      toast.error('Kein Code zum Ausführen');
      return;
    }

    const id = nextId;
    setNextId(p => p + 1);
    const entry: TerminalEntry = {
      id,
      code,
      language: detectHintFromFileName(fileName),
      result: null,
      running: true,
      startedAt: Date.now(),
    };

    setEntries(prev => [...prev, entry]);

    try {
      const res = await fetch(RUNNER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          code,
          language: detectHintFromFileName(fileName),
          stdin: stdinInput,
        }),
      });

      const durationMs = Date.now() - entry.startedAt;
      const data = await res.json();

      if (!res.ok) {
        setEntries(prev => prev.map(e => e.id === id ? {
          ...e,
          running: false,
          result: { output: '', exitCode: 1, language: '?', version: '?', detected: false, hasError: true, error: data.error, durationMs }
        } : e));
        return;
      }

      setEntries(prev => prev.map(e => e.id === id ? {
        ...e,
        running: false,
        result: { ...data, durationMs }
      } : e));

    } catch (err) {
      const durationMs = Date.now() - entry.startedAt;
      setEntries(prev => prev.map(e => e.id === id ? {
        ...e,
        running: false,
        result: { output: '', exitCode: 1, language: '?', version: '?', detected: false, hasError: true, error: 'Verbindungsfehler', durationMs }
      } : e));
    }
  };

  const isRunning = entries.some(e => e.running);

  return (
    <div className="flex flex-col h-full bg-background border-t border-border">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/40 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-primary" />
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Terminal</span>
          <span className="text-[9px] font-mono text-muted-foreground/50">{fileName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowStdin(p => !p)}
            className={`px-2 py-0.5 text-[9px] rounded transition-colors ${showStdin ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title="Stdin / Eingabe"
          >
            stdin
          </button>
          {entries.length > 0 && (
            <button
              onClick={() => setEntries([])}
              className="p-1 text-muted-foreground/40 hover:text-destructive rounded transition-colors"
              title="Verlauf löschen"
            >
              <Trash2 size={10} />
            </button>
          )}
          <button onClick={onClose} className="p-1 text-muted-foreground/40 hover:text-foreground rounded transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Stdin Input */}
      {showStdin && (
        <div className="px-3 py-1.5 bg-secondary/20 border-b border-border flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-muted-foreground shrink-0">stdin:</span>
          <input
            value={stdinInput}
            onChange={e => setStdinInput(e.target.value)}
            placeholder="Eingabe für das Programm (z.B. 42\nhello)"
            className="flex-1 bg-transparent text-[10px] font-mono text-foreground focus:outline-none placeholder:text-muted-foreground/40"
          />
        </div>
      )}

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-2">
            <TerminalIcon size={24} />
            <span className="text-[10px] uppercase tracking-wider">Drücke Run zum Ausführen</span>
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="border-b border-border/30">
            {/* Run Header */}
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20">
              <ChevronRight size={10} className="text-primary" />
              <span className="text-[9px] text-muted-foreground/60 font-mono">
                {new Date(entry.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              {entry.running ? (
                <div className="flex items-center gap-1 ml-1">
                  <Loader2 size={9} className="animate-spin text-primary" />
                  <span className="text-[9px] text-primary">Ausführen…</span>
                </div>
              ) : entry.result && (
                <div className="flex items-center gap-2 ml-1">
                  <span className={`text-[9px] font-mono px-1.5 py-0 rounded ${entry.result.hasError ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                    {entry.result.language}@{entry.result.version}
                  </span>
                  {entry.result.detected && (
                    <span className="text-[9px] text-muted-foreground/40">auto-erkannt</span>
                  )}
                  <span className={`text-[9px] ${entry.result.hasError ? 'text-destructive' : 'text-primary'}`}>
                    exit {entry.result.exitCode}
                  </span>
                  {entry.result.durationMs !== undefined && (
                    <span className="text-[9px] text-muted-foreground/40">{entry.result.durationMs}ms</span>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(entry.result!.error || entry.result!.output);
                      toast.success('Kopiert ✓');
                    }}
                    className="p-0.5 text-muted-foreground/30 hover:text-muted-foreground rounded transition-colors ml-auto"
                  >
                    <Copy size={9} />
                  </button>
                </div>
              )}
            </div>

            {/* Output */}
            {!entry.running && entry.result && (
              <div className={`px-4 py-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed ${
                entry.result.hasError ? 'text-destructive/80' : 'text-foreground/90'
              }`}>
                {entry.result.error ? (
                  <span className="text-destructive">{entry.result.error}</span>
                ) : (
                  entry.result.output || <span className="text-muted-foreground/40 italic">(kein Output)</span>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Run Bar */}
      <div className="px-3 py-2 border-t border-border shrink-0 bg-secondary/20">
        <Button
          onClick={runCode}
          disabled={isRunning || !code.trim()}
          className="w-full h-10 text-xs font-mono bg-primary hover:bg-primary/80 text-primary-foreground gap-2 sm:h-7 sm:text-[10px]"
        >
          {isRunning ? (
            <><Loader2 size={14} className="animate-spin" /> Ausführen…</>
          ) : (
            <><Play size={14} /> Code ausführen</>
          )}
        </Button>
      </div>
    </div>
  );
};
