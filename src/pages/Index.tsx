import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Code2, Play, FileCode, Bot, Download, RotateCcw, RotateCw, Zap, Terminal, Eye, X, Bookmark } from 'lucide-react';
import { SnippetManager } from '@/components/snippets/SnippetManager';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Preview } from '@/components/editor/Preview';
import { TabBar, Tab } from '@/components/editor/TabBar';
import { AiWorkbench } from '@/components/ai/AiWorkbench';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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

const Index: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{
    id: 1,
    title: 'nexus_core.html',
    code: initialCode,
    history: [initialCode],
    historyIndex: 0
  }]);
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [nextTabId, setNextTabId] = useState(2);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'ai'>('editor');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  // Desktop panel visibility
  const [showPreview, setShowPreview] = useState(true);
  const [showAi, setShowAi] = useState(true);
  const [showSnippets, setShowSnippets] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeTab = useMemo(() => tabs.find(tab => tab.id === activeTabId), [tabs, activeTabId]);

  const updateActiveTabCode = useCallback((newCode: string, addToHistory: boolean = true) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        if (!addToHistory) return { ...tab, code: newCode };
        if (newCode === tab.code) return tab;

        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(newCode);
        if (newHistory.length > 100) newHistory.shift();

        return {
          ...tab,
          code: newCode,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleUndo = useCallback(() => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId && tab.historyIndex > 0) {
        const newIndex = tab.historyIndex - 1;
        return { ...tab, code: tab.history[newIndex], historyIndex: newIndex };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleRedo = useCallback(() => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId && tab.historyIndex < tab.history.length - 1) {
        const newIndex = tab.historyIndex + 1;
        return { ...tab, code: tab.history[newIndex], historyIndex: newIndex };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleApplyCode = useCallback((code: string) => {
    updateActiveTabCode(code);
  }, [updateActiveTabCode]);

  const handleFusionComplete = useCallback((code: string, title: string) => {
    const newTab: Tab = {
      id: nextTabId,
      title,
      code,
      history: [code],
      historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(prev => prev + 1);
  }, [nextTabId]);

  const handleAddTab = () => {
    const t: Tab = {
      id: nextTabId,
      title: `module_${nextTabId}.html`,
      code: '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-900 text-white p-8">\n  <h1 class="text-2xl font-bold">Neues Modul</h1>\n</body>\n</html>',
      history: [''],
      historyIndex: 0
    };
    t.history = [t.code];
    setTabs([...tabs, t]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);
  };

  const handleCloseTab = (id: number) => {
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) return;
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
    setTabs(newTabs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const newTab: Tab = {
          id: nextTabId,
          title: file.name,
          code: content,
          history: [content],
          historyIndex: 0
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(nextTabId);
        setNextTabId(nextTabId + 1);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    if (activeTab) {
      const blob = new Blob([activeTab.code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeTab.title;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const canUndo = (activeTab?.historyIndex || 0) > 0;
  const canRedo = (activeTab?.historyIndex || 0) < (activeTab?.history.length || 0) - 1;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Mobile Header */}
        <header className="flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">ELITE</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMobilePreview(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium"
            >
              <Play size={12} />
              Preview
            </button>
            <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 text-muted-foreground disabled:opacity-20">
              <RotateCcw size={14} />
            </button>
            <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 text-muted-foreground disabled:opacity-20">
              <RotateCw size={14} />
            </button>
            <label className="p-1.5 text-muted-foreground">
              <FileCode size={14} />
              <input type="file" className="hidden" accept=".html,.htm" onChange={handleFileUpload} />
            </label>
            <button onClick={handleDownload} className="p-1.5 text-muted-foreground">
              <Download size={14} />
            </button>
            <button onClick={() => setShowSnippets(true)} className="p-1.5 text-muted-foreground">
              <Bookmark size={14} />
            </button>
          </div>
        </header>

        {/* Tab Bar */}
        <div className="px-2 py-1 bg-secondary/30 border-b border-border">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={handleCloseTab}
            onAddTab={handleAddTab}
          />
        </div>

        {/* Main Content - Full Height */}
        <main className="flex-1 overflow-hidden">
          {mobileView === 'editor' ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 border-b border-border">
                <Terminal size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase">{activeTab?.title}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={activeTab?.code || ''} onChange={updateActiveTabCode} isMobile={true} />
              </div>
            </div>
          ) : (
            <AiWorkbench
              currentCode={activeTab?.code || ''}
              onApplyCode={handleApplyCode}
              projectTabs={tabs}
              onFusionComplete={handleFusionComplete}
            />
          )}
        </main>

        {/* Mobile Bottom Nav - Editor/AI Toggle */}
        <nav className="flex bg-card border-t border-border shrink-0 safe-area-pb">
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              mobileView === 'editor' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Code2 size={18} />
            <span className="text-[9px] font-medium uppercase">Code</span>
          </button>
          <button
            onClick={() => setMobileView('ai')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              mobileView === 'ai' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Bot size={18} />
            <span className="text-[9px] font-medium uppercase">AI</span>
          </button>
        </nav>

        {/* Mobile Preview Overlay */}
        {showMobilePreview && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
              <div className="flex items-center gap-2">
                <Play size={14} className="text-primary" />
                <span className="text-xs font-medium text-foreground">Preview</span>
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Preview code={activeTab?.code || ''} />
            </div>
          </div>
        )}

        {/* Snippet Manager */}
        <SnippetManager
          currentCode={activeTab?.code || ''}
          onLoadSnippet={updateActiveTabCode}
          isOpen={showSnippets}
          onClose={() => setShowSnippets(false)}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Desktop Header */}
      <header className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary tracking-wider">ELITE</span>
          </div>
          
          <div className="flex items-center border-l border-border pl-3">
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={handleCloseTab}
              onAddTab={handleAddTab}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Preview"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => setShowAi(!showAi)}
            className={`p-1.5 rounded transition-colors ${showAi ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="AI Panel"
          >
            <Bot size={14} />
          </button>
          
          <div className="w-px h-4 bg-border mx-1" />

          <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
            <RotateCcw size={14} />
          </button>
          <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
            <RotateCw size={14} />
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          <label className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer">
            <FileCode size={14} />
            <input type="file" className="hidden" accept=".html,.htm,.py,.ts,.tsx,.js,.jsx,.json,.sql,.md,.yaml,.yml,.css,.txt" onChange={handleFileUpload} />
          </label>
          <button onClick={handleDownload} className="p-1.5 text-muted-foreground hover:text-foreground">
            <Download size={14} />
          </button>
          <button onClick={() => setShowSnippets(true)} className="p-1.5 text-muted-foreground hover:text-foreground" title="Snippets">
            <Bookmark size={14} />
          </button>
        </div>
      </header>

      {/* Desktop Main Content */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={showAi ? 40 : 50} minSize={25}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 border-b border-border">
                <Terminal size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {activeTab?.title}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={activeTab?.code || ''} onChange={updateActiveTabCode} />
              </div>
            </div>
          </ResizablePanel>

          {showPreview && (
            <>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
              <ResizablePanel defaultSize={showAi ? 30 : 50} minSize={20}>
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
                <AiWorkbench
                  currentCode={activeTab?.code || ''}
                  onApplyCode={handleApplyCode}
                  projectTabs={tabs}
                  onFusionComplete={handleFusionComplete}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>

      {/* Snippet Manager */}
      <SnippetManager
        currentCode={activeTab?.code || ''}
        onLoadSnippet={updateActiveTabCode}
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
      />
    </div>
  );
};

export default Index;