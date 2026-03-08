import React, { useMemo } from 'react';
import { X, Check, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiffLine {
  type: 'equal' | 'add' | 'remove';
  content: string;
  lineNo?: number;
}

function computeDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: DiffLine[] = [];
  let i = m, j = n;
  const tmp: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      tmp.push({ type: 'equal', content: oldLines[i - 1], lineNo: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tmp.push({ type: 'add', content: newLines[j - 1], lineNo: j });
      j--;
    } else {
      tmp.push({ type: 'remove', content: oldLines[i - 1] });
      i--;
    }
  }

  return tmp.reverse();
}

interface DiffViewerProps {
  originalCode: string;
  newCode: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  newCode,
  onConfirm,
  onCancel,
}) => {
  const diff = useMemo(() => computeDiff(originalCode, newCode), [originalCode, newCode]);

  const stats = useMemo(() => ({
    added: diff.filter(l => l.type === 'add').length,
    removed: diff.filter(l => l.type === 'remove').length,
  }), [diff]);

  // Only show lines near changes (context = 3)
  const CONTEXT = 3;
  const changedIndices = new Set(
    diff.map((l, i) => l.type !== 'equal' ? i : -1).filter(i => i >= 0)
  );
  const visibleIndices = new Set<number>();
  changedIndices.forEach(ci => {
    for (let k = Math.max(0, ci - CONTEXT); k <= Math.min(diff.length - 1, ci + CONTEXT); k++)
      visibleIndices.add(k);
  });

  const visibleDiff: Array<DiffLine | { type: 'separator' }> = [];
  let lastShown = -1;
  diff.forEach((line, i) => {
    if (!visibleIndices.has(i)) return;
    if (lastShown >= 0 && i > lastShown + 1)
      visibleDiff.push({ type: 'separator' });
    visibleDiff.push(line);
    lastShown = i;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare size={14} className="text-primary" />
            <span className="text-sm font-medium">Code-Diff</span>
            <span className="text-[10px] text-muted-foreground ml-1">Vorschau der KI-Änderungen</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-green-400">+{stats.added}</span>
            <span className="text-[10px] font-mono text-destructive">−{stats.removed}</span>
            <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
          {visibleDiff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Keine Unterschiede gefunden</div>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {visibleDiff.map((item, i) => {
                  if (item.type === 'separator') {
                    return (
                      <tr key={`sep-${i}`} className="bg-secondary/20">
                        <td colSpan={2} className="px-4 py-0.5 text-[9px] text-muted-foreground/50 select-none">
                          ···
                        </td>
                      </tr>
                    );
                  }
                  const line = item as DiffLine;
                  const bg =
                    line.type === 'add' ? 'bg-green-500/10 border-l-2 border-green-500/60' :
                    line.type === 'remove' ? 'bg-destructive/10 border-l-2 border-destructive/60' :
                    '';
                  const textColor =
                    line.type === 'add' ? 'text-green-400' :
                    line.type === 'remove' ? 'text-destructive/80' :
                    'text-muted-foreground/70';
                  const prefix =
                    line.type === 'add' ? '+' :
                    line.type === 'remove' ? '−' : ' ';

                  return (
                    <tr key={i} className={`${bg} hover:bg-secondary/30`}>
                      <td className={`pl-3 pr-2 py-0.5 select-none w-6 ${textColor} opacity-60`}>
                        {prefix}
                      </td>
                      <td className="pr-4 py-0.5 whitespace-pre overflow-x-auto text-foreground/90">
                        {line.content}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
            <X size={12} className="mr-1" /> Abbrechen
          </Button>
          <Button size="sm" onClick={onConfirm} className="text-xs bg-primary hover:bg-primary/80">
            <Check size={12} className="mr-1" /> Anwenden
          </Button>
        </div>
      </div>
    </div>
  );
};
