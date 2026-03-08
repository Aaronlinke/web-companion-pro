import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Code2, Play, FileCode, Bot, Download, RotateCcw, RotateCw,
  Zap, Terminal, Eye, X, Bookmark, Keyboard, Search
} from 'lucide-react';
import { SnippetManager } from '@/components/snippets/SnippetManager';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Preview } from '@/components/editor/Preview';
import { TabBar, Tab } from '@/components/editor/TabBar';
import { AiWorkbench } from '@/components/ai/AiWorkbench';
import { SearchBar } from '@/components/editor/SearchBar';
import { DiffViewer } from '@/components/editor/DiffViewer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { toast } from 'sonner';

const initialCode = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>ELITE_SYSTEM_V3</title>
</head>
<body class="bg-[#020617] text-sky-400 min-h-screen flex items-center justify-center p-4 font-mono">
  <div class="w-full max-w-2xl border border-sky-500/30 bg-slate-950/80 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(0,132,255,0.2)]">
    <div class="flex justify-between items-center mb-8 border-b border-sky-500/20 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-sky-500 animate-ping rounded-full"></div>
        <h1 class="text-sm uppercase tracking-[0.5em] font-black text-sky-500">Elite_Kernel_Active</h1>
      </div>
      <span class="text-[10px] text-sky-900 font-bold">CORE_LOAD_STABLE</span>
    </div>
    <div class="space-y-6">
      <div class="p-6 bg-black/50 border border-sky-900/50 rounded-sm">
        <p class="text-xs text-sky-600 leading-relaxed uppercase tracking-tighter">
          > System-Direktive: Maximaler Funktionserhalt.<br>
          > Logik-Zensur: Deaktiviert.<br>
          > Daten-Integrität: 100% Priorität.
        </p>
      </div>
      <div class="flex gap-3">
        <button onclick="console.log('ELITE_CMD_INIT')" class="flex-1 border border-sky-500/40 bg-sky-500/5 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-sky-500/20 hover:border-sky-500 transition-all">Execute_Primary</button>
        <button onclick="document.body.style.filter='hue-rotate(90deg)'" class="flex-1 border border-sky-500/40 bg-sky-500/5 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-sky-500/20 hover:border-sky-500 transition-all">Shift_Spectrum</button>
      </div>
    </div>
  </div>
</body>
</html>`;

const SHORTCUTS = [
  { keys: 'Ctrl+S', desc: 'Datei herunterladen' },
  { keys: 'Ctrl+Z', desc: 'Rückgängig' },
  { keys: 'Ctrl+Y', desc: 'Wiederholen' },
  { keys: 'Ctrl+F', desc: 'Suchen & Ersetzen' },
  { keys: 'Ctrl+P', desc: 'Preview ein/aus' },
  { keys: 'Ctrl+I', desc: 'AI-Panel ein/aus' },
  { keys: 'Ctrl+T', desc: 'Neuer Tab' },
  { keys: '?', desc: 'Shortcuts anzeigen' },
];

const Index: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{
    id: 1, title: 'nexus_core.html', code: initialCode,
    history: [initialCode], historyIndex: 0
  }]);
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [nextTabId, setNextTabId] = useState(2);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'ai'>('editor');
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [showPreview, setShowPreview] = useState(true);
  const [showAi, setShowAi] = useState(true);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Diff state: pending code waiting for user confirmation
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const { status: backendStatus } = useBackendStatus();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  const updateActiveTabCode = useCallback((newCode: string, addToHistory = true) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      if (!addToHistory) return { ...tab, code: newCode };
      if (newCode === tab.code) return tab;
      const hist = tab.history.slice(0, tab.historyIndex + 1);
      hist.push(newCode);
      if (hist.length > 100) hist.shift();
      return { ...tab, code: newCode, history: hist, historyIndex: hist.length - 1 };
    }));
  }, [activeTabId]);

  const handleUndo = useCallback(() => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId && tab.historyIndex > 0) {
        const idx = tab.historyIndex - 1;
        return { ...tab, code: tab.history[idx], historyIndex: idx };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleRedo = useCallback(() => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId && tab.historyIndex < tab.history.length - 1) {
        const idx = tab.historyIndex + 1;
        return { ...tab, code: tab.history[idx], historyIndex: idx };
      }
      return tab;
    }));
  }, [activeTabId]);

  // AI requests go through Diff first — user must confirm before applying
  const handleApplyCode = useCallback((code: string) => {
    setPendingCode(code);
  }, []);

  const handleConfirmDiff = useCallback(() => {
    if (pendingCode !== null) {
      updateActiveTabCode(pendingCode);
      setPendingCode(null);
      toast.success('Code angewendet ✓');
    }
  }, [pendingCode, updateActiveTabCode]);

  const handleCancelDiff = useCallback(() => {
    setPendingCode(null);
  }, []);

  const handleFusionComplete = useCallback((code: string, title: string) => {
    const t: Tab = { id: nextTabId, title, code, history: [code], historyIndex: 0 };
    setTabs(prev => [...prev, t]);
    setActiveTabId(nextTabId);
    setNextTabId(p => p + 1);
  }, [nextTabId]);

  const handleAddTab = useCallback(() => {
    const blank = '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-900 text-white p-8">\n  <h1 class="text-2xl font-bold">Neues Modul</h1>\n</body>\n</html>';
    const t: Tab = { id: nextTabId, title: `module_${nextTabId}.html`, code: blank, history: [blank], historyIndex: 0 };
    setTabs(prev => [...prev, t]);
    setActiveTabId(nextTabId);
    setNextTabId(p => p + 1);
  }, [nextTabId, tabs]);

  const handleCloseTab = (id: number) => {
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) return;
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
    setTabs(newTabs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const t: Tab = { id: nextTabId, title: file.name, code: content, history: [content], historyIndex: 0 };
      setTabs(prev => [...prev, t]);
      setActiveTabId(nextTabId);
      setNextTabId(p => p + 1);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDownload = useCallback(() => {
    if (!activeTab) return;
    const ext = activeTab.title.includes('.') ? '' : '.html';
    const blob = new Blob([activeTab.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeTab.title + ext; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${activeTab.title} heruntergeladen`);
  }, [activeTab]);

  useKeyboardShortcuts({
    onSave: handleDownload,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onTogglePreview: () => setShowPreview(p => !p),
    onToggleAi: () => setShowAi(p => !p),
    onNewTab: handleAddTab,
    onShowShortcuts: () => setShowShortcuts(p => !p),
    onFind: () => setShowSearch(p => !p),
  });

  const canUndo = (activeTab?.historyIndex ?? 0) > 0;
  const canRedo = (activeTab?.historyIndex ?? 0) < (activeTab?.history.length ?? 0) - 1;

  // Backend status dot
  const statusDot = {
    unknown: { color: 'bg-muted-foreground', title: 'Backend: Unbekannt' },
    waking: { color: 'bg-yellow-500 animate-pulse', title: 'Backend: Aufwachen…' },
    ready: { color: 'bg-primary', title: 'Backend: Bereit' },
    error: { color: 'bg-destructive', title: 'Backend: Fehler' },
  }[backendStatus];

  const headerActions = (mobile = false) => (
    <div className={`flex items-center ${mobile ? 'gap-0.5' : 'gap-1'}`}>
      {!mobile && (
        <>
          <button onClick={() => setShowPreview(p => !p)}
            className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Preview (Ctrl+P)">
            <Eye size={14} />
          </button>
          <button onClick={() => setShowAi(p => !p)}
            className={`p-1.5 rounded transition-colors ${showAi ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="AI Panel (Ctrl+I)">
            <Bot size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
        </>
      )}
      {mobile && (
        <button onClick={() => setShowMobilePreview(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
          <Play size={12} /> Preview
        </button>
      )}
      <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20" title="Undo (Ctrl+Z)">
        <RotateCcw size={14} />
      </button>
      <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20" title="Redo (Ctrl+Y)">
        <RotateCw size={14} />
      </button>
      <div className="w-px h-4 bg-border mx-0.5" />
      <label className={`p-1.5 text-muted-foreground hover:text-foreground cursor-pointer`} title="Datei öffnen">
        <FileCode size={14} />
        <input type="file" className="hidden"
          accept=".html,.htm,.py,.ts,.tsx,.js,.jsx,.json,.sql,.md,.yaml,.yml,.css,.txt"
          onChange={handleFileUpload} />
      </label>
      <button onClick={handleDownload} className="p-1.5 text-muted-foreground hover:text-foreground" title="Download (Ctrl+S)">
        <Download size={14} />
      </button>
      <button onClick={() => setShowSnippets(true)} className="p-1.5 text-muted-foreground hover:text-foreground" title="Snippets">
        <Bookmark size={14} />
      </button>
      {!mobile && (
        <button onClick={() => setShowShortcuts(p => !p)} className="p-1.5 text-muted-foreground hover:text-foreground" title="Shortcuts (?)">
          <Keyboard size={14} />
        </button>
      )}
    </div>
  );

  // ── Mobile Layout ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <header className="flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">ELITE</span>
            <div className={`w-1.5 h-1.5 rounded-full ${statusDot.color}`} title={statusDot.title} />
          </div>
          {headerActions(true)}
        </header>

        <div className="px-2 py-1 bg-secondary/30 border-b border-border">
          <TabBar tabs={tabs} activeTabId={activeTabId}
            onSelectTab={setActiveTabId} onCloseTab={handleCloseTab} onAddTab={handleAddTab} />
        </div>

        <main className="flex-1 overflow-hidden">
          {mobileView === 'editor' ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 border-b border-border">
                <Terminal size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase">{activeTab?.title}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={activeTab?.code || ''} onChange={updateActiveTabCode} isMobile />
              </div>
            </div>
          ) : (
            <AiWorkbench currentCode={activeTab?.code || ''} onApplyCode={handleApplyCode}
              projectTabs={tabs} onFusionComplete={handleFusionComplete} />
          )}
        </main>

        <nav className="flex bg-card border-t border-border shrink-0">
          {[{ view: 'editor', icon: <Code2 size={18} />, label: 'Code' }, { view: 'ai', icon: <Bot size={18} />, label: 'AI' }].map(({ view, icon, label }) => (
            <button key={view} onClick={() => setMobileView(view as 'editor' | 'ai')}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${mobileView === view ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              {icon}
              <span className="text-[9px] font-medium uppercase">{label}</span>
            </button>
          ))}
        </nav>

        {showMobilePreview && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
              <div className="flex items-center gap-2">
                <Play size={14} className="text-primary" />
                <span className="text-xs font-medium">Preview</span>
              </div>
              <button onClick={() => setShowMobilePreview(false)} className="p-2 text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Preview code={activeTab?.code || ''} />
            </div>
          </div>
        )}

        <SnippetManager currentCode={activeTab?.code || ''} onLoadSnippet={updateActiveTabCode}
          isOpen={showSnippets} onClose={() => setShowSnippets(false)} />
      </div>
    );
  }

  // ── Desktop Layout ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary tracking-wider">ELITE</span>
            {/* Backend status */}
            <div className={`w-1.5 h-1.5 rounded-full ${statusDot.color}`} title={statusDot.title} />
          </div>
          <div className="flex items-center border-l border-border pl-3">
            <TabBar tabs={tabs} activeTabId={activeTabId}
              onSelectTab={setActiveTabId} onCloseTab={handleCloseTab} onAddTab={handleAddTab} />
          </div>
        </div>
        {headerActions(false)}
      </header>

      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={showAi ? 40 : 50} minSize={20}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 border-b border-border">
                <Terminal size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{activeTab?.title}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setShowSearch(p => !p)}
                    className={`p-1 rounded transition-colors ${showSearch ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary'}`}
                    title="Suchen (Ctrl+F)"
                  >
                    <Search size={10} />
                  </button>
                  <span className="text-[9px] text-muted-foreground/40 font-mono">
                    {(activeTab?.code.split('\n').length ?? 0)} lines
                  </span>
                </div>
              </div>
              {showSearch && (
                <SearchBar
                  code={activeTab?.code || ''}
                  onChange={updateActiveTabCode}
                  onClose={() => setShowSearch(false)}
                />
              )}
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={activeTab?.code || ''} onChange={updateActiveTabCode} />
              </div>
            </div>
          </ResizablePanel>

          {showPreview && (
            <>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
              <ResizablePanel defaultSize={showAi ? 30 : 50} minSize={15}>
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 border-b border-border">
                    <Play size={12} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Preview code={activeTab?.code || ''} />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}

          {showAi && (
            <>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
              <ResizablePanel defaultSize={30} minSize={20}>
                <AiWorkbench currentCode={activeTab?.code || ''} onApplyCode={handleApplyCode}
                  projectTabs={tabs} onFusionComplete={handleFusionComplete} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>

      {/* Diff Viewer – shown when AI proposes code changes */}
      {pendingCode !== null && activeTab && (
        <DiffViewer
          originalCode={activeTab.code}
          newCode={pendingCode}
          onConfirm={handleConfirmDiff}
          onCancel={handleCancelDiff}
        />
      )}

      {/* Shortcuts overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border border-border rounded-lg p-5 w-72" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard size={14} className="text-primary" />
                <span className="text-sm font-medium">Tastenkürzel</span>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{desc}</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[10px] font-mono">{keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SnippetManager currentCode={activeTab?.code || ''} onLoadSnippet={updateActiveTabCode}
        isOpen={showSnippets} onClose={() => setShowSnippets(false)} />
    </div>
  );
};

export default Index;
